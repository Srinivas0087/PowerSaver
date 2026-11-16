from datetime import date
from decimal import Decimal

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from properties.models import Property
from readings.models import MeterReading

from .calculator import calculate_bill
from .models import BillEstimate, Tariff
from .serializers import DISCLAIMER, BillEstimateSerializer, TariffSerializer


def units_in_period(prop, start, end):
    """Actual kWh used across a property's meters between two dates.

    Per meter: the latest reading on or before `end`, minus the latest reading
    before `start` (or the first reading inside the period if none exists).
    Returns (units, number_of_meters_used)."""
    total = Decimal(0)
    meters_used = 0
    for meter in prop.meters.all():
        readings = MeterReading.objects.filter(meter=meter)
        closing = readings.filter(reading_date__lte=end).order_by('-reading_date').first()
        opening = readings.filter(reading_date__lt=start).order_by('-reading_date').first()
        if opening is None:
            opening = readings.filter(reading_date__gte=start).order_by('reading_date').first()
        if closing is None or opening is None or closing.pk == opening.pk:
            continue
        total += closing.reading_value - opening.reading_value
        meters_used += 1
    return total, meters_used


class TariffViewSet(viewsets.ModelViewSet):
    serializer_class = TariffSerializer

    def get_queryset(self):
        queryset = Tariff.objects.filter(
            property__owner=self.request.user
        ).select_related('property')
        property_id = self.request.query_params.get('property')
        if property_id and property_id.isdigit():
            queryset = queryset.filter(property_id=property_id)
        return queryset


class BillEstimateViewSet(viewsets.ReadOnlyModelViewSet):
    """Bill history (read only). Bills are created through /bills/calculate/."""

    serializer_class = BillEstimateSerializer

    def get_queryset(self):
        return BillEstimate.objects.filter(
            property__owner=self.request.user
        ).select_related('property', 'tariff')

    @action(detail=False, methods=['post'])
    def calculate(self, request):
        try:
            prop = Property.objects.get(pk=request.data.get('property'), owner=request.user)
            tariff = Tariff.objects.get(pk=request.data.get('tariff'), property=prop)
        except (Property.DoesNotExist, Tariff.DoesNotExist, ValueError, TypeError):
            return Response(
                {'detail': 'Choose one of your properties and a tariff that belongs to it.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            start = date.fromisoformat(str(request.data.get('period_start')))
            end = date.fromisoformat(str(request.data.get('period_end')))
        except ValueError:
            return Response(
                {'detail': 'Enter valid start and end dates.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if end < start:
            return Response(
                {'detail': 'The end date cannot be before the start date.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        units, meters_used = units_in_period(prop, start, end)
        if meters_used == 0:
            return Response(
                {'detail': 'Not enough meter readings in this period. Add at least two '
                           'readings for a meter.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        figures = calculate_bill(units, tariff)
        bill = BillEstimate.objects.create(
            property=prop, tariff=tariff, period_start=start, period_end=end, **figures
        )
        return Response(
            BillEstimateSerializer(bill, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=['post'])
    def preview(self, request):
        """Bill for a typed-in number of units. Not saved."""
        try:
            tariff = Tariff.objects.get(
                pk=request.data.get('tariff'), property__owner=request.user
            )
            units = Decimal(str(request.data.get('units')))
            if units < 0:
                raise ValueError
        except (Tariff.DoesNotExist, ValueError, TypeError, ArithmeticError):
            return Response(
                {'detail': 'Choose one of your tariffs and enter units of 0 or more.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        data = {key: str(value) for key, value in calculate_bill(units, tariff).items()}
        data['disclaimer'] = DISCLAIMER
        return Response(data)