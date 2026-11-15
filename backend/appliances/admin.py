from django.contrib import admin

from .models import Appliance, ApplianceUsageEstimate


@admin.register(Appliance)
class ApplianceAdmin(admin.ModelAdmin):
    list_display = ('name', 'property', 'category', 'power_watts', 'quantity', 'daily_hours')


@admin.register(ApplianceUsageEstimate)
class ApplianceUsageEstimateAdmin(admin.ModelAdmin):
    list_display = ('appliance', 'daily_kwh', 'weekly_kwh', 'monthly_kwh', 'calculated_at')