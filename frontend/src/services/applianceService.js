
import api from './api.js'

// Get all appliances
export async function listAppliances(propertyId = '') {
  const params = propertyId ? { property: propertyId } : {}
  const response = await api.get('/appliances/', { params })
  return response.data
}

// Get one appliance
export async function getAppliance(id) {
  const response = await api.get(`/appliances/${id}/`)
  return response.data
}

// Add appliance
export async function createAppliance(data) {
  const response = await api.post('/appliances/', data)
  return response.data
}

// Update appliance
export async function updateAppliance(id, data) {
  const response = await api.patch(`/appliances/${id}/`, data)
  return response.data
}

// Delete appliance
export async function deleteAppliance(id) {
  const response = await api.delete(`/appliances/${id}/`)
  return response.data
}

// Get appliance consumption summary
export async function getApplianceSummary(propertyId = '') {
  const params = propertyId ? { property: propertyId } : {}
  const response = await api.get('/appliances/summary/', { params })
  return response.data
}
