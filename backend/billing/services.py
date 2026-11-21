
from decimal import Decimal

from readings.models import ElectricityMeter, MeterReading


def calculate_property_consumption(property, start_date, end_date):
    """
    Calculate consumption from active meters belonging to a property.
    A reading before the period is used as the starting baseline.
    """

    total_consumption = Decimal('0.00')

    meters = ElectricityMeter.objects.filter(
        property=property,
        is_active=True,
    )

    for meter in meters:

        previous = (
            MeterReading.objects
            .filter(
                meter=meter,
                reading_date__lt=start_date,
            )
            .order_by('-reading_date')
            .first()
        )

        previous_value = (
            previous.reading_value if previous else None
        )

        period_readings = (
            MeterReading.objects
            .filter(
                meter=meter,
                reading_date__gte=start_date,
                reading_date__lte=end_date,
            )
            .order_by('reading_date')
        )

        for reading in period_readings:

            if previous_value is not None:
                total_consumption += (
                    reading.reading_value - previous_value
                )

            previous_value = reading.reading_value

    return total_consumption


def calculate_energy_charges(units, tariff):
    """
    Calculate energy charges using either flat pricing
    or incremental slab pricing.
    """

    units = Decimal(str(units))

    if not tariff.slabs:
        return (
            units * tariff.rate_per_unit
        ).quantize(Decimal('0.01'))

    remaining_units = units
    previous_limit = Decimal('0.00')
    energy_charges = Decimal('0.00')

    for slab in tariff.slabs:

        limit = slab.get('up_to')

        rate = Decimal(str(slab['rate']))

        if limit is None:
            slab_units = remaining_units
        else:
            limit = Decimal(str(limit))
            slab_capacity = limit - previous_limit

            slab_units = min(
                remaining_units,
                slab_capacity,
            )

        if slab_units > 0:
            energy_charges += slab_units * rate
            remaining_units -= slab_units

        if limit is not None:
            previous_limit = limit

        if remaining_units <= 0:
            break

    if remaining_units > 0:
        raise ValueError(
            'The tariff slabs do not cover all consumed units. '
            'Add a final slab with up_to set to null.'
        )

    return energy_charges.quantize(Decimal('0.01'))


def generate_bill_estimate(
    property,
    tariff,
    period_start,
    period_end,
):
    units = calculate_property_consumption(
        property,
        period_start,
        period_end,
    )

    energy_charges = calculate_energy_charges(
        units,
        tariff,
    )

    fixed_charges = tariff.fixed_charge
    other_charges = tariff.other_charges

    total_amount = (
        energy_charges
        + fixed_charges
        + other_charges
    ).quantize(Decimal('0.01'))

    from .models import BillEstimate

    return BillEstimate.objects.create(
        property=property,
        tariff=tariff,
        period_start=period_start,
        period_end=period_end,
        units_consumed=units,
        energy_charges=energy_charges,
        fixed_charges=fixed_charges,
        other_charges=other_charges,
        total_amount=total_amount,
    )
