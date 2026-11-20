from django.urls import path

from .views import DailyView, MonthlyView, SummaryView, WeeklyView

urlpatterns = [
    path('analytics/daily/', DailyView.as_view()),
    path('analytics/weekly/', WeeklyView.as_view()),
    path('analytics/monthly/', MonthlyView.as_view()),
    path('analytics/summary/', SummaryView.as_view()),
]