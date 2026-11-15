import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import PasswordInput from '../components/PasswordInput.jsx'

function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    setForm({ ...form, [name]: value })
  }

  function handleSubmit(event) {
    event.preventDefault()
    const foundErrors = {}

    if (form.username.trim() === '') {
      foundErrors.username = 'Please enter your username.'
    }
    if (form.password === '') {
      foundErrors.password = 'Please enter your password.'
    }

    setErrors(foundErrors)

    if (Object.keys(foundErrors).length === 0) {
      setMessage(
        'Form is valid. The backend is not connected yet, so no login happened. This will work after Phase 9.'
      )
    } else {
      setMessage('')
    }
  }

  return (
    <AuthLayout
      icon="bi-box-arrow-in-right"
      title="Welcome back"
      subtitle="Login to your PowerSaver account"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="username" className="form-label">Username</label>
          <input
            type="text"
            className={`form-control ${errors.username ? 'is-invalid' : ''}`}
            id="username"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Your username"
            autoComplete="username"
          />
          {errors.username && <div className="invalid-feedback">{errors.username}</div>}
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="form-label">Password</label>
          <PasswordInput
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="Your password"
          />
        </div>

        {message && <div className="alert alert-info">{message}</div>}

        <button type="submit" className="btn btn-ps w-100 btn-lg">
          Login
        </button>
      </form>

      <p className="text-center mt-3 mb-0">
        New to PowerSaver? <Link to="/register">Create an account</Link>
      </p>
    </AuthLayout>
  )
}

export default Login