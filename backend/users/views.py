import re
import secrets
from django.contrib.auth.models import User
from django.core import signing
from django.db import IntegrityError, transaction
from rest_framework import generics, status
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Profile, SocialAccount
from .serializers import (
    LoginSerializer,
    ProfileSerializer,
    RegisterSerializer,
    SocialLoginSerializer,
)
from .social_auth import verify_social_identity


SOCIAL_STATE_SALT = 'users.social-login'


class SocialNonceView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        provider = request.query_params.get('provider')
        if provider not in ('google', 'apple'):
            return Response(
                {'detail': 'Choose Google or Apple to continue.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        nonce = secrets.token_urlsafe(32)
        state = signing.dumps(
            {'provider': provider, 'nonce': nonce},
            salt=SOCIAL_STATE_SALT,
        )
        return Response({'nonce': nonce, 'state': state})


class SocialLoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = SocialLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            state = signing.loads(
                data['state'],
                salt=SOCIAL_STATE_SALT,
                max_age=300,
            )
        except signing.BadSignature as error:
            raise ValidationError('The sign-in request expired. Please try again.') from error

        if state.get('provider') != data['provider']:
            raise ValidationError('The sign-in request could not be verified.')

        claims = verify_social_identity(
            data['provider'],
            data['identity_token'],
            state['nonce'],
        )
        email = claims['email'].strip().lower()
        if not email:
            raise ValidationError('The provider did not return an email address.')

        try:
            with transaction.atomic():
                social_account = SocialAccount.objects.select_related('user').filter(
                    provider=data['provider'],
                    provider_uid=claims['sub'],
                ).first()
                if social_account:
                    user = social_account.user
                else:
                    user = User.objects.filter(email__iexact=email).first()
                    if user is None:
                        if data['intent'] == 'login':
                            raise ValidationError(
                                'No account found for this email. Please register first.'
                            )

                        base = re.sub(r'[^A-Za-z0-9_]', '_', email.split('@')[0]).strip('_')
                        base = (base or 'user')[:12]
                        username = f'{base}_{secrets.token_hex(3)}'
                        while User.objects.filter(username__iexact=username).exists():
                            username = f'{base}_{secrets.token_hex(3)}'

                        full_name = (
                            claims.get('name')
                            or data.get('full_name', '').strip()
                        )[:150]
                        user = User.objects.create_user(
                            username=username,
                            email=email,
                            first_name=full_name,
                        )
                        user.set_unusable_password()
                        user.save(update_fields=['password'])
                        Profile.objects.get_or_create(user=user)

                    SocialAccount.objects.create(
                        user=user,
                        provider=data['provider'],
                        provider_uid=claims['sub'],
                        email=email,
                    )
        except IntegrityError:
            social_account = SocialAccount.objects.select_related('user').filter(
                provider=data['provider'],
                provider_uid=claims['sub'],
            ).first()
            if social_account is None:
                raise
            user = social_account.user

        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': ProfileSerializer(user).data})


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # a stale token must not block registration

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {'token': token.key, 'user': ProfileSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': ProfileSerializer(user).data})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.auth.delete()  # delete the token that made this request
        return Response({'detail': 'Logged out successfully.'})


class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProfileSerializer
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_object(self):
        return self.request.user  # always the logged-in user, never someone else