from django.db.models.signals import post_save
from django.dispatch import receiver

from core.models import CommanderProfile, Commander


@receiver(post_save, sender=Commander)
def create_commander_profile(sender, instance, created, **kwargs):
    if created:
        CommanderProfile.objects.create(
            user=instance,
            display_name=instance.email.split("@", maxsplit=1)[0],
        )
