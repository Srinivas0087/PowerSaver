
from datetime import date, timedelta
from decimal import Decimal

from readings.models import ElectricityMeter, MeterReading


def get_meter_consumption(meter, start_date=None, end_date=None):
    """
    Calculate consumption from consecutive meter readings.
    Returns a list of (reading_date, consumption) pairs.
    """

    readings = MeterReading.objects.filter(
        meter=meter
    ).order_by('reading_date')

    previous_value = None

    if start_date:
        previous = (
            readings.filter(reading_date__lt=start_date)
            .order_by('-reading_date')
            .first()
        )

        if previous:
            previous_value = previous.reading_value

        readings = readings.filter(reading_date__gte=start_date)

    if end_date:
        readings = readings.filter(reading_date__lte=end_date)

    results = []

    for reading in readings:
        if previous_value is not None:
            consumption = reading.reading_value - previous_value

            results.append((
                reading.reading_date,
                consumption,
            ))

        previous_value = reading.reading_value

    return results


def get_analytics_summary(user):
    today = date.today()

    meters = list(
        ElectricityMeter.objects.filter(
            property__owner=user,
            is_active=True,
        ).select_related('property')
    )

    # Date ranges
    month_start = today.replace(day=1)

    previous_month_end = month_start - timedelta(days=1)
    previous_month_start = previous_month_end.replace(day=1)

    daily_start = today - timedelta(days=6)

    # Six monthly periods, including the current month
    monthly_starts = []
    current_start = month_start

    for _ in range(6):
        monthly_starts.append(current_start)

        previous_end = current_start - timedelta(days=1)
        current_start = previous_end.replace(day=1)

    monthly_starts.reverse()

    # Summary calculations
    total_consumption = Decimal('0.00')

    current_month_consumption = Decimal('0.00')

    previous_month_consumption = Decimal('0.00')

    total_properties = user.properties.count()
    total_meters = len(meters)

    # Daily chart data
    daily_totals = {}

    for day_offset in range(7):
        current_date = daily_start + timedelta(days=day_offset)
        daily_totals[current_date] = Decimal('0.00')

    # Monthly chart data
    monthly_totals = {
        start: Decimal('0.00')
        for start in monthly_starts
    }

    # Property-wise chart data
    property_totals = {}

    for meter in meters:

        property_id = meter.property_id

        if property_id not in property_totals:
            property_totals[property_id] = {
                'property': meter.property.name,
                'consumption': Decimal('0.00'),
            }

        # Calculate all consumption, including future-dated readings
        all_consumption = get_meter_consumption(meter)

        for reading_date, consumption in all_consumption:
            total_consumption += consumption
            property_totals[property_id]['consumption'] += consumption

        # Calculate current month up to today
        current_readings = get_meter_consumption(
            meter,
            month_start,
            today,
        )

        for reading_date, consumption in current_readings:
            current_month_consumption += consumption

        # Calculate previous month
        previous_readings = get_meter_consumption(
            meter,
            previous_month_start,
            previous_month_end,
        )

        for reading_date, consumption in previous_readings:
            previous_month_consumption += consumption

        # Calculate daily consumption for the last seven days
        daily_readings = get_meter_consumption(
            meter,
            daily_start,
            today,
        )

        for reading_date, consumption in daily_readings:
            if reading_date in daily_totals:
                daily_totals[reading_date] += consumption

        # Calculate monthly consumption for the last six months
        for index, start_date in enumerate(monthly_starts):

            if index < len(monthly_starts) - 1:
                end_date = monthly_starts[index + 1] - timedelta(days=1)
            else:
                end_date = today

            monthly_readings = get_meter_consumption(
                meter,
                start_date,
                end_date,
            )

            for reading_date, consumption in monthly_readings:
                monthly_totals[start_date] += consumption

    # Format daily chart data
    daily_consumption = [
        {
            'date': reading_date.isoformat(),
            'consumption': float(consumption),
        }
        for reading_date, consumption in daily_totals.items()
    ]

    # Format monthly chart data
    monthly_consumption = [
        {
            'month': start_date.strftime('%b %Y'),
            'consumption': float(consumption),
        }
        for start_date, consumption in monthly_totals.items()
    ]

    # Format property chart data
    property_consumption = [
        {
            'property': item['property'],
            'consumption': float(item['consumption']),
        }
        for item in property_totals.values()
    ]

    return {
        'total_properties': total_properties,
        'total_meters': total_meters,
        'total_consumption': float(total_consumption),
        'current_month_consumption': float(current_month_consumption),
        'previous_month_consumption': float(previous_month_consumption),
        'daily_consumption': daily_consumption,
        'monthly_consumption': monthly_consumption,
        'property_consumption': property_consumption,
    }
