from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.db.models import Count, Sum
from rest_framework import mixins, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import (
    CommanderProfile,
    Mission,
    MissionResult,
    StoreItem,
    StorePurchase,
)
from core.serializers import (
    CommanderSerializer,
    MissionResultSerializer,
    MissionSerializer,
    PurchaseRecordSerializer,
    RegistrationSerializer,
    StoreItemSerializer,
    StorePurchaseSerializer,
    authentication_payload,
)

Commander = get_user_model()


class RegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(authentication_payload(user), status=status.HTTP_201_CREATED)


class CommanderView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        CommanderProfile.objects.get_or_create(
            user=request.user,
            defaults={"display_name": request.user.email.split("@", maxsplit=1)[0]},
        )
        return Response(CommanderSerializer(request.user).data)


class MissionViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = MissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Mission.objects.filter(commander=self.request.user)

    def perform_create(self, serializer):
        serializer.save(commander=self.request.user)


class MissionResultViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = MissionResultSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MissionResult.objects.filter(mission__commander=self.request.user).select_related(
            "mission",
        )

    def perform_create(self, serializer):
        result = serializer.save()
        if result.result_type == MissionResult.ResultType.MISSION:
            outcome = result.details.get("outcome")
            if outcome in {"success", "failed"}:
                result.mission.status = (
                    Mission.Status.COMPLETED
                    if outcome == "success"
                    else Mission.Status.FAILED
                )
                result.mission.save(update_fields=["status", "updated_at"])


class StoreItemViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StoreItemSerializer
    permission_classes = [AllowAny]
    lookup_field = "code"

    def get_queryset(self):
        queryset = StoreItem.objects.filter(is_available=True)
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category)
        return queryset


class StoreInventoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        purchases = StorePurchase.objects.filter(commander=request.user).select_related("item")
        profile = request.user.profile
        return Response(
            {
                "profile": {
                    "display_name": profile.display_name,
                    "coins": profile.coins,
                    "diamonds": profile.diamonds,
                },
                "items": PurchaseRecordSerializer(purchases, many=True).data,
            },
        )


class StorePurchaseView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = StorePurchaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = serializer.context["item"]

        profile = CommanderProfile.objects.select_for_update().get(user=request.user)
        if StorePurchase.objects.filter(commander=request.user, item=item).exists():
            raise ValidationError({"item_code": "This item is already in your inventory."})
        if profile.coins < item.price:
            return Response(
                {"detail": "You do not have enough coins.", "coins": profile.coins},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            purchase = StorePurchase.objects.create(
                commander=request.user,
                item=item,
                price_paid=item.price,
            )
        except IntegrityError as error:
            raise ValidationError({"item_code": "This item is already in your inventory."}) from error

        profile.coins -= item.price
        profile.save(update_fields=["coins"])
        return Response(
            {
                "purchase": PurchaseRecordSerializer(purchase).data,
                "coins": profile.coins,
            },
            status=status.HTTP_201_CREATED,
        )


class LeaderboardView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            limit = min(max(int(request.query_params.get("limit", 10)), 1), 100)
        except ValueError as error:
            raise ValidationError({"limit": "Enter a whole number between 1 and 100."}) from error

        commanders = (
            Commander.objects.filter(missions__results__isnull=False)
            .select_related("profile")
            .annotate(
                total_score=Sum("missions__results__score"),
                missions_played=Count("missions", distinct=True),
            )
            .order_by("-total_score", "email")[:limit]
        )
        return Response(
            [
                {
                    "rank": rank,
                    "display_name": commander.profile.display_name,
                    "total_score": commander.total_score or 0,
                    "missions_played": commander.missions_played,
                }
                for rank, commander in enumerate(commanders, start=1)
            ],
        )
