import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// Before every request, attach the saved token (if there is one)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  return config
})

// Turn Django's error replies into one readable message
export function getErrorMessage(error) {
  if (!error.response) {
    return 'Cannot reach the server. Is the backend running?'
  }
  const data = error.response.data
  if (typeof data === 'string') return 'Something went wrong. Please try again.'
  if (data.detail) return data.detail
  if (data.non_field_errors) return data.non_field_errors.join(' ')
  return 'Please correct the highlighted fields.'
}

// Pull field-by-field errors out of Django's reply, e.g. { username: 'taken' }
export function getFieldErrors(error) {
  const data = error.response?.data
  if (!data || typeof data !== 'object') return {}
  const result = {}
  for (const [field, messages] of Object.entries(data)) {
    if (field === 'detail' || field === 'non_field_errors') continue
    result[field] = Array.isArray(messages) ? messages.join(' ') : String(messages)
  }
  return result
}

export default api