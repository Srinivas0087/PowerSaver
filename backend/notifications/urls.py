
from rest_framework.routers import DefaultRouter

from .views import AlertViewSet, RecommendationViewSet


router = DefaultRouter()

router.register('alerts', AlertViewSet, basename='alert')
router.register(
    'recommendations',
    RecommendationViewSet,
    basename='recommendation',
)

urlpatterns = router.urls
