from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from properties.models import Property
from readings.models import ElectricityMeter, MeterReading


class AnalyticsApiTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user('alice', 'a@example.com', 'Str0ng!Pass#2026')
        self.bob = User.objects.create_user('bob', 'b@example.com', 'Str0ng!Pass#2026')
        home = Property.objects.create(owner=self.alice, name='Home')
        meter = ElectricityMeter.objects.create(property=home, meter_number='M-1')
        # 300 kWh over 30 days = exactly 10 kWh per day (Oct 2 to Oct 31)
        MeterReading.objects.create(meter=meter, reading_date='2026-10-01', reading_value=1000)
        MeterReading.objects.create(meter=meter, reading_date='2026-10-31', reading_value=1300)
        self.client.force_authenticate(self.alice)

    def test_requires_login(self):
        self.client.force_authenticate(None)
        response = self.client.get('/api/analytics/daily/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_daily_values_are_averages_of_the_readings(self):
        response = self.client.get('/api/analytics/daily/?days=30')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data_source'], 'meter_readings')
        self.assertEqual(len(response.data['series']), 30)
        self.assertTrue(all(row['kwh'] == 10.0 for row in response.data['series']))

    def test_weekly_adds_up_to_total(self):
        response = self.client.get('/api/analytics/weekly/')
        total = sum(row['kwh'] for row in response.data['series'])
        self.assertAlmostEqual(total, 300.0, places=1)

    def test_monthly(self):
        response = self.client.get('/api/analytics/monthly/')
        self.assertEqual(response.data['series'], [{'month': '2026-10', 'kwh': 300.0}])

    def test_summary(self):
        response = self.client.get('/api/analytics/summary/')
        self.assertTrue(response.data['has_data'])
        self.assertEqual(response.data['total_kwh'], 300.0)
        self.assertEqual(response.data['latest_day_kwh'], 10.0)
        self.assertEqual(response.data['last_7_days_kwh'], 70.0)
        self.assertIsNone(response.data['change_percent'])  # no previous month yet

    def test_no_data_gives_empty_results_not_invented_numbers(self):
        self.client.force_authenticate(self.bob)
        self.assertEqual(self.client.get('/api/analytics/daily/').data['series'], [])
        self.assertFalse(self.client.get('/api/analytics/summary/').data['has_data'])

    def test_bad_parameters_do_not_crash(self):
        response = self.client.get('/api/analytics/daily/?days=abc&property=xyz')
        self.assertEqual(response.status_code, status.HTTP_200_OK)