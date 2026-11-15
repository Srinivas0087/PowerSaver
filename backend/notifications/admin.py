from django.contrib import admin

from .models import Alert, Recommendation


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ('alert_type', 'severity', 'property', 'is_read', 'created_at')
    list_filter = ('alert_type', 'severity', 'is_read')


@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ('title', 'property', 'priority', 'created_at')