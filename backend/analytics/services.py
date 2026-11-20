from collections import defaultdict
from datetime import timedelta
from decimal import Decimal

from readings.models import ElectricityMeter, MeterReading


def daily_consumption(user, property_id=None):
    """Return {date: kWh} built from the user's actual meter readings.

    Between two consecutive readings of a meter, the consumption is spread
    evenly over each day of that interval (an average, not a measurement).
    Only days covered by two readings get a value."""
    meters = ElectricityMeter.objects.filter(property__owner=user)
    if property_id:
        meters = meters.filter(property_id=property_id)

    days = defaultdict(lambda: Decimal(0))
    for meter in meters:
        readings = list(MeterReading.objects.filter(meter=meter).order_by('reading_date'))
        for previous, current in zip(readings, readings[1:]):
            span = (current.reading_date - previous.reading_date).days
            if span <= 0:
                continue
            per_day = (current.reading_value - previous.reading_value) / span
            for offset in range(1, span + 1):
                days[previous.reading_date + timedelta(days=offset)] += per_day
    return dict(days)


def to_number(value):
    return float(round(value, 3))