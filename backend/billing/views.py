from django.shortcuts import render

# Create your views here.

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Tariff, BillEstimate
from .serializers import (
    TariffSerializer,
    BillEstimateSerializer,
    BillGenerationSerializer,
)
from .services import generate_bill_estimate


class TariffViewSet(viewsets.ModelViewSet):
    serializer_class = TariffSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Tariff.objects.filter(
            property__owner=self.request.user
        ).select_related('property')


class BillEstimateViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BillEstimateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = BillEstimate.objects.filter(
            property__owner=self.request.user
        ).select_related('property', 'tariff')

        property_id = self.request.query_params.get('property')

        if property_id and property_id.isdigit():
            queryset = queryset.filter(
                property_id=property_id
            )

        return queryset


class GenerateBillView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = BillGenerationSerializer(
            data=request.data,
            context={'request': request},
        )

        serializer.is_valid(raise_exception=True)

        try:
            bill = generate_bill_estimate(
                property=serializer.validated_data['property'],
                tariff=serializer.validated_data['tariff'],
                period_start=serializer.validated_data['period_start'],
                period_end=serializer.validated_data['period_end'],
            )
        except ValueError as error:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'detail': str(error)})

        response_serializer = BillEstimateSerializer(bill)

        return Response(
            response_serializer.data,
            status=201,
        )
