import api from './api.js'

export async function registerUser(form) {
  const response = await api.post('/auth/register/', {
    full_name: form.fullName,
    username: form.username,
    email: form.email,
    password: form.password,
    confirm_password: form.confirmPassword,
  })
  return response.data
}

export async function loginUser(username, password) {
  const response = await api.post('/auth/login/', { username, password })
  return response.data
}

export async function logoutUser() {
  await api.post('/auth/logout/')
}

export async function fetchProfile() {
  const response = await api.get('/auth/profile/')
  return response.data
}