import json

from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.accounts.models import UserProfile


class AuthTest(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="operator", password="operator123")
        self.user.profile.role = UserProfile.Role.OPERATOR
        self.user.profile.save()

    def test_login_sets_session_and_returns_role(self):
        response = self.client.post(
            "/api/auth/login",
            data=json.dumps({"username": "operator", "password": "operator123"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["role"], "operator")
        self.assertEqual(self.client.get("/api/auth/me").status_code, 200)

    def test_bad_password_returns_401(self):
        response = self.client.post(
            "/api/auth/login",
            data=json.dumps({"username": "operator", "password": "bad"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["error"]["code"], "invalid_credentials")

    def test_me_requires_login(self):
        response = self.client.get("/api/auth/me")
        self.assertEqual(response.status_code, 401)
