
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Alert, Recommendation
from .serializers import AlertSerializer, RecommendationSerializer
from .services import generate_all_notifications


class AlertViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Alert.objects.filter(
            property__owner=self.request.user
        ).select_related('property')

        property_id = self.request.query_params.get('property')

        if property_id and property_id.isdigit():
            queryset = queryset.filter(property_id=property_id)

        is_read = self.request.query_params.get('is_read')

        if is_read in ['true', 'false']:
            queryset = queryset.filter(
                is_read=(is_read == 'true')
            )

        return queryset

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        alert = self.get_object()

        alert.is_read = True
        alert.save(update_fields=['is_read'])

        return Response(
            AlertSerializer(alert).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['post'])
    def generate(self, request):
        result = generate_all_notifications(request.user)

        return Response(
            result,
            status=status.HTTP_200_OK,
        )


class RecommendationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RecommendationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Recommendation.objects.filter(
            property__owner=self.request.user
        ).select_related('property')

        property_id = self.request.query_params.get('property')

        if property_id and property_id.isdigit():
            queryset = queryset.filter(property_id=property_id)

        return queryset

    @action(detail=False, methods=['post'])
    def generate(self, request):
        result = generate_all_notifications(request.user)

        return Response(
            result,
            status=status.HTTP_200_OK,
        )
