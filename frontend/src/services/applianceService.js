import api from './api.js'

export async function listAppliances() {
  const response = await api.get('/appliances/')
  return response.data
}

export async function createAppliance(data) {
  const response = await api.post('/appliances/', data)
  return response.data
}

export async function updateAppliance(id, data) {
  const response = await api.patch(`/appliances/${id}/`, data)
  return response.data
}

export async function deleteAppliance(id) {
  await api.delete(`/appliances/${id}/`)
}

export async function applianceSummary() {
  const response = await api.get('/appliances/summary/')
  return response.data
}