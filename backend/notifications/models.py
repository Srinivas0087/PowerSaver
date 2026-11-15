from django.db import models


class Alert(models.Model):
    class AlertType(models.TextChoices):
        SUDDEN_INCREASE = 'SUDDEN_INCREASE', 'Sudden increase'
        UNUSUAL_PATTERN = 'UNUSUAL_PATTERN', 'Unusual usage pattern'
        LIMIT_EXCEEDED = 'LIMIT_EXCEEDED', 'Limit exceeded'
        HIGH_MONTHLY = 'HIGH_MONTHLY', 'High monthly consumption'

    class Severity(models.TextChoices):
        INFO = 'INFO', 'Info'
        WARNING = 'WARNING', 'Warning'
        CRITICAL = 'CRITICAL', 'Critical'

    property = models.ForeignKey(
        'properties.Property',
        on_delete=models.CASCADE,
        related_name='alerts',
    )
    alert_type = models.CharField(max_length=20, choices=AlertType.choices)
    severity = models.CharField(
        max_length=10, choices=Severity.choices, default=Severity.WARNING
    )
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_alert_type_display()}: {self.message[:40]}'


class Recommendation(models.Model):
    """A rule-based saving tip. Not AI-generated."""

    class Priority(models.TextChoices):
        LOW = 'LOW', 'Low'
        MEDIUM = 'MEDIUM', 'Medium'
        HIGH = 'HIGH', 'High'

    property = models.ForeignKey(
        'properties.Property',
        on_delete=models.CASCADE,
        related_name='recommendations',
    )
    title = models.CharField(max_length=150)
    message = models.TextField()
    reason = models.TextField(
        help_text='Which rule or data triggered this tip (shown to the user for transparency).'
    )
    priority = models.CharField(
        max_length=10, choices=Priority.choices, default=Priority.MEDIUM
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title