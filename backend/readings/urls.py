from rest_framework.routers import DefaultRouter

from .views import ElectricityMeterViewSet, MeterReadingViewSet

router = DefaultRouter()
router.register('meters', ElectricityMeterViewSet, basename='meter')
router.register('readings', MeterReadingViewSet, basename='reading')

urlpatterns = router.urls