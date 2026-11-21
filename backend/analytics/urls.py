
from django.urls import path

from .views import (
    AnalyticsSummaryView,
    ConsumptionForecastView,
)

urlpatterns = [
    path('', AnalyticsSummaryView.as_view(), name='analytics-summary'),
    path(
        'forecast/',
        ConsumptionForecastView.as_view(),
        name='consumption-forecast',
    ),
]
