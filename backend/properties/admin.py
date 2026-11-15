from django.contrib import admin

from .models import Property


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'property_type', 'city', 'monthly_limit_kwh')
    list_filter = ('property_type',)