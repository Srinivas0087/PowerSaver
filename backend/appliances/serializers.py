from rest_framework import serializers

from properties.models import Property

from .models import Appliance


class ApplianceSerializer(serializers.ModelSerializer):
    property_name = serializers.CharField(source='property.name', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    estimated_daily_kwh = serializers.SerializerMethodField()
    estimated_weekly_kwh = serializers.SerializerMethodField()
    estimated_monthly_kwh = serializers.SerializerMethodField()
    data_source = serializers.SerializerMethodField()

    class Meta:
        model = Appliance
        fields = [
            'id', 'property', 'property_name', 'name', 'category', 'category_display',
            'power_watts', 'quantity', 'daily_hours',
            'estimated_daily_kwh', 'estimated_weekly_kwh', 'estimated_monthly_kwh',
            'data_source', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')
        if request is not None:
            # Only this user's properties can be chosen
            fields['property'].queryset = Property.objects.filter(owner=request.user)
        return fields

    def get_estimated_daily_kwh(self, obj):
        return obj.daily_kwh()

    def get_estimated_weekly_kwh(self, obj):
        return obj.weekly_kwh()

    def get_estimated_monthly_kwh(self, obj):
        return obj.monthly_kwh()

    def get_data_source(self, obj):
        return 'estimate'  # never a meter reading