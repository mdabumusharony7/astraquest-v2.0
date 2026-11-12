from django.core.management.base import BaseCommand

from core.models import StoreItem


ITEMS = [
    {
        "code": "moon-explorer",
        "name": "Lunar Explorer",
        "category": StoreItem.Category.ROCKET,
        "description": "A dependable starter spacecraft for lunar missions.",
        "price": 0,
        "metadata": {"destination": "moon", "cargo": 1000, "owned_by_default": True},
    },
    {
        "code": "moon-voyager",
        "name": "Lunar Voyager",
        "category": StoreItem.Category.ROCKET,
        "description": "A lunar craft with improved cargo capacity.",
        "price": 900,
        "metadata": {"destination": "moon", "cargo": 2000},
    },
    {
        "code": "moon-pioneer",
        "name": "Lunar Pioneer",
        "category": StoreItem.Category.ROCKET,
        "description": "A high-capacity spacecraft for ambitious lunar missions.",
        "price": 1600,
        "metadata": {"destination": "moon", "cargo": 4000},
    },
    {
        "code": "mars-explorer",
        "name": "Mars Explorer",
        "category": StoreItem.Category.ROCKET,
        "description": "A starter interplanetary spacecraft.",
        "price": 0,
        "metadata": {"destination": "mars", "cargo": 1000, "owned_by_default": True},
    },
    {
        "code": "mars-voyager",
        "name": "Mars Voyager",
        "category": StoreItem.Category.ROCKET,
        "description": "An advanced Mars transport with a larger cargo allowance.",
        "price": 1200,
        "metadata": {"destination": "mars", "cargo": 2000},
    },
    {
        "code": "mars-pathfinder",
        "name": "Mars Pathfinder",
        "category": StoreItem.Category.ROCKET,
        "description": "A premium vehicle for longer Mars expeditions.",
        "price": 2200,
        "metadata": {"destination": "mars", "cargo": 4000},
    },
]


class Command(BaseCommand):
    help = "Create or update the default ASTRAQUEST store catalog."

    def handle(self, *args, **options):
        for item in ITEMS:
            StoreItem.objects.update_or_create(
                code=item["code"],
                defaults=item,
            )
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(ITEMS)} store items."))
