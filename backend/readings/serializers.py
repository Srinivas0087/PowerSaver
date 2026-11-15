from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from properties.models import Property

from .models import ElectricityMeter, MeterReading


class ElectricityMeterSerializer(serializers.ModelSerializer):
    property_name = serializers.CharField(source='property.name', read_only=True)

    class Meta:
        model = ElectricityMeter
        fields = [
            'id', 'property', 'property_name', 'meter_number',
            'description', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')
        if request is not None:
            # The dropdown only offers properties that belong to this user
            fields['property'].queryset = Property.objects.filter(owner=request.user)
        return fields

    def validate(self, data):
        prop = data.get('property') or getattr(self.instance, 'property', None)
        number = data.get('meter_number') or getattr(self.instance, 'meter_number', None)
        duplicates = ElectricityMeter.objects.filter(property=prop, meter_number=number)
        if self.instance:
            duplicates = duplicates.exclude(pk=self.instance.pk)
        if duplicates.exists():
            raise serializers.ValidationError(
                {'meter_number': 'This property already has a meter with this number.'}
            )
        return data


class MeterReadingSerializer(serializers.ModelSerializer):
    meter_number = serializers.CharField(source='meter.meter_number', read_only=True)
    previous_reading = serializers.SerializerMethodField()
    consumption = serializers.SerializerMethodField()

    class Meta:
        model = MeterReading
        fields = [
            'id', 'meter', 'meter_number', 'reading_date', 'reading_value',
            'notes', 'previous_reading', 'consumption', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']
        # The model's own checks (below) report duplicates, so turn off the
        # automatic unique-together validator to avoid two different messages.
        validators = []

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')
        if request is not None:
            fields['meter'].queryset = ElectricityMeter.objects.filter(
                property__owner=request.user
            )
        return fields

    def get_previous_reading(self, obj):
        previous = obj.previous_reading()
        return previous.reading_value if previous else None

    def get_consumption(self, obj):
        return obj.consumption

    def validate(self, data):
        # Build a temporary reading and run the model's rules on it:
        # not negative, not lower than the previous, not duplicate date.
        instance = self.instance or MeterReading()
        for field, value in data.items():
            setattr(instance, field, value)
        try:
            instance.full_clean()
        except DjangoValidationError as error:
            raise serializers.ValidationError(error.message_dict)
        return data