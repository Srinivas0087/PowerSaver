from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import Profile


class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(min_length=2, max_length=150)
    username = serializers.RegexField(
        r'^[A-Za-z0-9_]{3,20}$',
        error_messages={
            'invalid': 'Username must be 3 to 20 letters, numbers or underscores.'
        },
    )
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('This username is already taken.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value.lower()

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})

        # Run Django's password rules (length, common passwords, all-numeric...)
        candidate = User(
            username=data['username'],
            email=data['email'],
            first_name=data['full_name'],
        )
        try:
            validate_password(data['password'], user=candidate)
        except DjangoValidationError as error:
            raise serializers.ValidationError({'password': list(error.messages)})

        return data

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],  # hashed automatically
            first_name=validated_data['full_name'],
        )
        Profile.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if user is None:
            # Same message for "wrong username" and "wrong password" on purpose
            raise serializers.ValidationError('Invalid username or password.')
        data['user'] = user
        return data


class ProfileSerializer(serializers.Serializer):
    # Fields below are for INPUT (updating the profile)
    full_name = serializers.CharField(min_length=2, max_length=150)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate_email(self, value):
        taken = User.objects.filter(email__iexact=value).exclude(pk=self.instance.pk)
        if taken.exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value.lower()

    def to_representation(self, user):
        """What the API sends back."""
        profile, _ = Profile.objects.get_or_create(user=user)
        return {
            'id': user.id,
            'username': user.username,
            'full_name': user.first_name,
            'email': user.email,
            'phone': profile.phone,
            'date_joined': user.date_joined,
        }

    def update(self, user, validated_data):
        if 'full_name' in validated_data:
            user.first_name = validated_data['full_name']
        if 'email' in validated_data:
            user.email = validated_data['email']
        user.save()

        if 'phone' in validated_data:
            profile, _ = Profile.objects.get_or_create(user=user)
            profile.phone = validated_data['phone']
            profile.save()
        return user