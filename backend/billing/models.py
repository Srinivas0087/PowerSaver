from django.core.validators import MinValueValidator
from django.db import models


class Tariff(models.Model):
    """Pricing rules chosen by the user. Bills are estimates based on these rules."""

    property = models.ForeignKey(
        'properties.Property',
        on_delete=models.CASCADE,
        related_name='tariffs',
    )
    name = models.CharField(max_length=100, default='My tariff')
    rate_per_unit = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text='Price per unit (kWh), used when no slabs are defined.',
    )
    fixed_charge = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )
    other_charges = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )
    slabs = models.JSONField(
        default=list,
        blank=True,
        help_text='Optional slabs, e.g. [{"up_to": 100, "rate": 4.5}, {"up_to": null, "rate": 6}]',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} - {self.rate_per_unit}/unit'


class BillEstimate(models.Model):
    """A saved bill ESTIMATE. It may differ from the electricity provider's real bill."""

    property = models.ForeignKey(
        'properties.Property',
        on_delete=models.CASCADE,
        related_name='bill_estimates',
    )
    tariff = models.ForeignKey(
        Tariff,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bill_estimates',
    )
    period_start = models.DateField()
    period_end = models.DateField()
    units_consumed = models.DecimalField(max_digits=12, decimal_places=2)
    energy_charges = models.DecimalField(max_digits=12, decimal_places=2)
    fixed_charges = models.DecimalField(max_digits=12, decimal_places=2)
    other_charges = models.DecimalField(max_digits=12, decimal_places=2)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Estimate {self.period_start} to {self.period_end}: {self.total_amount}'