
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import get_analytics_summary
from .forecast_services import get_consumption_forecast


class AnalyticsSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        summary = get_analytics_summary(request.user)
        return Response(summary)


class ConsumptionForecastView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        forecast = get_consumption_forecast(request.user)
        return Response(forecast)
