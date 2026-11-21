
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    TariffViewSet,
    BillEstimateViewSet,
    GenerateBillView,
)

router = DefaultRouter()

router.register(
    'tariffs',
    TariffViewSet,
    basename='tariff',
)

router.register(
    'estimates',
    BillEstimateViewSet,
    basename='bill-estimate',
)

urlpatterns = [
    path('generate/', GenerateBillView.as_view(), name='generate-bill'),
    path('', include(router.urls)),
]
