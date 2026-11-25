from unittest.mock import patch

from django.contrib.auth.models import User
from django.core import signing
from django.test import SimpleTestCase, override_settings
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.test import APITestCase

from .models import SocialAccount
from .social_auth import ProviderConfigurationError, verify_social_identity
from .views import SOCIAL_STATE_SALT

REGISTER_URL = '/api/auth/register/'
LOGIN_URL = '/api/auth/login/'
LOGOUT_URL = '/api/auth/logout/'
PROFILE_URL = '/api/auth/profile/'
SOCIAL_NONCE_URL = '/api/auth/social/nonce/'
SOCIAL_LOGIN_URL = '/api/auth/social/login/'


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

    def test_login_unknown_username_asks_user_to_register(self):
        response = self.client.post(
            LOGIN_URL,
            {'username': 'not_registered', 'password': 'SomePass123'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data['non_field_errors'][0],
            'No account found. Please register first.',
        )

    # ---------- Social login ----------
    def social_state(self, provider='google'):
        nonce = 'test-social-nonce'
        state = signing.dumps(
            {'provider': provider, 'nonce': nonce},
            salt=SOCIAL_STATE_SALT,
        )
        return nonce, state

    @override_settings(GOOGLE_OAUTH_CLIENT_ID='google-client-id')
    def test_social_login_creates_user_and_links_provider_account(self):
        nonce, state = self.social_state()
        with self.subTest('nonce challenge'):
            response = self.client.get(SOCIAL_NONCE_URL, {'provider': 'google'})
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertTrue(response.data['nonce'])
            self.assertTrue(response.data['state'])

        with patch('users.views.verify_social_identity') as verify_identity:
            verify_identity.return_value = {
                'sub': 'google-user-123',
                'email': 'new.user@example.com',
                'email_verified': True,
                'name': 'New User',
                'nonce': nonce,
            }
            response = self.client.post(
                SOCIAL_LOGIN_URL,
                {
                    'provider': 'google',
                    'intent': 'register',
                    'identity_token': 'provider-token',
                    'state': state,
                },
                format='json',
            )
        verify_identity.assert_called_once_with('google', 'provider-token', nonce)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        user = User.objects.get(email='new.user@example.com')
        self.assertEqual(user.first_name, 'New User')
        self.assertFalse(user.has_usable_password())
        self.assertTrue(
            SocialAccount.objects.filter(
                user=user,
                provider='google',
                provider_uid='google-user-123',
            ).exists()
        )

    @override_settings(GOOGLE_OAUTH_CLIENT_ID='google-client-id')
    def test_social_login_links_existing_user_with_verified_provider_email(self):
        existing_user = User.objects.create_user(
            username='existing_user',
            email='existing@example.com',
            password='Existing!Pass123',
        )
        nonce, state = self.social_state()
        with patch('users.views.verify_social_identity') as verify_identity:
            verify_identity.return_value = {
                'sub': 'google-existing-user',
                'email': 'EXISTING@example.com',
                'email_verified': True,
                'nonce': nonce,
            }
            response = self.client.post(
                SOCIAL_LOGIN_URL,
                {
                    'provider': 'google',
                    'intent': 'login',
                    'identity_token': 'provider-token',
                    'state': state,
                },
                format='json',
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['id'], existing_user.id)
        self.assertTrue(
            SocialAccount.objects.filter(
                user=existing_user,
                provider='google',
                provider_uid='google-existing-user',
            ).exists()
        )
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + response.data['token'])
        profile = self.client.get(PROFILE_URL)
        self.assertEqual(profile.status_code, status.HTTP_200_OK)
        self.assertEqual(profile.data['username'], 'existing_user')

    def test_social_login_rejects_mismatched_state_provider(self):
        _, state = self.social_state(provider='apple')
        response = self.client.post(
            SOCIAL_LOGIN_URL,
            {
                'provider': 'google',
                'intent': 'login',
                'identity_token': 'provider-token',
                'state': state,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_social_nonce_rejects_unknown_provider(self):
        response = self.client.get(SOCIAL_NONCE_URL, {'provider': 'unknown'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @override_settings(GOOGLE_OAUTH_CLIENT_ID='google-client-id')
    def test_social_login_without_account_asks_user_to_register(self):
        nonce, state = self.social_state()
        with patch('users.views.verify_social_identity') as verify_identity:
            verify_identity.return_value = {
                'sub': 'google-unregistered-user',
                'email': 'new.user@example.com',
                'email_verified': True,
                'nonce': nonce,
            }
            response = self.client.post(
                SOCIAL_LOGIN_URL,
                {
                    'provider': 'google',
                    'intent': 'login',
                    'identity_token': 'provider-token',
                    'state': state,
                },
                format='json',
            )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data[0],
            'No account found for this email. Please register first.',
        )
        self.assertFalse(User.objects.filter(email='new.user@example.com').exists())

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


class SocialIdentityVerificationTests(SimpleTestCase):
    @override_settings(GOOGLE_OAUTH_CLIENT_ID='google-client-id')
    def test_verifies_audience_issuer_and_nonce_from_provider_token(self):
        claims = {
            'sub': 'google-user-123',
            'email': 'new.user@example.com',
            'email_verified': True,
            'nonce': 'expected-nonce',
        }
        with patch('users.social_auth.jwt.PyJWKClient') as jwks_client:
            with patch('users.social_auth.jwt.decode', return_value=claims) as decode:
                jwks_client.return_value.get_signing_key_from_jwt.return_value.key = 'public-key'
                result = verify_social_identity('google', 'signed-token', 'expected-nonce')

        self.assertEqual(result, claims)
        decode.assert_called_once_with(
            'signed-token',
            'public-key',
            algorithms=['RS256'],
            audience='google-client-id',
            issuer=['accounts.google.com', 'https://accounts.google.com'],
            options={'require': ['exp', 'iat', 'sub', 'email', 'nonce']},
        )

    @override_settings(GOOGLE_OAUTH_CLIENT_ID='')
    def test_rejects_social_login_without_provider_configuration(self):
        with self.assertRaises(ProviderConfigurationError):
            verify_social_identity('google', 'signed-token', 'expected-nonce')

    @override_settings(GOOGLE_OAUTH_CLIENT_ID='google-client-id')
    def test_rejects_a_provider_token_with_a_different_nonce(self):
        claims = {
            'sub': 'google-user-123',
            'email': 'new.user@example.com',
            'email_verified': True,
            'nonce': 'different-nonce',
        }
        with patch('users.social_auth.jwt.PyJWKClient') as jwks_client:
            with patch('users.social_auth.jwt.decode', return_value=claims):
                jwks_client.return_value.get_signing_key_from_jwt.return_value.key = 'public-key'
                with self.assertRaises(ValidationError):
                    verify_social_identity('google', 'signed-token', 'expected-nonce')

    @override_settings(GOOGLE_OAUTH_CLIENT_ID='google-client-id')
    def test_rejects_unverified_provider_email(self):
        claims = {
            'sub': 'google-user-123',
            'email': 'new.user@example.com',
            'email_verified': False,
            'nonce': 'expected-nonce',
        }
        with patch('users.social_auth.jwt.PyJWKClient') as jwks_client:
            with patch('users.social_auth.jwt.decode', return_value=claims):
                jwks_client.return_value.get_signing_key_from_jwt.return_value.key = 'public-key'
                with self.assertRaises(ValidationError):
                    verify_social_identity('google', 'signed-token', 'expected-nonce')