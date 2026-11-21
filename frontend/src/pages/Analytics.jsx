
import { useEffect, useState } from 'react'
import api from '../services/api.js'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

function Analytics() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await api.get('/analytics/')
        setAnalytics(response.data)
      } catch (err) {
        setError(
          err.response?.data?.detail ||
          'Unable to load analytics. Please check the backend.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return <div className="container py-4">Loading analytics...</div>
  }

  if (error) {
    return (
      <div className="container py-4">
        <h2>Consumption Analytics</h2>
        <div className="alert alert-danger">{error}</div>
      </div>
    )
  }

  const data = analytics || {}

  const cards = [
    {
      title: 'Total Consumption',
      value: data.total_consumption ?? 0,
      unit: 'kWh',
    },
    {
      title: 'This Month',
      value: data.current_month_consumption ?? 0,
      unit: 'kWh',
    },
    {
      title: 'Previous Month',
      value: data.previous_month_consumption ?? 0,
      unit: 'kWh',
    },
    {
      title: 'Total Properties',
      value: data.total_properties ?? 0,
      unit: '',
    },
    {
      title: 'Active Meters',
      value: data.total_meters ?? 0,
      unit: '',
    },
  ]

  const dailyData = data.daily_consumption || []
  const monthlyData = data.monthly_consumption || []
  const propertyData = data.property_consumption || []

  const COLORS = ['#198754', '#0d6efd', '#ffc107', '#dc3545', '#6610f2']

  return (
    <div className="container py-4">

      {/* Page Heading */}
      <div className="mb-4">
        <h2 className="fw-bold">Consumption Analytics</h2>
        <p className="text-muted">
          Monitor and understand your electricity consumption.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="row g-3">
        {cards.map((card) => (
          <div className="col-12 col-md-6 col-xl-4" key={card.title}>
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <p className="text-muted mb-2">{card.title}</p>
                <h3 className="fw-bold mb-0">
                  {Number(card.value).toLocaleString('en-IN', {
                    maximumFractionDigits: 2,
                  })}
                  {card.unit ? ` ${card.unit}` : ''}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Daily Consumption Chart */}
      <div className="card shadow-sm border-0 mt-4">
        <div className="card-body">
          <h5 className="fw-bold mb-4">Daily Electricity Consumption</h5>

          {dailyData.length > 0 ? (
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
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
          ) : (
            <p className="text-muted">
              No daily consumption data available.
            </p>
          )}
        </div>
      </div>

      {/* Monthly Consumption Chart */}
      <div className="card shadow-sm border-0 mt-4">
        <div className="card-body">
          <h5 className="fw-bold mb-4">Monthly Consumption Trend</h5>

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
                    name="Consumption (kWh)"
                    stroke="#198754"
                    strokeWidth={3}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted">
              No monthly consumption data available.
            </p>
          )}
        </div>
      </div>

      {/* Property-wise Consumption Chart */}
      <div className="card shadow-sm border-0 mt-4">
        <div className="card-body">
          <h5 className="fw-bold mb-4">Property-wise Consumption</h5>

          {propertyData.length > 0 &&
          propertyData.some((item) => Number(item.consumption) > 0) ? (
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={propertyData}
                    dataKey="consumption"
                    nameKey="property"
                    cx="50%"
                    cy="50%"
                    outerRadius={105}
                    label
                  >
                    {propertyData.map((item, index) => (
                      <Cell
                        key={item.property}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted">
              Add more meter readings to display property-wise consumption.
            </p>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="card shadow-sm border-0 mt-4">
        <div className="card-body">
          <h5 className="fw-bold">Analytics Summary</h5>
          <p className="text-muted mb-0">
            Your analytics are calculated from your electricity meter readings.
            Monitor daily usage, monthly trends and property-wise consumption.
          </p>
        </div>
      </div>

    </div>
  )
}

export default Analytics
