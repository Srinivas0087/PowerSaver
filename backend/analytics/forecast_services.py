
import calendar
from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from billing.models import Tariff
from billing.services import calculate_energy_charges
from properties.models import Property
from readings.models import MeterReading


ZERO = Decimal('0.00')
DAYS_IN_HISTORY = 30


def _overlapping_consumption(
    previous_date,
    current_date,
    consumption,
    period_start,
):
    """
    Estimate consumption overlapping a requested period.
    Consumption is distributed evenly across the reading interval.
    """
    interval_days = (current_date - previous_date).days

    if interval_days <= 0:
        return ZERO, 0

    overlap_start = max(
        previous_date,
        period_start - timedelta(days=1),
    )

    overlap_days = (current_date - overlap_start).days

    if overlap_days <= 0:
        return ZERO, 0

    estimated_consumption = (
        consumption * Decimal(overlap_days) / Decimal(interval_days)
    )

    return estimated_consumption, overlap_days


def _get_property_consumption(
    property_obj,
    today,
    history_start,
    month_start,
):
    """
    Calculate recent and current-month consumption for all active
    meters belonging to one property.

    Each meter's daily average is calculated independently and then
    combined. This avoids incorrect averaging across multiple meters.
    """
    recent_consumption = ZERO
    average_daily_consumption = ZERO
    month_consumption = ZERO
    recent_covered_days = 0
    valid_intervals = 0

    meters = property_obj.meters.filter(is_active=True)

    for meter in meters:
        readings = list(
            MeterReading.objects.filter(
                meter=meter,
                reading_date__lte=today,
            ).order_by('reading_date')
        )

        meter_recent_consumption = ZERO
        meter_covered_days = 0

        for previous, current in zip(readings, readings[1:]):
            interval_consumption = (
                current.reading_value - previous.reading_value
            )

            if interval_consumption <= ZERO:
                continue

            valid_intervals += 1

            recent_value, recent_days = _overlapping_consumption(
                previous.reading_date,
                current.reading_date,
                interval_consumption,
                history_start,
            )

            meter_recent_consumption += recent_value
            meter_covered_days += recent_days

            month_value, _ = _overlapping_consumption(
                previous.reading_date,
                current.reading_date,
                interval_consumption,
                month_start,
            )

            month_consumption += month_value

        recent_consumption += meter_recent_consumption

        if meter_covered_days > 0:
            average_daily_consumption += (
                meter_recent_consumption / Decimal(meter_covered_days)
            )

            recent_covered_days = max(
                recent_covered_days,
                meter_covered_days,
            )

    return {
        'recent_consumption': recent_consumption,
        'recent_covered_days': recent_covered_days,
        'average_daily_consumption': average_daily_consumption,
        'month_consumption': month_consumption,
        'valid_intervals': valid_intervals,
    }


def _estimate_property_bill(projected_units, tariff):
    """
    Calculate a projected electricity bill without saving a BillEstimate.
    """
    if tariff is None:
        return None

    try:
        energy_charges = calculate_energy_charges(
            projected_units,
            tariff,
        )

        fixed_charges = tariff.fixed_charge or ZERO
        other_charges = tariff.other_charges or ZERO

        energy_charges = energy_charges.quantize(Decimal('0.01'))
        fixed_charges = Decimal(fixed_charges).quantize(Decimal('0.01'))
        other_charges = Decimal(other_charges).quantize(Decimal('0.01'))

        total_amount = (
            energy_charges + fixed_charges + other_charges
        )

        return {
            'energy_charges': float(energy_charges),
            'fixed_charges': float(fixed_charges),
            'other_charges': float(other_charges),
            'total_amount': float(total_amount),
            'tariff_name': tariff.name,
        }

    except (ValueError, ArithmeticError):
        return {
            'error': (
                'The configured tariff slabs do not cover '
                'the projected usage.'
            ),
        }


