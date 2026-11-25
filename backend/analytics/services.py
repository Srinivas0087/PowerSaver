
from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from readings.models import ElectricityMeter, MeterReading
from billing.models import Tariff
from billing.services import calculate_energy_charges


ZERO = Decimal("0.00")


def get_meter_consumption(meter, start_date=None, end_date=None):
    """
    Calculate consumption between consecutive readings.
    Future readings and negative consumption are excluded.
    """
    today = timezone.localdate()

    readings = MeterReading.objects.filter(
        meter=meter,
        reading_date__lte=today,
    ).order_by("reading_date")

    previous_value = None

    if start_date:
        previous = (
            readings.filter(reading_date__lt=start_date)
            .order_by("-reading_date")
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

            if consumption >= ZERO:
                results.append((reading.reading_date, consumption))

        previous_value = reading.reading_value

    return results


def get_meter_average_daily_consumption(meter, days=30):
    """
    Calculate average daily usage from recent reading intervals.
    Usage is prorated when an interval overlaps the 30-day window.
    """
    today = timezone.localdate()
    window_start = today - timedelta(days=days - 1)

    readings = list(
        MeterReading.objects.filter(
            meter=meter,
            reading_date__lte=today,
        ).order_by("reading_date")
    )

    total_consumption = ZERO
    total_days = 0

    for index in range(1, len(readings)):
        previous = readings[index - 1]
        current = readings[index]

        interval_days = (current.reading_date - previous.reading_date).days

        if interval_days <= 0:
            continue

        consumption = current.reading_value - previous.reading_value

        if consumption < ZERO:
            continue

        overlap_start = max(previous.reading_date, window_start)
        overlap_end = min(current.reading_date, today)
        overlap_days = (overlap_end - overlap_start).days

        if overlap_days <= 0:
            continue

        prorated_consumption = (
            consumption * Decimal(overlap_days) / Decimal(interval_days)
        )

        total_consumption += prorated_consumption
        total_days += overlap_days

    if total_days == 0:
        return None

    return total_consumption / Decimal(total_days)


def get_analytics_summary(user):
    today = timezone.localdate()

    meters = list(
        ElectricityMeter.objects.filter(
            property__owner=user,
            is_active=True,
        ).select_related("property")
    )

    month_start = today.replace(day=1)
    previous_month_end = month_start - timedelta(days=1)
    previous_month_start = previous_month_end.replace(day=1)
    daily_start = today - timedelta(days=6)

    monthly_starts = []
    current_start = month_start

    for _ in range(6):
        monthly_starts.append(current_start)
        previous_end = current_start - timedelta(days=1)
        current_start = previous_end.replace(day=1)

    monthly_starts.reverse()

    total_consumption = ZERO
    current_month_consumption = ZERO
    previous_month_consumption = ZERO

    total_properties = user.properties.count()
    total_meters = len(meters)

    daily_totals = {
        daily_start + timedelta(days=offset): ZERO
        for offset in range(7)
    }

    monthly_totals = {
        start: ZERO for start in monthly_starts
    }

    property_totals = {}

    for meter in meters:
        property_id = meter.property_id

        if property_id not in property_totals:
            property_totals[property_id] = {
                "property": meter.property.name,
                "consumption": ZERO,
            }

        all_consumption = get_meter_consumption(
            meter,
            end_date=today,
        )

        for reading_date, consumption in all_consumption:
            total_consumption += consumption
            property_totals[property_id]["consumption"] += consumption

        current_readings = get_meter_consumption(
            meter,
            month_start,
            today,
        )

        for reading_date, consumption in current_readings:
            current_month_consumption += consumption

        previous_readings = get_meter_consumption(
            meter,
            previous_month_start,
            previous_month_end,
        )

        for reading_date, consumption in previous_readings:
            previous_month_consumption += consumption

        daily_readings = get_meter_consumption(
            meter,
            daily_start,
            today,
        )

        for reading_date, consumption in daily_readings:
            if reading_date in daily_totals:
                daily_totals[reading_date] += consumption

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

    return {
        "total_properties": total_properties,
        "total_meters": total_meters,
        "total_consumption": float(total_consumption),
        "current_month_consumption": float(current_month_consumption),
        "previous_month_consumption": float(previous_month_consumption),
        "daily_consumption": [
            {
                "date": reading_date.isoformat(),
                "consumption": float(consumption),
            }
            for reading_date, consumption in daily_totals.items()
        ],
        "monthly_consumption": [
            {
                "month": start_date.strftime("%b %Y"),
                "consumption": float(consumption),
            }
            for start_date, consumption in monthly_totals.items()
        ],
        "property_consumption": [
            {
                "property": item["property"],
                "consumption": float(item["consumption"]),
            }
            for item in property_totals.values()
        ],
    }


def get_forecast_summary(user):
    """
    Project current-month consumption and estimated bill.
    Forecasts are based on recent average daily consumption.
    No BillEstimate records are created.
    """
    today = timezone.localdate()
    month_start = today.replace(day=1)

    if today.month == 12:
        next_month = today.replace(
            year=today.year + 1,
            month=1,
            day=1,
        )
    else:
        next_month = today.replace(
            month=today.month + 1,
            day=1,
        )

    month_end = next_month - timedelta(days=1)
    remaining_days = (month_end - today).days

    meters = list(
        ElectricityMeter.objects.filter(
            property__owner=user,
            is_active=True,
        ).select_related("property")
    )

    property_data = {}

    for meter in meters:
        property_id = meter.property_id

        if property_id not in property_data:
            property_data[property_id] = {
                "property": meter.property,
                "actual_month_consumption": ZERO,
                "average_daily_consumption": ZERO,
                "has_forecast_data": False,
            }

        actual_readings = get_meter_consumption(
            meter,
            month_start,
            today,
        )

        for reading_date, consumption in actual_readings:
            property_data[property_id]["actual_month_consumption"] += consumption

        average = get_meter_average_daily_consumption(meter)

        if average is not None:
            property_data[property_id]["average_daily_consumption"] += average
            property_data[property_id]["has_forecast_data"] = True

    forecast_properties = []
    total_actual = ZERO
    total_projected = ZERO
    total_average_daily = ZERO
    total_predicted_bill = ZERO
    bill_available = False
    forecast_available = False

    for property_id, item in property_data.items():
        property_obj = item["property"]
        actual = item["actual_month_consumption"]

        average = (
            item["average_daily_consumption"]
            if item["has_forecast_data"]
            else None
        )

        total_actual += actual

        if average is not None:
            forecast_available = True
            projected = actual + (average * Decimal(remaining_days))
            total_average_daily += average
            total_projected += projected
        else:
            projected = None

        tariff = (
            Tariff.objects.filter(
                property_id=property_id,
                is_active=True,
            )
            .order_by("-created_at")
            .first()
        )

        predicted_bill = None
        tariff_message = ""

        if projected is not None and tariff:
            try:
                energy_charges = calculate_energy_charges(
                    projected,
                    tariff,
                )

                predicted_bill = (
                    energy_charges
                    + tariff.fixed_charge
                    + tariff.other_charges
                )

                total_predicted_bill += predicted_bill
                bill_available = True

            except (ValueError, TypeError):
                tariff_message = (
                    "The tariff slabs do not cover the projected usage."
                )
        elif projected is not None:
            tariff_message = "No active tariff is configured for this property."

        forecast_properties.append({
            "property_id": property_id,
            "property": property_obj.name,
            "actual_month_consumption": float(actual),
            "average_daily_consumption": (
                float(average) if average is not None else None
            ),
            "projected_month_consumption": (
                float(projected) if projected is not None else None
            ),
            "predicted_bill": (
                float(predicted_bill) if predicted_bill is not None else None
            ),
            "tariff_message": tariff_message,
        })

    forecast_daily = []

    if forecast_available:
        for offset in range(1, 8):
            forecast_date = today + timedelta(days=offset)

            forecast_daily.append({
                "date": forecast_date.isoformat(),
                "consumption": float(total_average_daily),
            })

    if not meters:
        message = "Add an active electricity meter to start forecasting."
    elif not forecast_available:
        message = (
            "More meter readings are needed. Add at least two dated readings "
            "within a recent period to calculate a forecast."
        )
    else:
        message = (
            "Forecast based on recent meter-reading intervals. "
            "Actual usage may differ."
        )

    return {
        "forecast_available": forecast_available,
        "bill_available": bill_available,
        "message": message,
        "forecast_date": today.isoformat(),
        "month_end": month_end.isoformat(),
        "remaining_days": remaining_days,
        "actual_month_consumption": float(total_actual),
        "average_daily_consumption": (
            float(total_average_daily) if forecast_available else None
        ),
        "projected_month_consumption": (
            float(total_projected) if forecast_available else None
        ),
        "predicted_monthly_bill": (
            float(total_predicted_bill) if bill_available else None
        ),
        "forecast_daily": forecast_daily,
        "properties": forecast_properties,
    }
