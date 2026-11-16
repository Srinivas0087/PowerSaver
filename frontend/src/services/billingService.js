import api from './api.js'

export async function listTariffs() {
  const response = await api.get('/tariffs/')
  return response.data
}

export async function createTariff(data) {
  const response = await api.post('/tariffs/', data)
  return response.data
}

export async function deleteTariff(id) {
  await api.delete(`/tariffs/${id}/`)
}

export async function previewBill(tariff, units) {
  const response = await api.post('/bills/preview/', { tariff, units })
  return response.data
}

export async function calculateBill(data) {
  const response = await api.post('/bills/calculate/', data)
  return response.data
}

export async function listBills() {
  const response = await api.get('/bills/')
  return response.data
}