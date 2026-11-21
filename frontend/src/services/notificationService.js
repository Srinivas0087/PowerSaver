
import api from './api.js'

export async function listAlerts(params = {}) {
  const response = await api.get('/alerts/', { params })
  return response.data
}

export async function markAlertRead(id) {
  const response = await api.post(`/alerts/${id}/mark_read/`)
  return response.data
}

export async function listRecommendations(params = {}) {
  const response = await api.get('/recommendations/', { params })
  return response.data
}

export async function generateNotifications() {
  const response = await api.post('/alerts/generate/')
  return response.data
}
