import api from './api.js'

// Get electricity consumption forecast
export async function getConsumptionForecast() {
  const response = await api.get('/analytics/forecast/')
  return response.data
}

// Get historical electricity analytics
export async function getForecastAnalytics() {
  const response = await api.get('/analytics/')
  return response.data
}