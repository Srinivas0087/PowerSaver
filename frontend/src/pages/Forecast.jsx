
import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

import {
  getConsumptionForecast,
  getForecastAnalytics,
} from '../services/forecastService.js'

function Forecast() {
  const [forecast, setForecast] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError('')

        const [forecastData, analyticsData] = await Promise.all([
          getConsumptionForecast(),
          getForecastAnalytics(),
        ])

        setForecast(forecastData)
        setAnalytics(analyticsData)
      } catch (err) {
        setError(
          err.response?.data?.detail ||
          'Unable to load forecast. Please check the backend.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const formatNumber = (value) =>
    Number(value ?? 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })

  const formatCurrency = (value) =>
    Number(value ?? 0).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    })

  if (loading) {
    return (
      <div className="container py-4">
        <h4>Loading electricity forecast...</h4>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-4">
        <h2>Consumption Forecast</h2>
        <div className="alert alert-danger">{error}</div>
      </div>
    )
  }

  if (!forecast) {
    return (
      <div className="container py-4">
        <div className="alert alert-warning">
          No forecast information available.
        </div>
      </div>
    )
  }

  const dailyData = analytics?.daily_consumption || []
  const monthlyData = analytics?.monthly_consumption || []
  const properties = forecast.property_forecasts || []

  const comparisonData = [
    {
      category: 'Actual usage',
      consumption: Number(forecast.actual_month_consumption || 0),
    },
    {
      category: 'Projected usage',
      consumption: Number(forecast.projected_month_consumption || 0),
    },
  ]

  const summaryCards = [
    {
      title: 'Actual Consumption',
      value: formatNumber(forecast.actual_month_consumption),
      unit: 'kWh',
      color: 'primary',
    },
    {
      title: 'Average Daily Usage',
      value: formatNumber(forecast.average_daily_consumption),
      unit: 'kWh',
      color: 'success',
    },
    {
      title: 'Projected Monthly Usage',
      value: formatNumber(forecast.projected_month_consumption),
      unit: 'kWh',
      color: 'warning',
    },
    {
      title: 'Predicted Electricity Bill',
      value: formatCurrency(forecast.projected_bill_amount),
      unit: '',
      color: 'info',
    },
  ]

  return (
    <div className="container py-4">

      {/* Heading */}
      <div className="mb-4">
        <h2 className="fw-bold">Historical Comparison & Forecast</h2>
        <p className="text-muted">
          Track your historical electricity consumption and predict
          your monthly energy usage and bill.
        </p>

        <span className="badge bg-primary">
          Forecast for {forecast.month}
        </span>
      </div>

      {/* Summary Cards */}
      <div className="row g-3">
        {summaryCards.map((card) => (
          <div className="col-12 col-md-6 col-xl-3" key={card.title}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <p className="text-muted mb-2">{card.title}</p>
                <h4 className="fw-bold mb-0">
                  {card.value} {card.unit}
                </h4>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Forecast Progress */}
      <div className="card border-0 shadow-sm mt-4">
        <div className="card-body">
          <h5 className="fw-bold">Monthly Forecast Progress</h5>

          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">
              {forecast.elapsed_days} days elapsed
            </span>
            <span className="text-muted">
              {forecast.remaining_days} days remaining
            </span>
          </div>

          <div
            className="progress"
            style={{ height: '12px' }}
            role="progressbar"
            aria-valuenow={forecast.elapsed_days}
            aria-valuemin="0"
            aria-valuemax={forecast.days_in_month || 30}
          >
            <div
              className="progress-bar bg-success"
              style={{
                width: `${
                  (forecast.elapsed_days /
                    (forecast.days_in_month || 30)) * 100
                }%`,
              }}
            />
          </div>

          <p className="text-muted small mt-2 mb-0">
            Forecast uses the latest {forecast.history_days} days
            of available historical meter readings.
          </p>
        </div>
      </div>

      {/* Actual vs Projected */}
      <div className="card border-0 shadow-sm mt-4">
        <div className="card-body">
          <h5 className="fw-bold mb-4">
            Actual vs Projected Monthly Consumption
          </h5>

          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="consumption"
                  name="Consumption (kWh)"
                  fill="#0d6efd"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Daily Consumption */}
      <div className="card border-0 shadow-sm mt-4">
        <div className="card-body">
          <h5 className="fw-bold mb-4">
            Daily Electricity Consumption
          </h5>

          {dailyData.length > 0 ? (
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="consumption"
                    name="Daily Usage (kWh)"
                    stroke="#198754"
                    strokeWidth={3}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted">
              No daily consumption history available.
            </p>
          )}
        </div>
      </div>

      {/* Monthly Consumption */}
      <div className="card border-0 shadow-sm mt-4">
        <div className="card-body">
          <h5 className="fw-bold mb-4">
            Historical Monthly Consumption
          </h5>

          {monthlyData.length > 0 ? (
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="consumption"
                    name="Monthly Usage (kWh)"
                    stroke="#0d6efd"
                    strokeWidth={3}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted">
              No monthly consumption history available.
            </p>
          )}
        </div>
      </div>

      {/* Property Forecasts */}
      <div className="card border-0 shadow-sm mt-4">
        <div className="card-body">
          <h5 className="fw-bold mb-3">Property-wise Forecast</h5>

          {properties.length > 0 ? (
            properties.map((property) => (
              <div
                className="border rounded p-3 mb-3"
                key={property.property_id}
              >
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <h6 className="fw-bold mb-0">
                    {property.property_name}
                  </h6>

                  <span
                    className={`badge ${
                      property.forecast_available
                        ? 'bg-success'
                        : 'bg-warning text-dark'
                    }`}
                  >
                    {property.forecast_available
                      ? 'Forecast Available'
                      : 'Insufficient Data'}
                  </span>
                </div>

                <p className="text-muted small mt-2">
                  {property.message}
                </p>

                <div className="row g-3">
                  <div className="col-6 col-md-3">
                    <small className="text-muted">Recent Usage</small>
                    <h6>{formatNumber(property.recent_consumption)} kWh</h6>
                  </div>

                  <div className="col-6 col-md-3">
                    <small className="text-muted">Daily Average</small>
                    <h6>{formatNumber(property.average_daily_consumption)} kWh</h6>
                  </div>

                  <div className="col-6 col-md-3">
                    <small className="text-muted">Actual Usage</small>
                    <h6>{formatNumber(property.actual_month_consumption)} kWh</h6>
                  </div>

                  <div className="col-6 col-md-3">
                    <small className="text-muted">Projected Usage</small>
                    <h6>
                      {property.projected_month_consumption === null
                        ? 'Not available'
                        : `${formatNumber(property.projected_month_consumption)} kWh`}
                    </h6>
                  </div>
                </div>

                {property.bill_estimate && (
                  <div className="alert alert-light border mt-3 mb-0">
                    <strong>Predicted Bill: </strong>

                    {property.bill_estimate.total_amount !== undefined
                      ? formatCurrency(property.bill_estimate.total_amount)
                      : property.bill_estimate.error || 'Unavailable'}

                    {property.bill_estimate.tariff_name && (
                      <div className="small text-muted mt-1">
                        Tariff: {property.bill_estimate.tariff_name}
                      </div>
                    )}
                  </div>
                )}

                {!property.tariff_available && (
                  <div className="alert alert-warning mt-3 mb-0">
                    No active electricity tariff is configured for this property.
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-muted">
              No property forecast information available.
            </p>
          )}
        </div>
      </div>

      {/* Forecast Information */}
      <div className="card border-0 shadow-sm mt-4">
        <div className="card-body">
          <h5 className="fw-bold">Forecast Information</h5>

          <p className="text-muted mb-1">
            Forecast date: {forecast.forecast_date}
          </p>

          <p className="text-muted mb-1">
            Properties with forecasts: {forecast.properties_with_forecasts}
          </p>

          <p className="text-muted mb-1">
            Properties without forecasts: {forecast.properties_without_forecasts}
          </p>

          <p className="text-muted mb-0">
            Predictions are estimates based on recent electricity
            consumption and configured tariff rates. Actual usage
            and bills may differ.
          </p>
        </div>
      </div>

    </div>
  )
}

export default Forecast
