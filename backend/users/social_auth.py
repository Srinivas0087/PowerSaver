import jwt
from django.conf import settings
from rest_framework.exceptions import APIException, ValidationError


PROVIDER_CONFIG = {
    'google': {
        'audience_setting': 'GOOGLE_OAUTH_CLIENT_ID',
        'issuer': ['accounts.google.com', 'https://accounts.google.com'],
        'jwks_url': 'https://www.googleapis.com/oauth2/v3/certs',
    },
    'apple': {
        'audience_setting': 'APPLE_OAUTH_CLIENT_ID',
        'issuer': 'https://appleid.apple.com',
        'jwks_url': 'https://appleid.apple.com/auth/keys',
    },
}


class ProviderConfigurationError(APIException):
    status_code = 503
    default_detail = 'Social sign-in is not configured for this provider.'
    default_code = 'social_login_unavailable'


def verify_social_identity(provider, identity_token, nonce):
    config = PROVIDER_CONFIG[provider]
    audience = getattr(settings, config['audience_setting'], '')
    if not audience:
        raise ProviderConfigurationError()

    try:
        key = jwt.PyJWKClient(config['jwks_url'], timeout=5).get_signing_key_from_jwt(
            identity_token
        )
        claims = jwt.decode(
            identity_token,
            key.key,
            algorithms=['RS256'],
            audience=audience,
            issuer=config['issuer'],
            options={'require': ['exp', 'iat', 'sub', 'email', 'nonce']},
        )
    except jwt.PyJWKClientError as error:
        raise ProviderConfigurationError(
            'Could not verify the provider identity right now. Please try again.'
        ) from error
    except jwt.InvalidTokenError as error:
        raise ValidationError('The provider returned an invalid sign-in token.') from error

    verified = claims.get('email_verified')
    if verified is not True and verified != 'true':
        raise ValidationError('The provider email address has not been verified.')
    if claims['nonce'] != nonce:
        raise ValidationError('The sign-in request expired or could not be verified.')

    return claims
