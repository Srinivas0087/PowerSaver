from django.contrib import admin

from .models import ElectricityMeter, MeterReading


@admin.register(ElectricityMeter)
class ElectricityMeterAdmin(admin.ModelAdmin):
    list_display = ('meter_number', 'property', 'is_active')


@admin.register(MeterReading)
class MeterReadingAdmin(admin.ModelAdmin):
    list_display = ('meter', 'reading_date', 'reading_value')
    list_filter = ('meter',)