def get_consumption_forecast(user):
    """
    Generate a current-month consumption and bill forecast
    for all properties belonging to the authenticated user.
    """
    today = timezone.localdate()

    month_start = today.replace(day=1)

    history_start = today - timedelta(
        days=DAYS_IN_HISTORY - 1
    )

    days_in_month = calendar.monthrange(
        today.year,
        today.month,
    )[1]

    elapsed_days = today.day

    remaining_days = max(
        days_in_month - elapsed_days,
        0,
    )

    properties = (
        Property.objects.filter(owner=user)
        .prefetch_related('meters')
        .order_by('name')
    )

    property_forecasts = []

    total_actual_usage = ZERO
    total_projected_usage = ZERO
    total_average_daily_usage = ZERO
    total_projected_bill = ZERO

    properties_with_forecasts = 0
    properties_without_forecasts = 0
    properties_with_bills = 0

    for property_obj in properties:
        consumption = _get_property_consumption(
            property_obj,
            today,
            history_start,
            month_start,
        )

        covered_days = consumption['recent_covered_days']

        recent_usage = consumption['recent_consumption']

        actual_month_usage = consumption['month_consumption']

        forecast_available = covered_days > 0

        if forecast_available:
            average_daily_usage = (
                consumption['average_daily_consumption']
            )

            projected_remaining_usage = (
                average_daily_usage * Decimal(remaining_days)
            )

            projected_month_usage = (
                actual_month_usage + projected_remaining_usage
            )

            properties_with_forecasts += 1

        else:
            average_daily_usage = ZERO
            projected_remaining_usage = ZERO
            projected_month_usage = None

            properties_without_forecasts += 1

        tariff = (
            Tariff.objects.filter(
                property=property_obj,
                is_active=True,
            )
            .order_by('-created_at')
            .first()
        )

        bill_estimate = None

        if forecast_available:
            bill_estimate = _estimate_property_bill(
                projected_month_usage,
                tariff,
            )

            total_actual_usage += actual_month_usage
            total_projected_usage += projected_month_usage
            total_average_daily_usage += average_daily_usage

        if (
            bill_estimate
            and 'total_amount' in bill_estimate
        ):
            total_projected_bill += Decimal(
                str(bill_estimate['total_amount'])
            )

            properties_with_bills += 1

        property_forecasts.append({
            'property_id': property_obj.id,
            'property_name': property_obj.name,

            'forecast_available': forecast_available,

            'message': (
                'Forecast calculated from recent meter readings.'
                if forecast_available
                else (
                    'Not enough historical meter readings '
                    'to calculate a forecast.'
                )
            ),

            'recent_consumption': round(
                float(recent_usage),
                2,
            ),

            'covered_days': covered_days,

            'average_daily_consumption': round(
                float(average_daily_usage),
                2,
            ),

            'actual_month_consumption': round(
                float(actual_month_usage),
                2,
            ),

            'projected_remaining_consumption': round(
                float(projected_remaining_usage),
                2,
            ),

            'projected_month_consumption': (
                round(float(projected_month_usage), 2)
                if projected_month_usage is not None
                else None
            ),

            'remaining_days': remaining_days,
            'days_in_month': days_in_month,

            'tariff_available': tariff is not None,

            'bill_estimate': bill_estimate,
        })

    return {
        'forecast_date': today.isoformat(),

        'month': today.strftime('%B %Y'),

        'history_days': DAYS_IN_HISTORY,

        'elapsed_days': elapsed_days,

        'remaining_days': remaining_days,

        'total_properties': len(property_forecasts),

        'properties_with_forecasts': properties_with_forecasts,

        'properties_without_forecasts': properties_without_forecasts,

        'properties_with_bills': properties_with_bills,

        'actual_month_consumption': round(
            float(total_actual_usage),
            2,
        ),

        'average_daily_consumption': round(
            float(total_average_daily_usage),
            2,
        ),

        'projected_month_consumption': round(
            float(total_projected_usage),
            2,
        ),

        'projected_bill_amount': round(
            float(total_projected_bill),
            2,
        ),

        'property_forecasts': property_forecasts,
    }
