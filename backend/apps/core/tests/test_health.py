from django.test import TestCase


class HealthTest(TestCase):
    def test_health_returns_database_ok(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"], {"status": "ok", "database": "ok"})
