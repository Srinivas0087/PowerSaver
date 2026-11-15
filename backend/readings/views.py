from rest_framework import viewsets

from .models import ElectricityMeter, MeterReading
from .serializers import ElectricityMeterSerializer, MeterReadingSerializer


class ElectricityMeterViewSet(viewsets.ModelViewSet):
    serializer_class = ElectricityMeterSerializer

    def get_queryset(self):
        queryset = ElectricityMeter.objects.filter(
            property__owner=self.request.user
        ).select_related('property')
        property_id = self.request.query_params.get('property')
        if property_id and property_id.isdigit():
            queryset = queryset.filter(property_id=property_id)
        return queryset


class MeterReadingViewSet(viewsets.ModelViewSet):
    serializer_class = MeterReadingSerializer

    def get_queryset(self):
        queryset = MeterReading.objects.filter(
            meter__property__owner=self.request.user
        ).select_related('meter')
        meter_id = self.request.query_params.get('meter')
        property_id = self.request.query_params.get('property')
        if meter_id and meter_id.isdigit():
            queryset = queryset.filter(meter_id=meter_id)
        if property_id and property_id.isdigit():
            queryset = queryset.filter(meter__property_id=property_id)
        return queryset