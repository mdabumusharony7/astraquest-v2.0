from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from core.views import (
    CommanderView,
    LeaderboardView,
    MissionResultViewSet,
    MissionViewSet,
    RegistrationView,
    StoreInventoryView,
    StoreItemViewSet,
    StorePurchaseView,
)

router = DefaultRouter()
router.register("missions", MissionViewSet, basename="mission")
router.register("results", MissionResultViewSet, basename="result")
router.register("store/items", StoreItemViewSet, basename="store-item")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/register/", RegistrationView.as_view(), name="register"),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/me/", CommanderView.as_view(), name="commander"),
    path("api/store/inventory/", StoreInventoryView.as_view(), name="store-inventory"),
    path("api/store/purchases/", StorePurchaseView.as_view(), name="store-purchase"),
    path("api/leaderboard/", LeaderboardView.as_view(), name="leaderboard"),
    path("api/", include(router.urls)),
]
