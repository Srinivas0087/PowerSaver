from collections import defaultdict
from datetime import timedelta
from decimal import Decimal

from rest_framework.response import Response
from rest_framework.views import APIView

from .services import daily_consumption, to_number

NOTE = (
    'Built from your actual meter readings. Consumption between two readings is '
    'spread evenly over the days in between, so daily values are averages.'
)


def int_param(request, name, default, maximum):
    value = request.query_params.get(name, '')
    if value.isdigit() and 1 <= int(value) <= maximum:
        return int(value)
    return default


def property_param(request):
    value = request.query_params.get('property', '')
    return int(value) if value.isdigit() else None


def reply(series, **extra):
    return Response({'data_source': 'meter_readings', 'note': NOTE, 'series': series, **extra})


class DailyView(APIView):
    def get(self, request):
        days = daily_consumption(request.user, property_param(request))
        limit = int_param(request, 'days', 30, 366)
        series = [
            {'date': day.isoformat(), 'kwh': to_number(days[day])}
            for day in sorted(days)[-limit:]
        ]
        return reply(series)


class WeeklyView(APIView):
    def get(self, request):
        days = daily_consumption(request.user, property_param(request))
        weeks = defaultdict(lambda: Decimal(0))
        for day, kwh in days.items():
            weeks[day - timedelta(days=day.weekday())] += kwh  # week starts on Monday
        limit = int_param(request, 'weeks', 8, 104)
        series = [
            {'week_start': start.isoformat(), 'kwh': to_number(weeks[start])}
            for start in sorted(weeks)[-limit:]
        ]
        return reply(series)


class MonthlyView(APIView):
    def get(self, request):
        days = daily_consumption(request.user, property_param(request))
        months = defaultdict(lambda: Decimal(0))
        for day, kwh in days.items():
            months[day.strftime('%Y-%m')] += kwh
        limit = int_param(request, 'months', 12, 60)
        series = [
            {'month': month, 'kwh': to_number(months[month])}
            for month in sorted(months)[-limit:]
        ]
        return reply(series)


class SummaryView(APIView):
    def get(self, request):
        days = daily_consumption(request.user, property_param(request))
        if not days:
            return reply([], has_data=False)

        latest = max(days)
        last_7 = sum((v for d, v in days.items() if d > latest - timedelta(days=7)), Decimal(0))
        last_30 = sum((v for d, v in days.items() if d > latest - timedelta(days=30)), Decimal(0))

        this_key = latest.strftime('%Y-%m')
        previous_key = (latest.replace(day=1) - timedelta(days=1)).strftime('%Y-%m')
        this_month = sum((v for d, v in days.items() if d.strftime('%Y-%m') == this_key), Decimal(0))
        previous_month = sum((v for d, v in days.items() if d.strftime('%Y-%m') == previous_key), Decimal(0))

        change = None
        if previous_month > 0:
            change = to_number((this_month - previous_month) / previous_month * 100)

        return reply(
            [],
            has_data=True,
            latest_date=latest.isoformat(),
            total_kwh=to_number(sum(days.values(), Decimal(0))),
            latest_day_kwh=to_number(days[latest]),
            last_7_days_kwh=to_number(last_7),
            last_30_days_kwh=to_number(last_30),
            this_month=this_key,
            this_month_kwh=to_number(this_month),
            previous_month=previous_key,
            previous_month_kwh=to_number(previous_month),
            change_percent=change,
        )