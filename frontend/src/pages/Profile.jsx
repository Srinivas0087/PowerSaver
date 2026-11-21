
import { useEffect, useState } from 'react'
import { fetchProfile } from '../services/authService.js'
import api from '../services/api.js'

function Profile() {
  const [profile, setProfile] = useState({
    full_name: '',
    username: '',
    email: '',
    phone: '',
    date_joined: '',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      setLoading(true)
      setError('')

      const data = await fetchProfile()
      setProfile({
        full_name: data.full_name || '',
        username: data.username || '',
        email: data.email || '',
        phone: data.phone || '',
        date_joined: data.date_joined || '',
      })
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Unable to load profile. Please log in again.'
      )
    } finally {
      setLoading(false)
    }
  }

  function handleChange(event) {
    const { name, value } = event.target

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }))

    setSuccess('')
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const response = await api.patch('/auth/profile/', {
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
      })

      const data = response.data

      setProfile((previous) => ({
        ...previous,
        ...data,
      }))

      setSuccess('Profile updated successfully!')
    } catch (err) {
      const errors = err.response?.data
      const message =
        errors?.email?.[0] ||
        errors?.full_name?.[0] ||
        errors?.phone?.[0] ||
        errors?.detail ||
        'Unable to update profile. Please try again.'

      setError(message)
    } finally {
      setSaving(false)
    }
  }

  function formatDate(value) {
    if (!value) return 'Not available'

    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-3">Loading your profile...</p>
      </div>
    )
  }

  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-xl-9">

          <div className="mb-4">
            <h2 className="fw-bold mb-1">User Profile</h2>
            <p className="text-muted mb-0">
              View and manage your PowerSaver account details.
            </p>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="alert">
              {success}
            </div>
          )}

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                  style={{
                    width: '75px',
                    height: '75px',
                    fontSize: '28px',
                  }}
                >
                  {profile.full_name
                    ? profile.full_name.charAt(0).toUpperCase()
                    : 'U'}
                </div>

                <div>
                  <h4 className="fw-bold mb-1">
                    {profile.full_name || 'User'}
                  </h4>
                  <p className="text-muted mb-1">
                    @{profile.username}
                  </p>
                  <span className="badge bg-success">
                    Active Account
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 pt-4 px-4">
              <h5 className="fw-bold mb-1">Personal Information</h5>
              <p className="text-muted small mb-0">
                Update your account information below.
              </p>
            </div>

            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>

                <div className="row g-3">

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      className="form-control"
                      value={profile.full_name}
                      onChange={handleChange}
                      minLength={2}
                      maxLength={150}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Username
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={profile.username}
                      disabled
                    />
                    <small className="text-muted">
                      Username cannot be changed.
                    </small>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={profile.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-control"
                      value={profile.phone}
                      onChange={handleChange}
                      maxLength={20}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Account Created
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={formatDate(profile.date_joined)}
                      disabled
                    />
                  </div>

                </div>

                <hr className="my-4" />

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={loadProfile}
                    disabled={saving}
                  >
                    Reset
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary px-4"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>

              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Profile
