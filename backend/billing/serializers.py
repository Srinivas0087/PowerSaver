from rest_framework import serializers

from properties.models import Property

from .models import BillEstimate, Tariff

DISCLAIMER = (
    'This is an estimate based on the tariff you configured. '
    'It may differ from the actual bill from your electricity provider.'
)


class TariffSerializer(serializers.ModelSerializer):
    property_name = serializers.CharField(source='property.name', read_only=True)

    class Meta:
        model = Tariff
        fields = [
            'id', 'property', 'property_name', 'name', 'rate_per_unit',
            'fixed_charge', 'other_charges', 'slabs', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')
        if request is not None:
            fields['property'].queryset = Property.objects.filter(owner=request.user)
        return fields

    def validate_slabs(self, value):
        if not value:
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError('Slabs must be a list.')
        previous = 0
        for index, slab in enumerate(value):
            if not isinstance(slab, dict) or 'rate' not in slab:
                raise serializers.ValidationError('Each slab needs a "rate".')
            try:
                if float(slab['rate']) < 0:
                    raise ValueError
            except (TypeError, ValueError):
                raise serializers.ValidationError('Slab rates must be numbers of 0 or more.')
            upper = slab.get('up_to')
            is_last = index == len(value) - 1
            if upper is None:
                if not is_last:
                    raise serializers.ValidationError('Only the last slab may have no upper limit.')
            else:
                try:
                    upper = float(upper)
                except (TypeError, ValueError):
                    raise serializers.ValidationError('"up_to" must be a number.')
                if upper <= previous:
                    raise serializers.ValidationError('Slab limits must increase.')
                previous = upper
        return value


class BillEstimateSerializer(serializers.ModelSerializer):
    property_name = serializers.CharField(source='property.name', read_only=True)
    tariff_name = serializers.CharField(source='tariff.name', read_only=True, default=None)
    disclaimer = serializers.SerializerMethodField()

    class Meta:
        model = BillEstimate
        fields = [
            'id', 'property', 'property_name', 'tariff', 'tariff_name',
            'period_start', 'period_end', 'units_consumed', 'energy_charges',
            'fixed_charges', 'other_charges', 'total_amount', 'disclaimer', 'created_at',
        ]
        read_only_fields = fields

    def get_disclaimer(self, obj):
        return DISCLAIMER