from rest_framework.routers import DefaultRouter

from .views import BillEstimateViewSet, TariffViewSet

router = DefaultRouter()
router.register('tariffs', TariffViewSet, basename='tariff')
router.register('bills', BillEstimateViewSet, basename='bill')

urlpatterns = router.urls