from decimal import Decimal
from rest_framework import serializers

from properties.models import Property
from .models import Tariff, BillEstimate


class TariffSerializer(serializers.ModelSerializer):
    property_name = serializers.CharField(
        source='property.name',
        read_only=True,
    )

    class Meta:
        model = Tariff
        fields = [
            'id',
            'property',
            'property_name',
            'name',
            'rate_per_unit',
            'fixed_charge',
            'other_charges',
            'slabs',
            'is_active',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'property_name']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get('request')

        if request and request.user.is_authenticated:
            self.fields['property'].queryset = Property.objects.filter(
                owner=request.user
            )

    def validate_slabs(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError(
                'Slabs must be a list.'
            )

        previous_limit = Decimal('0')

        for index, slab in enumerate(value):
            if not isinstance(slab, dict):
                raise serializers.ValidationError(
                    'Each slab must be an object.'
                )

            if 'rate' not in slab:
                raise serializers.ValidationError(
                    'Every slab must contain a rate.'
                )

            try:
                rate = Decimal(str(slab['rate']))
            except Exception:
                raise serializers.ValidationError(
                    'Slab rate must be a valid number.'
                )

            if not rate.is_finite() or rate < 0:
                raise serializers.ValidationError(
                    'Slab rate cannot be negative or invalid.'
                )

            limit = slab.get('up_to')

            if limit is None:
                if index != len(value) - 1:
                    raise serializers.ValidationError(
                        'An unlimited slab must be the last slab.'
                    )
                continue

            try:
                limit = Decimal(str(limit))
            except Exception:
                raise serializers.ValidationError(
                    'Slab limit must be a valid number.'
                )

            if (
                not limit.is_finite()
                or limit <= previous_limit
            ):
                raise serializers.ValidationError(
                    'Slab limits must be positive and increasing.'
                )

            previous_limit = limit

        return value


class BillEstimateSerializer(serializers.ModelSerializer):
    property_name = serializers.CharField(
        source='property.name',
        read_only=True,
    )

    tariff_name = serializers.CharField(
        source='tariff.name',
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = BillEstimate
        fields = [
            'id',
            'property',
            'property_name',
            'tariff',
            'tariff_name',
            'period_start',
            'period_end',
            'units_consumed',
            'energy_charges',
            'fixed_charges',
            'other_charges',
            'total_amount',
            'created_at',
        ]
        read_only_fields = fields


class BillGenerationSerializer(serializers.Serializer):
    property = serializers.PrimaryKeyRelatedField(
        queryset=Property.objects.none()
    )

    tariff = serializers.PrimaryKeyRelatedField(
        queryset=Tariff.objects.none()
    )

    period_start = serializers.DateField()
    period_end = serializers.DateField()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get('request')

        if request and request.user.is_authenticated:
            self.fields['property'].queryset = Property.objects.filter(
                owner=request.user
            )

            self.fields['tariff'].queryset = Tariff.objects.filter(
                property__owner=request.user,
                is_active=True,
            )

    def validate(self, attrs):
        if attrs['period_start'] > attrs['period_end']:
            raise serializers.ValidationError({
                'period_end': 'End date must be on or after start date.'
            })

        if attrs['tariff'].property_id != attrs['property'].id:
            raise serializers.ValidationError({
                'tariff': 'Select a tariff belonging to the selected property.'
            })

        return attrs
