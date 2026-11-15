from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from properties.models import Property
from readings.models import ElectricityMeter

METERS = '/api/meters/'
READINGS = '/api/readings/'


class ReadingApiTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user('alice', 'a@example.com', 'Str0ng!Pass#2026')
        self.bob = User.objects.create_user('bob', 'b@example.com', 'Str0ng!Pass#2026')
        self.alice_home = Property.objects.create(owner=self.alice, name='Alice Home')
        self.bob_home = Property.objects.create(owner=self.bob, name='Bob Home')
        self.client.force_authenticate(self.alice)
        self.meter_id = self.client.post(
            METERS, {'property': self.alice_home.id, 'meter_number': 'M-1'}, format='json'
        ).data['id']

    def add(self, day, value, meter=None):
        return self.client.post(
            READINGS,
            {'meter': meter or self.meter_id, 'reading_date': day, 'reading_value': value},
            format='json',
        )

    def test_requires_login(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(READINGS).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_consumption_calculation(self):
        first = self.add('2026-10-01', '1200')
        second = self.add('2026-11-01', '1500')
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(first.data['consumption'])
        self.assertEqual(float(second.data['consumption']), 300.0)
        self.assertEqual(float(second.data['previous_reading']), 1200.0)

    def test_negative_reading_rejected(self):
        self.assertEqual(self.add('2026-10-01', '-5').status_code, status.HTTP_400_BAD_REQUEST)

    def test_lower_than_previous_rejected(self):
        self.add('2026-10-01', '1200')
        self.assertEqual(self.add('2026-11-01', '1100').status_code, status.HTTP_400_BAD_REQUEST)

    def test_higher_than_next_rejected(self):
        self.add('2026-11-01', '1500')
        self.assertEqual(self.add('2026-10-01', '1600').status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_date_rejected(self):
        self.add('2026-10-01', '1200')
        self.assertEqual(self.add('2026-10-01', '1300').status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_date_rejected(self):
        self.assertEqual(self.add('not-a-date', '100').status_code, status.HTTP_400_BAD_REQUEST)

    def test_edit_reading_and_delete(self):
        rid = self.add('2026-10-01', '1200').data['id']
        self.add('2026-11-01', '1500')
        response = self.client.patch(f'{READINGS}{rid}/', {'reading_value': '1250'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        too_high = self.client.patch(f'{READINGS}{rid}/', {'reading_value': '1600'}, format='json')
        self.assertEqual(too_high.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.client.delete(f'{READINGS}{rid}/').status_code, status.HTTP_204_NO_CONTENT)

    def test_filter_by_meter(self):
        self.add('2026-10-01', '1200')
        self.assertEqual(len(self.client.get(f'{READINGS}?meter={self.meter_id}').data), 1)
        self.assertEqual(len(self.client.get(f'{READINGS}?meter=abc').data), 1)

    def test_cannot_add_meter_to_another_users_property(self):
        response = self.client.post(
            METERS, {'property': self.bob_home.id, 'meter_number': 'X-1'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_meter_number_rejected(self):
        response = self.client.post(
            METERS, {'property': self.alice_home.id, 'meter_number': 'M-1'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_cannot_access_another_users_readings(self):
        rid = self.add('2026-10-01', '1200').data['id']
        bob_meter = ElectricityMeter.objects.create(property=self.bob_home, meter_number='B-1')

        self.client.force_authenticate(self.bob)
        self.assertEqual(len(self.client.get(READINGS).data), 0)
        self.assertEqual(self.client.get(f'{READINGS}{rid}/').status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.delete(f'{READINGS}{rid}/').status_code, status.HTTP_404_NOT_FOUND)
        # Bob cannot add a reading to Alice's meter
        self.assertEqual(
            self.add('2026-11-01', '2000', meter=self.meter_id).status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        # ...but can add one to his own
        self.assertEqual(
            self.add('2026-11-01', '2000', meter=bob_meter.id).status_code,
            status.HTTP_201_CREATED,
        )