
import { useEffect, useState } from 'react'

import {
  listAppliances,
  createAppliance,
  updateAppliance,
  deleteAppliance,
  getApplianceSummary,
} from '../services/applianceService.js'

import { listProperties } from '../services/propertyService.js'
import { getErrorMessage, getFieldErrors } from '../services/api.js'

const CATEGORIES = [
  { value: 'LIGHTING', label: 'Lighting' },
  { value: 'COOLING', label: 'Cooling (AC, fans, coolers)' },
  { value: 'HEATING', label: 'Heating' },
  { value: 'KITCHEN', label: 'Kitchen' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'OFFICE', label: 'Office / IT' },
  { value: 'LAUNDRY', label: 'Laundry' },
  { value: 'OTHER', label: 'Other' },
]

const emptyForm = {
  property: '',
  name: '',
  category: 'OTHER',
  power_watts: '',
  quantity: 1,
  daily_hours: '',
}

function formatKwh(value) {
  return `${Number(value || 0).toFixed(3)} kWh`
}

function Appliances() {
  const [appliances, setAppliances] = useState([])
  const [properties, setProperties] = useState([])
  const [summary, setSummary] = useState(null)

  const [selectedProperty, setSelectedProperty] = useState('')
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [success, setSuccess] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  async function loadProperties() {
    const data = await listProperties()
    setProperties(Array.isArray(data) ? data : data.results || [])
  }

  async function loadAppliances(propertyId = selectedProperty) {
    try {
      setLoading(true)
      setPageError('')

      const [applianceData, summaryData] = await Promise.all([
        listAppliances(propertyId),
        getApplianceSummary(propertyId),
      ])

      setAppliances(
        Array.isArray(applianceData)
          ? applianceData
          : applianceData.results || []
      )

      setSummary(summaryData)
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function initialize() {
      try {
        await loadProperties()
      } catch (error) {
        setPageError(getErrorMessage(error))
        setLoading(false)
      }
    }

    initialize()
  }, [])

  useEffect(() => {
    if (properties.length > 0 || selectedProperty) {
      loadAppliances(selectedProperty)
    }
  }, [selectedProperty, properties.length])

  function handleChange(event) {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))

    setErrors((previous) => ({
      ...previous,
      [name]: '',
    }))
  }

  function startAdd() {
    setEditingId(null)
    setForm({
      ...emptyForm,
      property: selectedProperty || (properties[0]?.id ?? ''),
    })
    setErrors({})
    setSuccess('')
    setPageError('')
    setShowForm(true)
  }

  function startEdit(item) {
    setEditingId(item.id)
    setForm({
      property: item.property,
      name: item.name,
      category: item.category,
      power_watts: item.power_watts,
      quantity: item.quantity,
      daily_hours: item.daily_hours,
    })
    setErrors({})
    setSuccess('')
    setPageError('')
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    setErrors({})
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const payload = {
      property: Number(form.property),
      name: form.name.trim(),
      category: form.category,
      power_watts: Number(form.power_watts),
      quantity: Number(form.quantity),
      daily_hours: Number(form.daily_hours),
    }

    if (!payload.property) {
      setErrors({ property: 'Please select a property.' })
      return
    }

    if (!payload.name) {
      setErrors({ name: 'Please enter an appliance name.' })
      return
    }

    if (payload.power_watts < 1) {
      setErrors({ power_watts: 'Power must be at least 1 watt.' })
      return
    }

    if (payload.quantity < 1) {
      setErrors({ quantity: 'Quantity must be at least 1.' })
      return
    }

    if (
      !Number.isFinite(payload.daily_hours) ||
      payload.daily_hours < 0 ||
      payload.daily_hours > 24
    ) {
      setErrors({ daily_hours: 'Daily hours must be between 0 and 24.' })
      return
    }

    setSaving(true)
    setErrors({})
    setPageError('')
    setSuccess('')

    try {
      if (editingId) {
        await updateAppliance(editingId, payload)
        setSuccess('Appliance updated successfully.')
      } else {
        await createAppliance(payload)
        setSuccess('Appliance added successfully.')
      }

      cancelForm()
      await loadAppliances(selectedProperty)
    } catch (error) {
      const fieldErrors = getFieldErrors(error)
      setErrors(fieldErrors)

      if (Object.keys(fieldErrors).length === 0) {
        setPageError(getErrorMessage(error))
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    const sure = window.confirm(
      `Are you sure you want to delete "${item.name}"?`
    )

    if (!sure) return

    try {
      setPageError('')
      setSuccess('')
      await deleteAppliance(item.id)
      setSuccess(`${item.name} deleted successfully.`)
      await loadAppliances(selectedProperty)
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
  }

  const totalAppliances = summary?.appliance_count ?? appliances.length
  const dailyUsage = summary?.estimated_daily_kwh ?? 0
  const weeklyUsage = summary?.estimated_weekly_kwh ?? 0
  const monthlyUsage = summary?.estimated_monthly_kwh ?? 0

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Appliance Management</h2>
          <p className="text-muted mb-0">
            Manage appliances and estimate their electricity consumption.
          </p>
        </div>

        {!showForm && (
          <button
            className="btn btn-ps"
            onClick={startAdd}
            disabled={properties.length === 0}
          >
            <i className="bi bi-plus-lg me-1"></i>
            Add Appliance
          </button>
        )}
      </div>

      {pageError && (
        <div className="alert alert-danger" role="alert">
          {pageError}
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="alert">
          {success}
        </div>
      )}

      {properties.length > 0 && (
        <div className="card ps-card mb-4">
          <div className="card-body">
            <label htmlFor="propertyFilter" className="form-label fw-semibold">
              Filter by property
            </label>

            <select
              id="propertyFilter"
              className="form-select"
              value={selectedProperty}
              onChange={(event) => setSelectedProperty(event.target.value)}
            >
              <option value="">All my properties</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {summary && (
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card ps-card h-100">
              <div className="card-body">
                <div className="text-muted small">Total Appliances</div>
                <h3 className="fw-bold mb-0">{totalAppliances}</h3>
                <div className="small text-muted">Registered appliances</div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card ps-card h-100">
              <div className="card-body">
                <div className="text-muted small">Daily Consumption</div>
                <h3 className="fw-bold mb-0">{formatKwh(dailyUsage)}</h3>
                <div className="small text-muted">Estimated per day</div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card ps-card h-100">
              <div className="card-body">
                <div className="text-muted small">Weekly Consumption</div>
                <h3 className="fw-bold mb-0">{formatKwh(weeklyUsage)}</h3>
                <div className="small text-muted">Estimated per week</div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card ps-card h-100">
              <div className="card-body">
                <div className="text-muted small">Monthly Consumption</div>
                <h3 className="fw-bold mb-0">{formatKwh(monthlyUsage)}</h3>
                <div className="small text-muted">Estimated for 30 days</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="card ps-card mb-4">
          <div className="card-body">
            <h5 className="fw-bold mb-3">
              {editingId ? 'Edit Appliance' : 'Add New Appliance'}
            </h5>

            <form onSubmit={handleSubmit} noValidate>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label" htmlFor="applianceProperty">
                    Property
                  </label>
                  <select
                    id="applianceProperty"
                    name="property"
                    className={`form-select ${errors.property ? 'is-invalid' : ''}`}
                    value={form.property}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select property</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                  {errors.property && (
                    <div className="invalid-feedback">{errors.property}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="applianceName">
                    Appliance Name
                  </label>
                  <input
                    id="applianceName"
                    name="name"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Air Conditioner"
                    maxLength={100}
                    required
                  />
                  {errors.name && (
                    <div className="invalid-feedback">{errors.name}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="applianceCategory">
                    Category
                  </label>
                  <select
                    id="applianceCategory"
                    name="category"
                    className="form-select"
                    value={form.category}
                    onChange={handleChange}
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="powerWatts">
                    Power Rating (Watts)
                  </label>
                  <input
                    id="powerWatts"
                    name="power_watts"
                    type="number"
                    min="1"
                    step="1"
                    className={`form-control ${errors.power_watts ? 'is-invalid' : ''}`}
                    value={form.power_watts}
                    onChange={handleChange}
                    placeholder="e.g. 1500"
                    required
                  />
                  {errors.power_watts && (
                    <div className="invalid-feedback">{errors.power_watts}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="quantity">
                    Quantity
                  </label>
                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    step="1"
                    className={`form-control ${errors.quantity ? 'is-invalid' : ''}`}
                    value={form.quantity}
                    onChange={handleChange}
                    required
                  />
                  {errors.quantity && (
                    <div className="invalid-feedback">{errors.quantity}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="dailyHours">
                    Average Usage Hours Per Day
                  </label>
                  <input
                    id="dailyHours"
                    name="daily_hours"
                    type="number"
                    min="0"
                    max="24"
                    step="0.25"
                    className={`form-control ${errors.daily_hours ? 'is-invalid' : ''}`}
                    value={form.daily_hours}
                    onChange={handleChange}
                    placeholder="e.g. 5"
                    required
                  />
                  {errors.daily_hours && (
                    <div className="invalid-feedback">{errors.daily_hours}</div>
                  )}
                  <div className="form-text">Enter a value between 0 and 24.</div>
                </div>
              </div>

              <div className="mt-4 d-flex gap-2">
                <button type="submit" className="btn btn-ps" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update Appliance' : 'Save Appliance'}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={cancelForm}
                  disabled={saving}
                >
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
          <p className="text-muted mt-2">Loading appliances...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="card ps-card">
          <div className="card-body text-center py-5">
            <h5 className="fw-bold">No properties found</h5>
            <p className="text-muted mb-0">
              Add a property before registering appliances.
            </p>
          </div>
        </div>
      ) : appliances.length === 0 ? (
        <div className="card ps-card">
          <div className="card-body text-center py-5">
            <i className="bi bi-plug fs-1 text-muted"></i>
            <h5 className="fw-bold mt-3">No appliances found</h5>
            <p className="text-muted mb-3">
              Add your first appliance to calculate estimated electricity usage.
            </p>
            {!showForm && (
              <button className="btn btn-ps" onClick={startAdd}>
                <i className="bi bi-plus-lg me-1"></i>
                Add Appliance
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0">Your Appliances</h5>
            <span className="text-muted small">
              {appliances.length} appliance{appliances.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="row g-3">
            {appliances.map((item) => (
              <div className="col-12 col-md-6 col-xl-4" key={item.id}>
                <div className="card ps-card h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div>
                        <h5 className="fw-bold mb-1">{item.name}</h5>
                        <span className="badge text-bg-success">
                          {item.category_display || item.category}
                        </span>
                      </div>
                      <i className="bi bi-plug fs-3 text-success"></i>
                    </div>

                    <div className="small text-muted mt-3">
                      Property: {item.property_name}
                    </div>

                    <hr />

                    <div className="row g-2 small">
                      <div className="col-6">
                        <div className="text-muted">Power</div>
                        <strong>{item.power_watts} W</strong>
                      </div>

                      <div className="col-6">
                        <div className="text-muted">Quantity</div>
                        <strong>{item.quantity}</strong>
                      </div>

                      <div className="col-6">
                        <div className="text-muted">Hours per day</div>
                        <strong>{item.daily_hours}</strong>
                      </div>

                      <div className="col-6">
                        <div className="text-muted">Daily usage</div>
                        <strong>{formatKwh(item.estimated_daily_kwh)}</strong>
                      </div>
                    </div>

                    <div className="rounded bg-light p-3 mt-3">
                      <div className="text-muted small">Estimated monthly usage</div>
                      <h4 className="fw-bold text-success mb-0">
                        {formatKwh(item.estimated_monthly_kwh)}
                      </h4>
                    </div>
                  </div>

                  <div className="card-footer bg-white border-0 d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => startEdit(item)}
                    >
                      <i className="bi bi-pencil me-1"></i>
                      Edit
                    </button>

                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(item)}
                    >
                      <i className="bi bi-trash me-1"></i>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="alert alert-info mt-4 small">
        <strong>Note:</strong> Appliance consumption figures are estimates based
        on power rating, quantity, and daily usage hours. A 30-day month is
        assumed. These are not actual electricity meter readings.
      </div>

      {summary?.monthly_by_category?.length > 0 && (
        <div className="card ps-card mt-4">
          <div className="card-body">
            <h5 className="fw-bold mb-3">Monthly Usage by Category</h5>

            {summary.monthly_by_category.map((item) => (
              <div className="mb-3" key={item.category}>
                <div className="d-flex justify-content-between mb-1">
                  <span>{item.category}</span>
                  <strong>{formatKwh(item.estimated_monthly_kwh)}</strong>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-success"
                    role="progressbar"
                    style={{
                      width: `${
                        Number(monthlyUsage) > 0
                          ? Math.min(
                              100,
                              (Number(item.estimated_monthly_kwh) /
                                Number(monthlyUsage)) *
                                100
                            )
                          : 0
                      }%`,
                    }}
                    aria-valuenow={Number(item.estimated_monthly_kwh)}
                    aria-valuemin="0"
                    aria-valuemax={Number(monthlyUsage)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Appliances
