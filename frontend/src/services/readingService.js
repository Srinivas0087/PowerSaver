import api from './api.js'

export async function listReadings(meterId) {
  const params = meterId ? { meter: meterId } : {}
  const response = await api.get('/readings/', { params })
  return response.data
}

export async function createReading(data) {
  const response = await api.post('/readings/', data)
  return response.data
}