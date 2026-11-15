from rest_framework import serializers

from .models import Property


class PropertySerializer(serializers.ModelSerializer):
    property_type_display = serializers.CharField(
        source='get_property_type_display', read_only=True
    )

    class Meta:
        model = Property
        fields = [
            'id', 'name', 'property_type', 'property_type_display',
            'address', 'city', 'monthly_limit_kwh',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_name(self, value):
        value = value.strip()
        request = self.context['request']
        duplicates = Property.objects.filter(owner=request.user, name__iexact=value)
        if self.instance:
            duplicates = duplicates.exclude(pk=self.instance.pk)
        if duplicates.exists():
            raise serializers.ValidationError('You already have a property with this name.')
        return value