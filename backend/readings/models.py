from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models


class ElectricityMeter(models.Model):
    property = models.ForeignKey(
        'properties.Property',
        on_delete=models.CASCADE,
        related_name='meters',
    )
    meter_number = models.CharField(max_length=50)
    description = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['meter_number']
        constraints = [
            models.UniqueConstraint(
                fields=['property', 'meter_number'],
                name='unique_meter_number_per_property',
            ),
        ]

    def __str__(self):
        return f'Meter {self.meter_number}'


class MeterReading(models.Model):
    meter = models.ForeignKey(
        ElectricityMeter,
        on_delete=models.CASCADE,
        related_name='readings',
    )
    reading_date = models.DateField()
    reading_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text='Meter reading in kWh (units).',
    )
    notes = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-reading_date']
        constraints = [
            models.UniqueConstraint(
                fields=['meter', 'reading_date'],
                name='unique_reading_per_meter_per_date',
            ),
            models.CheckConstraint(
                condition=models.Q(reading_value__gte=0),
                name='reading_value_not_negative',
            ),
        ]

    def __str__(self):
        return f'{self.meter.meter_number} on {self.reading_date}: {self.reading_value}'

    def clean(self):
        """Business rule: readings must never go down over time."""
        super().clean()
        if self.meter_id is None or self.reading_date is None or self.reading_value is None:
            return  # other validators will report the missing fields

        others = MeterReading.objects.filter(meter_id=self.meter_id).exclude(pk=self.pk)
        previous = others.filter(reading_date__lt=self.reading_date).order_by('-reading_date').first()
        following = others.filter(reading_date__gt=self.reading_date).order_by('reading_date').first()

        if previous and self.reading_value < previous.reading_value:
            raise ValidationError(
                f'Reading cannot be lower than the previous reading '
                f'({previous.reading_value} on {previous.reading_date}).'
            )
        if following and self.reading_value > following.reading_value:
            raise ValidationError(
                f'Reading cannot be higher than the next reading '
                f'({following.reading_value} on {following.reading_date}).'
            )

    def save(self, *args, **kwargs):
        self.full_clean()  # always run every validation rule before saving
        super().save(*args, **kwargs)

    def previous_reading(self):
        return (
            MeterReading.objects
            .filter(meter_id=self.meter_id, reading_date__lt=self.reading_date)
            .order_by('-reading_date')
            .first()
        )

    @property
    def consumption(self):
        """Consumption = current reading - previous reading (None for the first reading)."""
        previous = self.previous_reading()
        if previous is None:
            return None
        return self.reading_value - previous.reading_value