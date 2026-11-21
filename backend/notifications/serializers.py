
from rest_framework import serializers

from .models import Alert, Recommendation


class AlertSerializer(serializers.ModelSerializer):
    property_name = serializers.CharField(
        source='property.name',
        read_only=True,
    )

    alert_type_display = serializers.CharField(
        source='get_alert_type_display',
        read_only=True,
    )

    severity_display = serializers.CharField(
        source='get_severity_display',
        read_only=True,
    )

    class Meta:
        model = Alert
        fields = [
            'id',
            'property',
            'property_name',
            'alert_type',
            'alert_type_display',
            'severity',
            'severity_display',
            'message',
            'is_read',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'property',
            'property_name',
            'alert_type',
            'alert_type_display',
            'severity',
            'severity_display',
            'message',
            'created_at',
        ]


class RecommendationSerializer(serializers.ModelSerializer):
    property_name = serializers.CharField(
        source='property.name',
        read_only=True,
    )

    priority_display = serializers.CharField(
        source='get_priority_display',
        read_only=True,
    )

    class Meta:
        model = Recommendation
        fields = [
            'id',
            'property',
            'property_name',
            'title',
            'message',
            'reason',
            'priority',
            'priority_display',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'property',
            'property_name',
            'title',
            'message',
            'reason',
            'priority',
            'priority_display',
            'created_at',
        ]
