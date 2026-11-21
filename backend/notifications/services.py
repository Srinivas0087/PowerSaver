
from decimal import Decimal

from django.utils import timezone

from appliances.models import Appliance
from readings.models import ElectricityMeter, MeterReading

from .models import Alert, Recommendation


def _create_alert(property_obj, alert_type, severity, message):
    """Avoid creating duplicate alerts on the same day."""
    today = timezone.localdate()

    existing = Alert.objects.filter(
        property=property_obj,
        alert_type=alert_type,
        message=message,
        created_at__date=today,
    ).exists()

    if existing:
        return False

    Alert.objects.create(
        property=property_obj,
        alert_type=alert_type,
        severity=severity,
        message=message,
    )

    return True


def get_monthly_consumption(property_obj):
    """Calculate actual electricity consumption for the current month."""
    today = timezone.localdate()
    month_start = today.replace(day=1)

    total = Decimal('0.00')

    meters = ElectricityMeter.objects.filter(
        property=property_obj,
        is_active=True,
    )

    for meter in meters:
        readings = MeterReading.objects.filter(
            meter=meter,
            reading_date__gte=month_start,
            reading_date__lte=today,
        ).order_by('reading_date')

        for reading in readings:
            consumption = reading.consumption

            if consumption is not None:
                total += consumption

    return total


def generate_alerts_for_property(property_obj):
    """Generate monthly-limit and sudden-increase alerts."""
    created_count = 0

    # 1. Monthly consumption limit alerts
    monthly_usage = get_monthly_consumption(property_obj)
    monthly_limit = property_obj.monthly_limit_kwh

    if monthly_limit is not None and monthly_limit > 0:

        if monthly_usage >= monthly_limit:
            message = (
                f'{property_obj.name} has consumed {monthly_usage} kWh '
                f'this month, exceeding its monthly limit of '
                f'{monthly_limit} kWh.'
            )

            if _create_alert(
                property_obj,
                Alert.AlertType.LIMIT_EXCEEDED,
                Alert.Severity.CRITICAL,
                message,
            ):
                created_count += 1

        elif monthly_usage >= monthly_limit * Decimal('0.80'):
            message = (
                f'{property_obj.name} has used {monthly_usage} kWh '
                f'of its {monthly_limit} kWh monthly limit. '
                f'You have reached at least 80% of your limit.'
            )

            if _create_alert(
                property_obj,
                Alert.AlertType.HIGH_MONTHLY,
                Alert.Severity.WARNING,
                message,
            ):
                created_count += 1

    # 2. Sudden increase in meter consumption
    meters = ElectricityMeter.objects.filter(
        property=property_obj,
        is_active=True,
    )

    today = timezone.localdate()

    for meter in meters:
        readings = list(
            MeterReading.objects.filter(
                meter=meter,
                reading_date__lte=today,
            ).order_by('-reading_date')[:3]
        )

        if len(readings) < 3:
            continue

        latest_usage = (
            readings[0].reading_value - readings[1].reading_value
        )

        previous_usage = (
            readings[1].reading_value - readings[2].reading_value
        )

        if (
            previous_usage > 0
            and latest_usage >= previous_usage * Decimal('1.5')
        ):
            message = (
                f'Meter {meter.meter_number} at {property_obj.name} '
                f'shows a sudden increase in consumption: '
                f'{latest_usage} kWh compared with the previous '
                f'{previous_usage} kWh interval.'
            )

            if _create_alert(
                property_obj,
                Alert.AlertType.SUDDEN_INCREASE,
                Alert.Severity.WARNING,
                message,
            ):
                created_count += 1

    return created_count


def generate_recommendations_for_property(property_obj):
    """Generate rule-based appliance energy-saving recommendations."""
    created_count = 0

    appliances = Appliance.objects.filter(
        property=property_obj
    ).order_by('-power_watts')

    today = timezone.localdate()

    for appliance in appliances:
        monthly_usage = Decimal(str(appliance.monthly_kwh()))

        # Generate recommendations for appliances consuming
        # at least 50 kWh per month.
        if monthly_usage < Decimal('50'):
            continue

        title = f'Reduce usage of {appliance.name}'

        message = (
            f'{appliance.name} is estimated to consume '
            f'{monthly_usage} kWh per month. Try reducing its '
            f'daily operating hours or switching it off when not needed.'
        )

        reason = (
            f'The estimated monthly consumption of this appliance '
            f'is {monthly_usage} kWh, based on its power rating, '
            f'quantity and daily usage hours. This is an estimate, '
            f'not an actual meter reading.'
        )

        # Prevent duplicate recommendations on the same day.
        exists = Recommendation.objects.filter(
            property=property_obj,
            title=title,
            created_at__date=today,
        ).exists()

        if exists:
            continue

        priority = (
            Recommendation.Priority.HIGH
            if monthly_usage >= Decimal('150')
            else Recommendation.Priority.MEDIUM
        )

        Recommendation.objects.create(
            property=property_obj,
            title=title,
            message=message,
            reason=reason,
            priority=priority,
        )

        created_count += 1

    return created_count


def generate_all_notifications(user):
    """Generate alerts and recommendations for all user properties."""
    from properties.models import Property

    properties = Property.objects.filter(owner=user)

    alert_count = 0
    recommendation_count = 0

    for property_obj in properties:
        alert_count += generate_alerts_for_property(property_obj)

        recommendation_count += (
            generate_recommendations_for_property(property_obj)
        )

    return {
        'alerts_created': alert_count,
        'recommendations_created': recommendation_count,
    }
