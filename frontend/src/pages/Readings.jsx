import { useEffect, useState } from 'react'
import { getErrorMessage, getFieldErrors } from '../services/api.js'
import { listProperties } from '../services/propertyService.js'
import {
  createMeter,
  createReading,
  deleteMeter,
  deleteReading,
  listMeters,
  listReadings,
  updateReading,
} from '../services/readingService.js'

const emptyReading = { reading_date: '', reading_value: '', notes: '' }

function flattenErrors(errors) {
  // Joins every server message (including non-field ones) into one line
  return Object.values(errors).join(' ')
}

function Readings() {
  const [properties, setProperties] = useState([])
  const [meters, setMeters] = useState([])
  const [selectedMeterId, setSelectedMeterId] = useState('')
  const [readings, setReadings] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  // Meter form
  const [meterForm, setMeterForm] = useState({ property: '', meter_number: '', description: '' })
  const [meterErrors, setMeterErrors] = useState('')

  // Reading form
  const [form, setForm] = useState(emptyReading)
  const [editingId, setEditingId] = useState(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadMeters(selectId) {
    try {
      const [props, meterList] = await Promise.all([listProperties(), listMeters()])
      setProperties(props)
      setMeters(meterList)
      const keep = selectId || selectedMeterId
      if (keep && meterList.some((m) => String(m.id) === String(keep))) {
        setSelectedMeterId(String(keep))
      } else if (meterList.length > 0) {
        setSelectedMeterId(String(meterList[0].id))
      } else {
        setSelectedMeterId('')
      }
      setPageError('')
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
    setLoading(false)
  }

  async function loadReadings(meterId) {
    if (!meterId) {
      setReadings([])
      return
    }
    try {
      setReadings(await listReadings(meterId))
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
  }

  useEffect(() => {
    loadMeters()
  }, [])

  useEffect(() => {
    loadReadings(selectedMeterId)
  }, [selectedMeterId])

  // ---------- Meters ----------
  async function handleAddMeter(event) {
    event.preventDefault()
    setMeterErrors('')
    if (!meterForm.property || meterForm.meter_number.trim() === '') {
      setMeterErrors('Choose a property and enter a meter number.')
      return
    }
    try {
      const created = await createMeter({
        property: meterForm.property,
        meter_number: meterForm.meter_number.trim(),
        description: meterForm.description,
      })
      setMeterForm({ property: meterForm.property, meter_number: '', description: '' })
      await loadMeters(created.id)
    } catch (error) {
      const fieldErrors = getFieldErrors(error)
      setMeterErrors(
        Object.keys(fieldErrors).length ? flattenErrors(fieldErrors) : getErrorMessage(error)
      )
    }
  }

  async function handleDeleteMeter(meter) {
    const sure = window.confirm(
      `Delete meter "${meter.meter_number}"? All its readings will be deleted too.`
    )
    if (!sure) return
    try {
      await deleteMeter(meter.id)
      await loadMeters()
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
  }

  // ---------- Readings ----------
  function handleChange(event) {
    const { name, value } = event.target
    setForm({ ...form, [name]: value })
  }

  function startEdit(reading) {
    setEditingId(reading.id)
    setForm({
      reading_date: reading.reading_date,
      reading_value: reading.reading_value,
      notes: reading.notes || '',
    })
    setFormError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyReading)
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    if (form.reading_date === '' || form.reading_value === '') {
      setFormError('Please enter both a date and a meter reading.')
      return
    }
    if (Number(form.reading_value) < 0) {
      setFormError('A meter reading cannot be negative.')
      return
    }

    const payload = {
      meter: selectedMeterId,
      reading_date: form.reading_date,
      reading_value: form.reading_value,
      notes: form.notes,
    }

    setSaving(true)
    try {
      if (editingId) {
        await updateReading(editingId, payload)
      } else {
        await createReading(payload)
      }
      cancelEdit()
      await loadReadings(selectedMeterId)
    } catch (error) {
      const fieldErrors = getFieldErrors(error)
      setFormError(
        Object.keys(fieldErrors).length ? flattenErrors(fieldErrors) : getErrorMessage(error)
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteReading(reading) {
    if (!window.confirm(`Delete the reading from ${reading.reading_date}?`)) return
    try {
      await deleteReading(reading.id)
      await loadReadings(selectedMeterId)
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
  }

  const selectedMeter = meters.find((m) => String(m.id) === String(selectedMeterId))

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    )
  }

  return (
    <>
      <h2 className="fw-bold mb-3">Meter Readings</h2>
      {pageError && <div className="alert alert-danger">{pageError}</div>}

      {properties.length === 0 ? (
        <div className="alert alert-info">
          You need a property first. Go to <strong>Properties</strong> and add one.
        </div>
      ) : (
        <>
          {/* ---------- Meters ---------- */}
          <div className="card ps-card mb-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3">Your meters</h5>

              {meters.length === 0 ? (
                <p className="text-muted">You have no meters yet. Add one below.</p>
              ) : (
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {meters.map((meter) => (
                    <span key={meter.id} className="badge text-bg-light border p-2">
                      {meter.meter_number}
                      <span className="text-muted"> ({meter.property_name})</span>
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-danger p-0 ms-2"
                        onClick={() => handleDeleteMeter(meter)}
                        aria-label={`Delete meter ${meter.meter_number}`}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddMeter} className="row g-2 align-items-end" noValidate>
                <div className="col-md-4">
                  <label htmlFor="meterProperty" className="form-label">Property</label>
                  <select
                    id="meterProperty"
                    className="form-select"
                    value={meterForm.property}
                    onChange={(e) => setMeterForm({ ...meterForm, property: e.target.value })}
                  >
                    <option value="">Choose...</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label htmlFor="meterNumber" className="form-label">Meter number</label>
                  <input
                    id="meterNumber"
                    className="form-control"
                    value={meterForm.meter_number}
                    onChange={(e) => setMeterForm({ ...meterForm, meter_number: e.target.value })}
                    placeholder="e.g. M-001"
                  />
                </div>
                <div className="col-md-4">
                  <button type="submit" className="btn btn-ps w-100">
                    <i className="bi bi-plus-lg me-1"></i>Add meter
                  </button>
                </div>
                {meterErrors && <div className="col-12 text-danger small">{meterErrors}</div>}
              </form>
            </div>
          </div>

          {/* ---------- Readings ---------- */}
          {meters.length > 0 && (
            <div className="card ps-card">
              <div className="card-body">
                <div className="row g-3 align-items-end mb-3">
                  <div className="col-md-4">
                    <label htmlFor="meterSelect" className="form-label fw-bold">Meter</label>
                    <select
                      id="meterSelect"
                      className="form-select"
                      value={selectedMeterId}
                      onChange={(e) => {
                        setSelectedMeterId(e.target.value)
                        cancelEdit()
                      }}
                    >
                      {meters.map((meter) => (
                        <option key={meter.id} value={meter.id}>
                          {meter.meter_number} ({meter.property_name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <h5 className="fw-bold">
                  {editingId ? 'Edit reading' : 'Add a reading'}
                  {selectedMeter && <span className="text-muted fs-6"> for {selectedMeter.meter_number}</span>}
                </h5>

                <form onSubmit={handleSubmit} className="row g-2 align-items-end mb-2" noValidate>
                  <div className="col-md-3">
                    <label htmlFor="reading_date" className="form-label">Date</label>
                    <input
                      id="reading_date"
                      name="reading_date"
                      type="date"
                      className="form-control"
                      value={form.reading_date}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="reading_value" className="form-label">Meter reading (kWh)</label>
                    <input
                      id="reading_value"
                      name="reading_value"
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={form.reading_value}
                      onChange={handleChange}
                      placeholder="e.g. 1500"
                    />
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="notes" className="form-label">Notes (optional)</label>
                    <input
                      id="notes"
                      name="notes"
                      className="form-control"
                      value={form.notes}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-3 d-flex gap-2">
                    <button type="submit" className="btn btn-ps flex-grow-1" disabled={saving}>
                      {saving ? 'Saving...' : editingId ? 'Update' : 'Add'}
                    </button>
                    {editingId && (
                      <button type="button" className="btn btn-outline-secondary" onClick={cancelEdit}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
                {formError && <div className="alert alert-danger py-2">{formError}</div>}

                <hr />

                <h5 className="fw-bold">Reading history</h5>
                <p className="small text-muted">
                  These are <strong>actual meter readings</strong>. Consumption is the current
                  reading minus the previous one.
                </p>

                {readings.length === 0 ? (
                  <p className="text-muted mb-0">No readings yet for this meter.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th className="text-end">Reading (kWh)</th>
                          <th className="text-end">Previous</th>
                          <th className="text-end">Consumption (kWh)</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {readings.map((reading) => (
                          <tr key={reading.id}>
                            <td>{reading.reading_date}</td>
                            <td className="text-end">{reading.reading_value}</td>
                            <td className="text-end">{reading.previous_reading ?? '-'}</td>
                            <td className="text-end fw-bold">
                              {reading.consumption ?? 'First reading'}
                            </td>
                            <td className="text-end text-nowrap">
                              <button
                                className="btn btn-sm btn-outline-secondary me-1"
                                onClick={() => startEdit(reading)}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteReading(reading)}
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
          )}
        </>
      )}
    </>
  )
}

export default Readings