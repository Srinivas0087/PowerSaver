from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from billing.calculator import calculate_bill, energy_charges
from billing.models import Tariff
from properties.models import Property
from readings.models import ElectricityMeter, MeterReading


class CalculatorTests(APITestCase):
    def test_spec_example_300_units_rate_6_fixed_100(self):
        user = User.objects.create_user('u', 'u@example.com', 'Str0ng!Pass#2026')
        prop = Property.objects.create(owner=user, name='P')
        tariff = Tariff.objects.create(property=prop, rate_per_unit=6, fixed_charge=100)
        bill = calculate_bill(300, tariff)
        self.assertEqual(bill['energy_charges'], Decimal('1800.00'))
        self.assertEqual(bill['total_amount'], Decimal('1900.00'))

    def test_slabs(self):
        slabs = [{'up_to': 100, 'rate': 5}, {'up_to': 200, 'rate': 7}, {'up_to': None, 'rate': 10}]
        # 250 units: 100 x 5 + 100 x 7 + 50 x 10 = 1700
        self.assertEqual(energy_charges(250, 6, slabs), Decimal('1700.00'))
        # 80 units: 80 x 5 = 400
        self.assertEqual(energy_charges(80, 6, slabs), Decimal('400.00'))
        # 150 units: 100 x 5 + 50 x 7 = 850
        self.assertEqual(energy_charges(150, 6, slabs), Decimal('850.00'))


class BillApiTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user('alice', 'a@example.com', 'Str0ng!Pass#2026')
        self.bob = User.objects.create_user('bob', 'b@example.com', 'Str0ng!Pass#2026')
        self.home = Property.objects.create(owner=self.alice, name='Home')
        self.bob_home = Property.objects.create(owner=self.bob, name='Bob Home')
        self.client.force_authenticate(self.alice)
        self.tariff = Tariff.objects.create(
            property=self.home, rate_per_unit=6, fixed_charge=100, other_charges=0
        )
        meter = ElectricityMeter.objects.create(property=self.home, meter_number='M-1')
        MeterReading.objects.create(meter=meter, reading_date='2026-10-01', reading_value=1200)
        MeterReading.objects.create(meter=meter, reading_date='2026-11-01', reading_value=1500)

    def payload(self, **extra):
        data = {
            'property': self.home.id,
            'tariff': self.tariff.id,
            'period_start': '2026-10-01',
            'period_end': '2026-11-01',
        }
        data.update(extra)
        return data

    def test_requires_login(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get('/api/bills/').status_code, status.HTTP_401_UNAUTHORIZED)

    def test_calculate_bill_from_readings(self):
        response = self.client.post('/api/bills/calculate/', self.payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(response.data['units_consumed']), Decimal('300'))
        self.assertEqual(Decimal(response.data['total_amount']), Decimal('1900'))
        self.assertIn('estimate', response.data['disclaimer'])
        self.assertEqual(len(self.client.get('/api/bills/').data), 1)

    def test_preview_does_not_save(self):
        response = self.client.post(
            '/api/bills/preview/', {'tariff': self.tariff.id, 'units': 300}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(response.data['total_amount']), Decimal('1900'))
        self.assertEqual(len(self.client.get('/api/bills/').data), 0)

    def test_no_readings_gives_clear_error(self):
        response = self.client.post(
            '/api/bills/calculate/',
            self.payload(period_start='2027-01-01', period_end='2027-02-01'),
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_end_before_start_rejected(self):
        response = self.client.post(
            '/api/bills/calculate/',
            self.payload(period_start='2026-11-01', period_end='2026-10-01'),
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_negative_rate_rejected(self):
        response = self.client.post(
            '/api/tariffs/',
            {'property': self.home.id, 'name': 'Bad', 'rate_per_unit': '-1'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bad_slabs_rejected(self):
        response = self.client.post(
            '/api/tariffs/',
            {'property': self.home.id, 'name': 'Slabs', 'rate_per_unit': '5',
             'slabs': [{'up_to': 200, 'rate': 5}, {'up_to': 100, 'rate': 7}]},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_use_another_users_property_or_tariff(self):
        bob_tariff = Tariff.objects.create(property=self.bob_home, rate_per_unit=9)
        response = self.client.post(
            '/api/bills/calculate/', self.payload(tariff=bob_tariff.id), format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        response = self.client.post(
            '/api/bills/calculate/', self.payload(property=self.bob_home.id), format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_cannot_see_another_users_tariffs_or_bills(self):
        self.client.post('/api/bills/calculate/', self.payload(), format='json')
        self.client.force_authenticate(self.bob)
        self.assertEqual(len(self.client.get('/api/tariffs/').data), 0)
        self.assertEqual(len(self.client.get('/api/bills/').data), 0)