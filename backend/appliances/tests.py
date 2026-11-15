from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from properties.models import Property

URL = '/api/appliances/'


class ApplianceApiTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user('alice', 'a@example.com', 'Str0ng!Pass#2026')
        self.bob = User.objects.create_user('bob', 'b@example.com', 'Str0ng!Pass#2026')
        self.alice_home = Property.objects.create(owner=self.alice, name='Alice Home')
        self.bob_home = Property.objects.create(owner=self.bob, name='Bob Home')
        self.client.force_authenticate(self.alice)

    def add(self, **overrides):
        data = {
            'property': self.alice_home.id,
            'name': 'Air conditioner',
            'category': 'COOLING',
            'power_watts': 1500,
            'quantity': 1,
            'daily_hours': '8',
        }
        data.update(overrides)
        return self.client.post(URL, data, format='json')

    def test_requires_login(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(URL).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_estimate_calculation_and_label(self):
        response = self.add()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(str(response.data['estimated_daily_kwh'])), Decimal('12'))
        self.assertEqual(Decimal(str(response.data['estimated_weekly_kwh'])), Decimal('84'))
        self.assertEqual(Decimal(str(response.data['estimated_monthly_kwh'])), Decimal('360'))
        self.assertEqual(response.data['data_source'], 'estimate')

    def test_quantity_multiplies_consumption(self):
        response = self.add(name='Fans', category='COOLING', power_watts=75, quantity=4, daily_hours='10')
        # 75 W x 4 x 10 h / 1000 = 3 kWh per day
        self.assertEqual(Decimal(str(response.data['estimated_daily_kwh'])), Decimal('3'))

    def test_invalid_values_rejected(self):
        self.assertEqual(self.add(power_watts=0).status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.add(quantity=0).status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.add(daily_hours='25').status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.add(daily_hours='-1').status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.add(category='SPACESHIP').status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_and_delete(self):
        aid = self.add().data['id']
        response = self.client.patch(f'{URL}{aid}/', {'daily_hours': '4'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(str(response.data['estimated_daily_kwh'])), Decimal('6'))
        self.assertEqual(self.client.delete(f'{URL}{aid}/').status_code, status.HTTP_204_NO_CONTENT)

    def test_summary(self):
        self.add()  # 360 kWh per month
        self.add(name='Lights', category='LIGHTING', power_watts=10, quantity=10, daily_hours='5')
        # 10 W x 10 x 5 h / 1000 = 0.5 kWh per day, 15 per month
        response = self.client.get(f'{URL}summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['appliance_count'], 2)
        self.assertEqual(Decimal(str(response.data['estimated_monthly_kwh'])), Decimal('375'))
        self.assertEqual(response.data['data_source'], 'estimate')
        self.assertEqual(len(response.data['monthly_by_category']), 2)

    def test_cannot_use_another_users_property(self):
        response = self.add(property=self.bob_home.id)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_cannot_access_another_users_appliances(self):
        aid = self.add().data['id']
        self.client.force_authenticate(self.bob)
        self.assertEqual(len(self.client.get(URL).data), 0)
        self.assertEqual(self.client.get(f'{URL}{aid}/').status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.delete(f'{URL}{aid}/').status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.get(f'{URL}summary/').data['appliance_count'], 0)