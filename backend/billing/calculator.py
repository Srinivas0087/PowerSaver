from decimal import Decimal, ROUND_HALF_UP

TWO_PLACES = Decimal('0.01')


def money(value):
    return Decimal(value).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def energy_charges(units, rate_per_unit, slabs=None):
    """Energy charge for `units` kWh.

    With slabs, e.g. [{"up_to": 100, "rate": 5}, {"up_to": None, "rate": 10}],
    each band of units is charged at its own rate. Without slabs the charge
    is units x rate_per_unit.
    """
    units = Decimal(str(units))
    if not slabs:
        return money(units * Decimal(str(rate_per_unit)))

    total = Decimal(0)
    lower = Decimal(0)
    for slab in slabs:
        rate = Decimal(str(slab['rate']))
        upper = slab.get('up_to')
        if upper is None:
            in_slab = max(units - lower, Decimal(0))
        else:
            upper = Decimal(str(upper))
            in_slab = max(min(units, upper) - lower, Decimal(0))
            lower = upper
        total += in_slab * rate
    return money(total)


def calculate_bill(units, tariff):
    units = Decimal(str(units))
    energy = energy_charges(units, tariff.rate_per_unit, tariff.slabs)
    fixed = money(tariff.fixed_charge)
    other = money(tariff.other_charges)
    return {
        'units_consumed': money(units),
        'energy_charges': energy,
        'fixed_charges': fixed,
        'other_charges': other,
        'total_amount': money(energy + fixed + other),
    }