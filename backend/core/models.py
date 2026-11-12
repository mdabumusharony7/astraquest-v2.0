from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models


class CommanderManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("An email address is required.")
        user = self.model(email=self.normalize_email(email).lower(), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        if not extra_fields["is_staff"] or not extra_fields["is_superuser"]:
            raise ValueError("A superuser must have staff and superuser permissions.")
        return self.create_user(email, password, **extra_fields)


class Commander(AbstractUser):
    username = None
    email = models.EmailField(unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
    objects = CommanderManager()


class CommanderProfile(models.Model):
    user = models.OneToOneField(
        Commander,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    display_name = models.CharField(max_length=60)
    coins = models.PositiveIntegerField(default=1200)
    diamonds = models.PositiveIntegerField(default=25)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.display_name


class Mission(models.Model):
    class Destination(models.TextChoices):
        MOON = "moon", "Moon"
        MARS = "mars", "Mars"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    commander = models.ForeignKey(
        Commander,
        on_delete=models.CASCADE,
        related_name="missions",
    )
    destination = models.CharField(max_length=8, choices=Destination.choices)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    day = models.PositiveSmallIntegerField(default=1)
    duration_days = models.PositiveSmallIntegerField()
    crew_size = models.PositiveSmallIntegerField(default=4)
    selected_rocket = models.CharField(max_length=80, blank=True)
    resources = models.JSONField(default=dict)
    schedule = models.JSONField(default=list)
    config = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(day__gte=1),
                name="mission_day_at_least_one",
            ),
            models.CheckConstraint(
                condition=models.Q(duration_days__gte=1),
                name="mission_duration_at_least_one",
            ),
        ]

    def __str__(self):
        return f"{self.get_destination_display()} mission for {self.commander.email}"


class MissionResult(models.Model):
    class ResultType(models.TextChoices):
        CRISIS = "crisis", "Crisis"
        MISSION = "mission", "Mission"

    mission = models.ForeignKey(
        Mission,
        on_delete=models.CASCADE,
        related_name="results",
    )
    result_type = models.CharField(max_length=10, choices=ResultType.choices)
    title = models.CharField(max_length=120)
    score = models.PositiveSmallIntegerField()
    details = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(score__lte=10),
                name="mission_result_score_max_ten",
            ),
        ]


class StoreItem(models.Model):
    class Category(models.TextChoices):
        ROCKET = "rocket", "Rocket"
        CREW = "crew", "Crew"
        UPGRADE = "upgrade", "Upgrade"

    code = models.SlugField(max_length=60, unique=True)
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=10, choices=Category.choices)
    description = models.TextField(blank=True)
    price = models.PositiveIntegerField()
    metadata = models.JSONField(default=dict)
    is_available = models.BooleanField(default=True)

    class Meta:
        ordering = ["category", "price", "name"]

    def __str__(self):
        return self.name


class StorePurchase(models.Model):
    commander = models.ForeignKey(
        Commander,
        on_delete=models.CASCADE,
        related_name="purchases",
    )
    item = models.ForeignKey(StoreItem, on_delete=models.PROTECT)
    price_paid = models.PositiveIntegerField()
    purchased_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-purchased_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["commander", "item"],
                name="unique_store_purchase_per_commander",
            ),
        ]
