from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from core.models import (
    CommanderProfile,
    Mission,
    MissionResult,
    StoreItem,
    StorePurchase,
)


class ApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email="commander@example.com",
            password="SpacePassword2026!",
        )
        self.profile = CommanderProfile.objects.get(user=self.user)
        self.item = StoreItem.objects.create(
            code="moon-voyager",
            name="Lunar Voyager",
            category=StoreItem.Category.ROCKET,
            price=900,
        )

    def authenticate(self):
        self.client.force_authenticate(user=self.user)

    def test_registration_creates_profile_and_jwt_tokens(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "email": "new-commander@example.com",
                "display_name": "Nova",
                "password": "LongAndSecure2026!Password",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        new_user = get_user_model().objects.get(email="new-commander@example.com")
        self.assertEqual(new_user.profile.display_name, "Nova")

    def test_registration_adds_catalog_starter_rockets_to_inventory(self):
        StoreItem.objects.create(
            code="moon-explorer",
            name="Lunar Explorer",
            category=StoreItem.Category.ROCKET,
            price=0,
            metadata={"owned_by_default": True},
        )
        response = self.client.post(
            "/api/auth/register/",
            {
                "email": "new-commander@example.com",
                "display_name": "Nova",
                "password": "LongAndSecure2026!Password",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_user = get_user_model().objects.get(email="new-commander@example.com")
        purchase = StorePurchase.objects.get(commander=new_user)
        self.assertEqual(purchase.item.code, "moon-explorer")
        self.assertEqual(purchase.price_paid, 0)

    def test_login_accepts_email_and_password(self):
        response = self.client.post(
            "/api/auth/token/",
            {"email": self.user.email, "password": "SpacePassword2026!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_missions_require_authentication_and_are_user_scoped(self):
        self.assertEqual(
            self.client.get("/api/missions/").status_code,
            status.HTTP_401_UNAUTHORIZED,
        )
        self.authenticate()
        created = self.client.post(
            "/api/missions/",
            {"destination": "moon", "resources": {"food": 250}},
            format="json",
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertEqual(created.data["duration_days"], 7)

        other_user = get_user_model().objects.create_user(
            email="other@example.com",
            password="SpacePassword2026!",
        )
        self.client.force_authenticate(user=other_user)
        self.assertEqual(self.client.get("/api/missions/").data, [])

    def test_mission_results_are_saved_and_appear_on_leaderboard(self):
        mission = Mission.objects.create(
            commander=self.user,
            destination=Mission.Destination.MOON,
            duration_days=7,
        )
        self.authenticate()
        response = self.client.post(
            "/api/results/",
            {
                "mission": mission.id,
                "result_type": "crisis",
                "title": "Food Rescue",
                "score": 8,
                "details": {"caught": 9},
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(MissionResult.objects.count(), 1)
        leaderboard = self.client.get("/api/leaderboard/")
        self.assertEqual(leaderboard.status_code, status.HTTP_200_OK)
        self.assertEqual(leaderboard.data[0]["total_score"], 8)

    def test_mission_result_updates_mission_status(self):
        mission = Mission.objects.create(
            commander=self.user,
            destination=Mission.Destination.MOON,
            duration_days=7,
        )
        self.authenticate()

        response = self.client.post(
            "/api/results/",
            {
                "mission": mission.id,
                "result_type": "mission",
                "title": "Moon Mission",
                "score": 10,
                "details": {"outcome": "success"},
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        mission.refresh_from_db()
        self.assertEqual(mission.status, Mission.Status.COMPLETED)

    def test_result_rejects_another_users_mission_and_out_of_range_score(self):
        mission = Mission.objects.create(
            commander=self.user,
            destination=Mission.Destination.MOON,
            duration_days=7,
        )
        self.authenticate()
        payload = {
            "mission": mission.id,
            "result_type": "crisis",
            "title": "Food Rescue",
            "score": 11,
        }

        self.assertEqual(
            self.client.post("/api/results/", payload, format="json").status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        payload["score"] = 8
        other_user = get_user_model().objects.create_user(
            email="other@example.com",
            password="SpacePassword2026!",
        )
        other_mission = Mission.objects.create(
            commander=other_user,
            destination=Mission.Destination.MARS,
            duration_days=30,
        )
        payload["mission"] = other_mission.id
        self.assertEqual(
            self.client.post("/api/results/", payload, format="json").status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_store_purchase_debits_balance_and_prevents_duplicates(self):
        self.authenticate()
        response = self.client.post(
            "/api/store/purchases/",
            {"item_code": self.item.code},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.coins, 300)
        self.assertEqual(
            self.client.post(
                "/api/store/purchases/",
                {"item_code": self.item.code},
                format="json",
            ).status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        inventory = self.client.get("/api/store/inventory/")
        self.assertEqual(len(inventory.data["items"]), 1)

    def test_store_purchase_rejects_insufficient_funds(self):
        self.item.price = 1500
        self.item.save(update_fields=["price"])
        self.authenticate()

        response = self.client.post(
            "/api/store/purchases/",
            {"item_code": self.item.code},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.coins, 1200)

    def test_store_catalog_and_leaderboard_are_public(self):
        catalog = self.client.get("/api/store/items/")
        self.assertEqual(catalog.status_code, status.HTTP_200_OK)
        self.assertEqual(len(catalog.data), 1)
        self.assertEqual(self.client.get("/api/leaderboard/").data, [])
