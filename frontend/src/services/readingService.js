import api from './api.js'

export async function listMeters() {
  const response = await api.get('/meters/')
  return response.data
}

export async function createMeter(data) {
  const response = await api.post('/meters/', data)
  return response.data
}

export async function deleteMeter(id) {
  await api.delete(`/meters/${id}/`)
}

export async function listReadings(meterId) {
  const response = await api.get('/readings/', { params: { meter: meterId } })
  return response.data
}

export async function createReading(data) {
  const response = await api.post('/readings/', data)
  return response.data
}

export async function updateReading(id, data) {
  const response = await api.patch(`/readings/${id}/`, data)
  return response.data
}

export async function deleteReading(id) {
  await api.delete(`/readings/${id}/`)
}