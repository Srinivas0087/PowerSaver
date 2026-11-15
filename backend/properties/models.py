from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Property(models.Model):
    class PropertyType(models.TextChoices):
        RESIDENTIAL = 'RESIDENTIAL', 'Residential'
        HOTEL = 'HOTEL', 'Hotel'
        SMALL_BUSINESS = 'SMALL_BUSINESS', 'Small Business'
        COMMERCIAL = 'COMMERCIAL', 'Commercial Facility'

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='properties',
    )
    name = models.CharField(max_length=100)
    property_type = models.CharField(
        max_length=20,
        choices=PropertyType.choices,
        default=PropertyType.RESIDENTIAL,
    )
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    monthly_limit_kwh = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text='Optional monthly consumption limit set by the user (kWh). Used for alerts.',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'properties'
        constraints = [
            models.UniqueConstraint(
                fields=['owner', 'name'],
                name='unique_property_name_per_owner',
            ),
        ]

    def __str__(self):
        return f'{self.name} ({self.get_property_type_display()})'