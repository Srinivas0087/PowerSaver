from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

REGISTER_URL = '/api/auth/register/'
LOGIN_URL = '/api/auth/login/'
LOGOUT_URL = '/api/auth/logout/'
PROFILE_URL = '/api/auth/profile/'


def valid_payload(**overrides):
    data = {
        'full_name': 'Test User',
        'username': 'test_user',
        'email': 'test@example.com',
        'password': 'Str0ng!Pass#2026',
        'confirm_password': 'Str0ng!Pass#2026',
    }
    data.update(overrides)
    return data


class AuthApiTests(APITestCase):
    def register(self, **overrides):
        return self.client.post(REGISTER_URL, valid_payload(**overrides), format='json')

    def login_with_token(self):
        response = self.register()
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + response.data['token'])
        return response

    # ---------- Registration ----------
    def test_register_success_and_password_is_hashed(self):
        response = self.register()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        user = User.objects.get(username='test_user')
        self.assertNotEqual(user.password, 'Str0ng!Pass#2026')
        self.assertTrue(user.check_password('Str0ng!Pass#2026'))

    def test_register_password_mismatch(self):
        response = self.register(confirm_password='Different!Pass1')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('confirm_password', response.data)

    def test_register_weak_password_rejected(self):
        response = self.register(password='12345678', confirm_password='12345678')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_register_duplicate_username_rejected(self):
        self.register()
        response = self.register(email='other@example.com')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)

    def test_register_duplicate_email_rejected_case_insensitive(self):
        self.register()
        response = self.register(username='other_user', email='TEST@example.com')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    # ---------- Login ----------
    def test_login_success(self):
        self.register()
        response = self.client.post(
            LOGIN_URL,
            {'username': 'test_user', 'password': 'Str0ng!Pass#2026'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_login_wrong_password_rejected(self):
        self.register()
        response = self.client.post(
            LOGIN_URL,
            {'username': 'test_user', 'password': 'wrong-password'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ---------- Protected pages and profile ----------
    def test_profile_requires_login(self):
        response = self.client.get(PROFILE_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_view_and_update(self):
        self.login_with_token()
        response = self.client.get(PROFILE_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'test_user')

        response = self.client.patch(
            PROFILE_URL, {'full_name': 'New Name', 'phone': '9876543210'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['full_name'], 'New Name')
        self.assertEqual(response.data['phone'], '9876543210')
        self.assertEqual(User.objects.get(username='test_user').first_name, 'New Name')

    # ---------- Logout ----------
    def test_logout_deletes_token(self):
        self.login_with_token()
        response = self.client.post(LOGOUT_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # The same token must not work any more
        response = self.client.get(PROFILE_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)