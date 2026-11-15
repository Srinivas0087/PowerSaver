from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

URL = '/api/properties/'


class PropertyApiTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user('alice', 'a@example.com', 'Str0ng!Pass#2026')
        self.bob = User.objects.create_user('bob', 'b@example.com', 'Str0ng!Pass#2026')

    def create(self, name='Home', **extra):
        data = {'name': name, 'property_type': 'RESIDENTIAL'}
        data.update(extra)
        return self.client.post(URL, data, format='json')

    def test_requires_login(self):
        self.assertEqual(self.client.get(URL).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_and_list(self):
        self.client.force_authenticate(self.alice)
        response = self.create()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['property_type_display'], 'Residential')
        self.assertEqual(len(self.client.get(URL).data), 1)

    def test_invalid_property_type_rejected(self):
        self.client.force_authenticate(self.alice)
        response = self.create(property_type='CASTLE')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_negative_limit_rejected(self):
        self.client.force_authenticate(self.alice)
        response = self.create(monthly_limit_kwh='-5')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_name_rejected(self):
        self.client.force_authenticate(self.alice)
        self.create('Home')
        self.assertEqual(self.create('home').status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_and_delete(self):
        self.client.force_authenticate(self.alice)
        pid = self.create().data['id']
        response = self.client.patch(f'{URL}{pid}/', {'city': 'Hyderabad'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['city'], 'Hyderabad')
        self.assertEqual(self.client.delete(f'{URL}{pid}/').status_code, status.HTTP_204_NO_CONTENT)

    def test_user_cannot_see_or_change_another_users_property(self):
        self.client.force_authenticate(self.alice)
        pid = self.create().data['id']

        self.client.force_authenticate(self.bob)
        self.assertEqual(len(self.client.get(URL).data), 0)
        self.assertEqual(self.client.get(f'{URL}{pid}/').status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(
            self.client.patch(f'{URL}{pid}/', {'name': 'Hacked'}, format='json').status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(self.client.delete(f'{URL}{pid}/').status_code, status.HTTP_404_NOT_FOUND)

    def test_owner_cannot_be_set_from_request(self):
        self.client.force_authenticate(self.alice)
        response = self.create(owner=self.bob.id)
        pid = response.data['id']
        self.client.force_authenticate(self.bob)
        self.assertEqual(self.client.get(f'{URL}{pid}/').status_code, status.HTTP_404_NOT_FOUND)