from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from core.forms import CommanderChangeForm, CommanderCreationForm
from core.models import (
    Commander,
    CommanderProfile,
    Mission,
    MissionResult,
    StoreItem,
    StorePurchase,
)


class CommanderProfileInline(admin.StackedInline):
    model = CommanderProfile
    can_delete = False


@admin.register(Commander)
class CommanderAdmin(UserAdmin):
    form = CommanderChangeForm
    add_form = CommanderCreationForm
    ordering = ["email"]
    list_display = ["email", "is_staff", "is_active"]
    search_fields = ["email"]
    fieldsets = [
        (None, {"fields": ["email", "password"]}),
        ("Permissions", {"fields": ["is_active", "is_staff", "is_superuser", "groups", "user_permissions"]}),
        ("Dates", {"fields": ["last_login", "date_joined"]}),
    ]
    add_fieldsets = [
        (None, {"classes": ["wide"], "fields": ["email", "password1", "password2"]}),
    ]
    inlines = [CommanderProfileInline]


@admin.register(Mission)
class MissionAdmin(admin.ModelAdmin):
    list_display = ["id", "commander", "destination", "status", "day", "updated_at"]
    list_filter = ["destination", "status"]
    search_fields = ["commander__email"]


@admin.register(MissionResult)
class MissionResultAdmin(admin.ModelAdmin):
    list_display = ["id", "mission", "result_type", "score", "created_at"]
    list_filter = ["result_type"]


@admin.register(StoreItem)
class StoreItemAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "category", "price", "is_available"]
    list_filter = ["category", "is_available"]
    search_fields = ["code", "name"]


@admin.register(StorePurchase)
class StorePurchaseAdmin(admin.ModelAdmin):
    list_display = ["commander", "item", "price_paid", "purchased_at"]
