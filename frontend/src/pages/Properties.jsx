import { useEffect, useState } from 'react'
import { getErrorMessage, getFieldErrors } from '../services/api.js'
import {
  createProperty,
  deleteProperty,
  listProperties,
  updateProperty,
} from '../services/propertyService.js'

const TYPES = [
  { value: 'RESIDENTIAL', label: 'Residential' },
  { value: 'HOTEL', label: 'Hotel' },
  { value: 'SMALL_BUSINESS', label: 'Small Business' },
  { value: 'COMMERCIAL', label: 'Commercial Facility' },
]

const emptyForm = {
  name: '',
  property_type: 'RESIDENTIAL',
  address: '',
  city: '',
  monthly_limit_kwh: '',
}

function Properties() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      setProperties(await listProperties())
      setPageError('')
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function handleChange(event) {
    const { name, value } = event.target
    setForm({ ...form, [name]: value })
  }

  function startAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setErrors({})
    setShowForm(true)
  }

  function startEdit(item) {
    setEditingId(item.id)
    setForm({
      name: item.name,
      property_type: item.property_type,
      address: item.address || '',
      city: item.city || '',
      monthly_limit_kwh: item.monthly_limit_kwh ?? '',
    })
    setErrors({})
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setErrors({})
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (form.name.trim() === '') {
      setErrors({ name: 'Please enter a property name.' })
      return
    }

    const payload = {
      name: form.name.trim(),
      property_type: form.property_type,
      address: form.address,
      city: form.city,
      monthly_limit_kwh: form.monthly_limit_kwh === '' ? null : form.monthly_limit_kwh,
    }

    setSaving(true)
    try {
      if (editingId) {
        await updateProperty(editingId, payload)
      } else {
        await createProperty(payload)
      }
      cancelForm()
      await load()
    } catch (error) {
      setErrors(getFieldErrors(error))
      if (Object.keys(getFieldErrors(error)).length === 0) {
        setPageError(getErrorMessage(error))
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    const sure = window.confirm(
      `Delete "${item.name}"? Its meters, readings, appliances and bills will be deleted too.`
    )
    if (!sure) return
    try {
      await deleteProperty(item.id)
      await load()
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-bold mb-0">Properties</h2>
        {!showForm && (
          <button className="btn btn-ps" onClick={startAdd}>
            <i className="bi bi-plus-lg me-1"></i>Add property
          </button>
        )}
      </div>

      {pageError && <div className="alert alert-danger">{pageError}</div>}

      {showForm && (
        <div className="card ps-card mb-4">
          <div className="card-body">
            <h5 className="fw-bold mb-3">{editingId ? 'Edit property' : 'Add a property'}</h5>
            <form onSubmit={handleSubmit} noValidate>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="name" className="form-label">Name</label>
                  <input
                    id="name"
                    name="name"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. My Home"
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                <div className="col-md-6">
                  <label htmlFor="property_type" className="form-label">Type</label>
                  <select
                    id="property_type"
                    name="property_type"
                    className={`form-select ${errors.property_type ? 'is-invalid' : ''}`}
                    value={form.property_type}
                    onChange={handleChange}
                  >
                    {TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  {errors.property_type && (
                    <div className="invalid-feedback">{errors.property_type}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label htmlFor="city" className="form-label">City (optional)</label>
                  <input
                    id="city"
                    name="city"
                    className="form-control"
                    value={form.city}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="monthly_limit_kwh" className="form-label">
                    Monthly limit in kWh (optional)
                  </label>
                  <input
                    id="monthly_limit_kwh"
                    name="monthly_limit_kwh"
                    type="number"
                    min="0"
                    step="0.01"
                    className={`form-control ${errors.monthly_limit_kwh ? 'is-invalid' : ''}`}
                    value={form.monthly_limit_kwh}
                    onChange={handleChange}
                    placeholder="Used for alerts"
                  />
                  {errors.monthly_limit_kwh && (
                    <div className="invalid-feedback">{errors.monthly_limit_kwh}</div>
                  )}
                </div>

                <div className="col-12">
                  <label htmlFor="address" className="form-label">Address (optional)</label>
                  <textarea
                    id="address"
                    name="address"
                    rows="2"
                    className="form-control"
                    value={form.address}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="mt-3 d-flex gap-2">
                <button type="submit" className="btn btn-ps" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={cancelForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
        </div>
      ) : properties.length === 0 ? (
        <div className="card ps-card">
          <div className="card-body text-center py-5 text-muted">
            You have no properties yet. Click "Add property" to create your first one.
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {properties.map((item) => (
            <div className="col-12 col-md-6 col-xl-4" key={item.id}>
              <div className="card ps-card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <h5 className="fw-bold mb-1">{item.name}</h5>
                    <span className="badge text-bg-success">{item.property_type_display}</span>
                  </div>
                  {item.city && <div className="text-muted small">{item.city}</div>}
                  {item.address && <div className="small mt-2">{item.address}</div>}
                  <div className="small mt-2">
                    Monthly limit:{' '}
                    {item.monthly_limit_kwh ? `${item.monthly_limit_kwh} kWh` : 'not set'}
                  </div>
                </div>
                <div className="card-footer bg-white border-0 d-flex gap-2">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => startEdit(item)}
                  >
                    <i className="bi bi-pencil me-1"></i>Edit
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDelete(item)}
                  >
                    <i className="bi bi-trash me-1"></i>Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default Properties