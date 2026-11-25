import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import PasswordInput from '../components/PasswordInput.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getErrorMessage, getFieldErrors } from '../services/api.js'

const emptyForm = {
  fullName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
}

const serverToForm = {
  full_name: 'fullName',
  confirm_password: 'confirmPassword',
}

function validate(form) {
  const errors = {}

  if (form.fullName.trim().length < 2) {
    errors.fullName = 'Please enter your full name.'
  }
  if (!/^[A-Za-z0-9_]{3,20}$/.test(form.username)) {
    errors.username = 'Username must be 3 to 20 letters, numbers or underscores.'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Please enter a valid email address.'
  }
  if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  } else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
    errors.password = 'Password must contain both letters and numbers.'
  }
  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Passwords do not match.'
  }
  return errors
}

function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [serverMessage, setServerMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm({ ...form, [name]: value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setServerMessage('')

    const foundErrors = validate(form)
    setErrors(foundErrors)
    if (Object.keys(foundErrors).length > 0) return

    setSubmitting(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch (error) {
      const fieldErrors = {}
      for (const [field, message] of Object.entries(getFieldErrors(error))) {
        fieldErrors[serverToForm[field] || field] = message
      }
      setErrors(fieldErrors)
      setServerMessage(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      icon="bi-person-plus-fill"
      title="Create your account"
      subtitle="Start tracking your electricity usage"
      mode="register"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="fullName" className="form-label">Full name</label>
          <input
            type="text"
            className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
            id="fullName"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Your full name"
          />
          {errors.fullName && <div className="invalid-feedback">{errors.fullName}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="username" className="form-label">Username</label>
          <input
            type="text"
            className={`form-control ${errors.username ? 'is-invalid' : ''}`}
            id="username"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Choose a username"
            autoComplete="username"
          />
          {errors.username && <div className="invalid-feedback">{errors.username}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="email"
            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
          />
          {errors.email && <div className="invalid-feedback">{errors.email}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <PasswordInput
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="At least 8 characters"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="confirmPassword" className="form-label">Confirm password</label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            placeholder="Re-enter your password"
          />
        </div>

        {serverMessage && <div className="alert alert-danger">{serverMessage}</div>}

        <button type="submit" className="btn btn-ps w-100 btn-lg" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center mt-3 mb-0">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </AuthLayout>
  )
}

export default Register