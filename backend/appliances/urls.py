from rest_framework.routers import DefaultRouter

from .views import ApplianceViewSet

router = DefaultRouter()
router.register('appliances', ApplianceViewSet, basename='appliance')

urlpatterns = router.urls