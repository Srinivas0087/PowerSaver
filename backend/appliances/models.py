from decimal import Decimal

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Appliance(models.Model):
    class Category(models.TextChoices):
        LIGHTING = 'LIGHTING', 'Lighting'
        COOLING = 'COOLING', 'Cooling (AC, fans, coolers)'
        HEATING = 'HEATING', 'Heating'
        KITCHEN = 'KITCHEN', 'Kitchen'
        ENTERTAINMENT = 'ENTERTAINMENT', 'Entertainment'
        OFFICE = 'OFFICE', 'Office / IT'
        LAUNDRY = 'LAUNDRY', 'Laundry'
        OTHER = 'OTHER', 'Other'

    property = models.ForeignKey(
        'properties.Property',
        on_delete=models.CASCADE,
        related_name='appliances',
    )
    name = models.CharField(max_length=100)
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.OTHER,
    )
    power_watts = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    daily_hours = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(24)],
        help_text='Average hours used per day (0 to 24).',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f'{self.name} x{self.quantity}'

    # ESTIMATED consumption (not a meter reading).
    # Formula: kWh = (Watts x Quantity x Hours) / 1000
    # A month is assumed to have 30 days.
    def _kwh_per_day(self):
        watts = Decimal(self.power_watts) * Decimal(self.quantity)
        return watts * Decimal(str(self.daily_hours)) / Decimal(1000)

    def daily_kwh(self):
        return round(self._kwh_per_day(), 3)

    def weekly_kwh(self):
        return round(self._kwh_per_day() * 7, 3)

    def monthly_kwh(self):
        return round(self._kwh_per_day() * 30, 3)


class ApplianceUsageEstimate(models.Model):
    """A saved snapshot of an appliance's ESTIMATED usage.
    This is an estimate from watts and hours, not a meter reading."""

    appliance = models.ForeignKey(
        Appliance,
        on_delete=models.CASCADE,
        related_name='usage_estimates',
    )
    daily_kwh = models.DecimalField(max_digits=10, decimal_places=3)
    weekly_kwh = models.DecimalField(max_digits=10, decimal_places=3)
    monthly_kwh = models.DecimalField(max_digits=10, decimal_places=3)
    calculated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-calculated_at']

    def __str__(self):
        return f'Estimate for {self.appliance.name}: {self.monthly_kwh} kWh/month'

    @classmethod
    def create_from(cls, appliance):
        return cls.objects.create(
            appliance=appliance,
            daily_kwh=appliance.daily_kwh(),
            weekly_kwh=appliance.weekly_kwh(),
            monthly_kwh=appliance.monthly_kwh(),
        )