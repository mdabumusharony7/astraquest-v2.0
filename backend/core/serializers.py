from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from core.models import (
    Commander,
    CommanderProfile,
    Mission,
    MissionResult,
    StoreItem,
    StorePurchase,
)


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommanderProfile
        fields = ["display_name", "coins", "diamonds"]
        read_only_fields = ["coins", "diamonds"]


class CommanderSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = Commander
        fields = ["id", "email", "profile"]
        read_only_fields = fields


class RegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    display_name = serializers.CharField(max_length=60)
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_email(self, value):
        value = value.lower()
        if Commander.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_display_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("A commander name is required.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop("password")
        display_name = validated_data.pop("display_name")
        user = Commander.objects.create_user(
            password=password,
            **validated_data,
        )
        user.profile.display_name = display_name
        user.profile.save(update_fields=["display_name"])
        starter_items = StoreItem.objects.filter(
            category=StoreItem.Category.ROCKET,
            is_available=True,
            metadata__owned_by_default=True,
        )
        StorePurchase.objects.bulk_create(
            [
                StorePurchase(commander=user, item=item, price_paid=0)
                for item in starter_items
            ],
            ignore_conflicts=True,
        )
        return user


class CommanderTokenSerializer(TokenObtainPairSerializer):
    username_field = Commander.EMAIL_FIELD

    @classmethod
    def get_token(cls, user):
        token = RefreshToken.for_user(user)
        token["email"] = user.email
        return token


def authentication_payload(user):
    refresh = RefreshToken.for_user(user)
    refresh["email"] = user.email
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "user": CommanderSerializer(user).data,
    }


class MissionSerializer(serializers.ModelSerializer):
    day = serializers.IntegerField(required=False, min_value=1, max_value=32767)
    duration_days = serializers.IntegerField(
        required=False,
        min_value=1,
        max_value=32767,
    )
    crew_size = serializers.IntegerField(required=False, min_value=1, max_value=32767)

    class Meta:
        model = Mission
        fields = [
            "id",
            "destination",
            "status",
            "day",
            "duration_days",
            "crew_size",
            "selected_rocket",
            "resources",
            "schedule",
            "config",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "status", "created_at", "updated_at"]

    def validate(self, attrs):
        destination = attrs.get(
            "destination",
            getattr(self.instance, "destination", None),
        )
        duration_days = attrs.get("duration_days")
        if duration_days is None and self.instance is None:
            attrs["duration_days"] = 7 if destination == Mission.Destination.MOON else 30
        return attrs


class MissionResultSerializer(serializers.ModelSerializer):
    score = serializers.IntegerField(min_value=0, max_value=10)

    class Meta:
        model = MissionResult
        fields = [
            "id",
            "mission",
            "result_type",
            "title",
            "score",
            "details",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_mission(self, mission):
        if mission.commander_id != self.context["request"].user.id:
            raise serializers.ValidationError("This mission does not belong to your account.")
        return mission


class StoreItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreItem
        fields = ["code", "name", "category", "description", "price", "metadata"]


class StorePurchaseSerializer(serializers.Serializer):
    item_code = serializers.SlugField(max_length=60)

    def validate_item_code(self, value):
        try:
            item = StoreItem.objects.get(code=value, is_available=True)
        except StoreItem.DoesNotExist as error:
            raise serializers.ValidationError("This item is not available.") from error
        self.context["item"] = item
        return value


class PurchaseRecordSerializer(serializers.ModelSerializer):
    item = StoreItemSerializer(read_only=True)

    class Meta:
        model = StorePurchase
        fields = ["id", "item", "price_paid", "purchased_at"]
