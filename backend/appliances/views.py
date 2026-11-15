from collections import defaultdict
from decimal import Decimal

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Appliance
from .serializers import ApplianceSerializer


class ApplianceViewSet(viewsets.ModelViewSet):
    serializer_class = ApplianceSerializer

    def get_queryset(self):
        queryset = Appliance.objects.filter(
            property__owner=self.request.user
        ).select_related('property')
        property_id = self.request.query_params.get('property')
        if property_id and property_id.isdigit():
            queryset = queryset.filter(property_id=property_id)
        return queryset

    @action(detail=False, methods=['get'])
    def summary(self, request):
        appliances = self.get_queryset()
        totals = {'daily': Decimal(0), 'weekly': Decimal(0), 'monthly': Decimal(0)}
        by_category = defaultdict(lambda: Decimal(0))

        for item in appliances:
            totals['daily'] += item.daily_kwh()
            totals['weekly'] += item.weekly_kwh()
            totals['monthly'] += item.monthly_kwh()
            by_category[item.get_category_display()] += item.monthly_kwh()

        return Response({
            'data_source': 'estimate',
            'note': 'Estimated from power rating and daily hours (30-day month). '
                    'Not actual meter readings.',
            'appliance_count': appliances.count(),
            'estimated_daily_kwh': totals['daily'],
            'estimated_weekly_kwh': totals['weekly'],
            'estimated_monthly_kwh': totals['monthly'],
            'monthly_by_category': [
                {'category': name, 'estimated_monthly_kwh': value}
                for name, value in sorted(by_category.items(), key=lambda pair: -pair[1])
            ],
        })