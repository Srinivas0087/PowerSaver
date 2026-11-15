from django.contrib import admin

from .models import BillEstimate, Tariff


@admin.register(Tariff)
class TariffAdmin(admin.ModelAdmin):
    list_display = ('name', 'property', 'rate_per_unit', 'fixed_charge', 'is_active')


@admin.register(BillEstimate)
class BillEstimateAdmin(admin.ModelAdmin):
    list_display = ('property', 'period_start', 'period_end', 'units_consumed', 'total_amount')