import { useEffect, useState } from 'react'
import { getErrorMessage, getFieldErrors } from '../services/api.js'
import { listProperties } from '../services/propertyService.js'
import {
  applianceSummary,
  createAppliance,
  deleteAppliance,
  listAppliances,
  updateAppliance,
} from '../services/applianceService.js'

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

function fmt(value) {
  return Number(value).toFixed(2)
}

function Appliances() {
  const [properties, setProperties] = useState([])
  const [appliances, setAppliances] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const [props, items, sum] = await Promise.all([
        listProperties(),
        listAppliances(),
        applianceSummary(),
      ])
      setProperties(props)
      setAppliances(items)
      setSummary(sum)
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm({ ...emptyForm, property: form.property })
    setErrors({})
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = {}
    if (!form.property) found.property = 'Choose a property.'
    if (form.name.trim() === '') found.name = 'Enter an appliance name.'
    if (!(Number(form.power_watts) >= 1)) found.power_watts = 'Power must be at least 1 watt.'
    if (!(Number(form.quantity) >= 1)) found.quantity = 'Quantity must be at least 1.'
    if (form.daily_hours === '' || Number(form.daily_hours) < 0 || Number(form.daily_hours) > 24) {
      found.daily_hours = 'Hours per day must be between 0 and 24.'
    }
    setErrors(found)
    if (Object.keys(found).length > 0) return

    const payload = { ...form, name: form.name.trim() }

    setSaving(true)
    try {
      if (editingId) {
        await updateAppliance(editingId, payload)
      } else {
        await createAppliance(payload)
      }
      setEditingId(null)
      setForm({ ...emptyForm, property: form.property })
      await load()
    } catch (error) {
      const fieldErrors = getFieldErrors(error)
      setErrors(fieldErrors)
      if (Object.keys(fieldErrors).length === 0) setPageError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.name}"?`)) return
    try {
      await deleteAppliance(item.id)
      await load()
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    )
  }

  return (
    <>
      <h2 className="fw-bold mb-3">Appliances</h2>
      {pageError && <div className="alert alert-danger">{pageError}</div>}

      <div className="alert alert-warning">
        <i className="bi bi-info-circle-fill me-2"></i>
        All figures on this page are <strong>estimates</strong> calculated from power rating,
        quantity and daily hours (30-day month). They are <strong>not</strong> your meter readings.
      </div>

      {properties.length === 0 ? (
        <div className="alert alert-info">
          You need a property first. Go to <strong>Properties</strong> and add one.
        </div>
      ) : (
        <>
          {summary && appliances.length > 0 && (
            <div className="row g-3 mb-4">
              <div className="col-12 col-md-4">
                <div className="card ps-card h-100">
                  <div className="card-body">
                    <div className="text-muted small">Estimated per day</div>
                    <div className="fs-4 fw-bold">{fmt(summary.estimated_daily_kwh)} kWh</div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="card ps-card h-100">
                  <div className="card-body">
                    <div className="text-muted small">Estimated per week</div>
                    <div className="fs-4 fw-bold">{fmt(summary.estimated_weekly_kwh)} kWh</div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="card ps-card h-100">
                  <div className="card-body">
                    <div className="text-muted small">Estimated per month</div>
                    <div className="fs-4 fw-bold">{fmt(summary.estimated_monthly_kwh)} kWh</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card ps-card mb-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3">{editingId ? 'Edit appliance' : 'Add an appliance'}</h5>
              <form onSubmit={handleSubmit} noValidate>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label htmlFor="property" className="form-label">Property</label>
                    <select
                      id="property"
                      name="property"
                      className={`form-select ${errors.property ? 'is-invalid' : ''}`}
                      value={form.property}
                      onChange={handleChange}
                    >
                      <option value="">Choose...</option>
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    {errors.property && <div className="invalid-feedback">{errors.property}</div>}
                  </div>

                  <div className="col-md-4">
                    <label htmlFor="name" className="form-label">Name</label>
                    <input
                      id="name"
                      name="name"
                      className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Air conditioner"
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                  </div>

                  <div className="col-md-4">
                    <label htmlFor="category" className="form-label">Category</label>
                    <select
                      id="category"
                      name="category"
                      className={`form-select ${errors.category ? 'is-invalid' : ''}`}
                      value={form.category}
                      onChange={handleChange}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    {errors.category && <div className="invalid-feedback">{errors.category}</div>}
                  </div>

                  <div className="col-md-4">
                    <label htmlFor="power_watts" className="form-label">Power (watts)</label>
                    <input
                      id="power_watts"
                      name="power_watts"
                      type="number"
                      min="1"
                      className={`form-control ${errors.power_watts ? 'is-invalid' : ''}`}
                      value={form.power_watts}
                      onChange={handleChange}
                      placeholder="e.g. 1500"
                    />
                    {errors.power_watts && <div className="invalid-feedback">{errors.power_watts}</div>}
                  </div>

                  <div className="col-md-4">
                    <label htmlFor="quantity" className="form-label">Quantity</label>
                    <input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="1"
                      className={`form-control ${errors.quantity ? 'is-invalid' : ''}`}
                      value={form.quantity}
                      onChange={handleChange}
                    />
                    {errors.quantity && <div className="invalid-feedback">{errors.quantity}</div>}
                  </div>

                  <div className="col-md-4">
                    <label htmlFor="daily_hours" className="form-label">Hours used per day</label>
                    <input
                      id="daily_hours"
                      name="daily_hours"
                      type="number"
                      min="0"
                      max="24"
                      step="0.25"
                      className={`form-control ${errors.daily_hours ? 'is-invalid' : ''}`}
                      value={form.daily_hours}
                      onChange={handleChange}
                      placeholder="e.g. 8"
                    />
                    {errors.daily_hours && <div className="invalid-feedback">{errors.daily_hours}</div>}
                  </div>
                </div>

                <div className="mt-3 d-flex gap-2">
                  <button type="submit" className="btn btn-ps" disabled={saving}>
                    {saving ? 'Saving...' : editingId ? 'Update' : 'Add appliance'}
                  </button>
                  {editingId && (
                    <button type="button" className="btn btn-outline-secondary" onClick={cancelEdit}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          <div className="card ps-card mb-4">
            <div className="card-body">
              <h5 className="fw-bold">Your appliances <span className="badge text-bg-warning">Estimated</span></h5>
              {appliances.length === 0 ? (
                <p className="text-muted mb-0">No appliances yet. Add one above.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th className="text-end">Watts x Qty</th>
                        <th className="text-end">Hours/day</th>
                        <th className="text-end">Est. kWh/day</th>
                        <th className="text-end">Est. kWh/week</th>
                        <th className="text-end">Est. kWh/month</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {appliances.map((item) => (
                        <tr key={item.id}>
                          <td>
                            {item.name}
                            <div className="small text-muted">{item.property_name}</div>
                          </td>
                          <td>{item.category_display}</td>
                          <td className="text-end">{item.power_watts} x {item.quantity}</td>
                          <td className="text-end">{item.daily_hours}</td>
                          <td className="text-end">{fmt(item.estimated_daily_kwh)}</td>
                          <td className="text-end">{fmt(item.estimated_weekly_kwh)}</td>
                          <td className="text-end fw-bold">{fmt(item.estimated_monthly_kwh)}</td>
                          <td className="text-end text-nowrap">
                            <button
                              className="btn btn-sm btn-outline-secondary me-1"
                              onClick={() => startEdit(item)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(item)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {summary && summary.monthly_by_category.length > 0 && (
            <div className="card ps-card">
              <div className="card-body">
                <h5 className="fw-bold">Estimated monthly use by category</h5>
                <ul className="list-group list-group-flush">
                  {summary.monthly_by_category.map((row) => (
                    <li
                      key={row.category}
                      className="list-group-item d-flex justify-content-between"
                    >
                      <span>{row.category}</span>
                      <strong>{fmt(row.estimated_monthly_kwh)} kWh</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}

export default Appliances