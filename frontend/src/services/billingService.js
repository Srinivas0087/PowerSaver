
import api from './api.js'

// Get electricity tariffs
export async function listTariffs() {
  const response = await api.get('/billing/tariffs/')
  return response.data
}

// Create tariff
export async function createTariff(data) {
  const response = await api.post('/billing/tariffs/', data)
  return response.data
}

// Update tariff
export async function updateTariff(id, data) {
  const response = await api.patch(`/billing/tariffs/${id}/`, data)
  return response.data
}

// Delete tariff
export async function deleteTariff(id) {
  await api.delete(`/billing/tariffs/${id}/`)
}

// Get bill estimates
export async function listBillEstimates(propertyId = '') {
  const response = await api.get('/billing/estimates/', {
    params: propertyId ? { property: propertyId } : {},
  })

  return response.data
}

// Generate bill estimate
export async function generateBillEstimate(data) {
  const response = await api.post('/billing/generate/', data)
  return response.data
}
