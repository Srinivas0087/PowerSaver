import api from './api.js'

export async function listMeters(propertyId) {
  const params = propertyId ? { property: propertyId } : {}
  const response = await api.get('/meters/', { params })
  return response.data
}

export async function createMeter(data) {
  const response = await api.post('/meters/', data)
  return response.data
}