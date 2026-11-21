
import { useEffect, useState } from 'react'
import { getErrorMessage } from '../services/api.js'
import { listProperties } from '../services/propertyService.js'
import { listMeters, createMeter } from '../services/meterService.js'
import { listReadings, createReading } from '../services/readingService.js'

function getItems(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  return []
}

function getToday() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function Readings() {
  const [properties, setProperties] = useState([])
  const [meters, setMeters] = useState([])
  const [readings, setReadings] = useState([])

  const [propertyId, setPropertyId] = useState('')
  const [meterId, setMeterId] = useState('')

  const [meterNumber, setMeterNumber] = useState('')
  const [meterDescription, setMeterDescription] = useState('')

  const [readingDate, setReadingDate] = useState(getToday())
  const [readingValue, setReadingValue] = useState('')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(true)
  const [savingMeter, setSavingMeter] = useState(false)
  const [savingReading, setSavingReading] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadProperties() {
    const data = await listProperties()
    const items = getItems(data)

    setProperties(items)

    if (items.length > 0) {
      setPropertyId((current) =>
        current || String(items[0].id)
      )
    }
  }

  async function loadMeters(selectedPropertyId) {
    if (!selectedPropertyId) {
      setMeters([])
      setMeterId('')
      return
    }

    const data = await listMeters(selectedPropertyId)
    const items = getItems(data)

    setMeters(items)

    setMeterId((current) =>
      items.some((meter) => String(meter.id) === current)
        ? current
        : items.length > 0 ? String(items[0].id) : ''
    )
  }

  async function loadReadings() {
    const data = await listReadings()
    setReadings(getItems(data))
  }

  useEffect(() => {
    async function loadPage() {
      setLoading(true)
      setError('')

      try {
        await Promise.all([
          loadProperties(),
          loadReadings(),
        ])
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    loadPage()
  }, [])

  useEffect(() => {
    if (!propertyId) {
      setMeters([])
      setMeterId('')
      return
    }

    async function fetchMeters() {
      try {
        setError('')
        await loadMeters(propertyId)
      } catch (err) {
        setError(getErrorMessage(err))
      }
    }

    fetchMeters()
  }, [propertyId])

  async function handleCreateMeter(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!propertyId) {
      setError('Please select a property first.')
      return
    }

    if (!meterNumber.trim()) {
      setError('Please enter a meter number.')
      return
    }

    setSavingMeter(true)

    try {
      const newMeter = await createMeter({
        property: Number(propertyId),
        meter_number: meterNumber.trim(),
        description: meterDescription.trim(),
        is_active: true,
      })

      await loadMeters(propertyId)

      if (newMeter?.id) {
        setMeterId(String(newMeter.id))
      }

      setMeterNumber('')
      setMeterDescription('')
      setSuccess('Electricity meter added successfully.')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSavingMeter(false)
    }
  }

  async function handleCreateReading(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!meterId) {
      setError('Please add or select an electricity meter first.')
      return
    }

    if (!readingDate || readingValue === '') {
      setError('Please enter the reading date and meter value.')
      return
    }

    if (Number(readingValue) < 0) {
      setError('Reading value cannot be negative.')
      return
    }

    setSavingReading(true)

    try {
      await createReading({
        meter: Number(meterId),
        reading_date: readingDate,
        reading_value: readingValue,
        notes: notes.trim(),
      })

      await loadReadings()

      setReadingValue('')
      setNotes('')
      setReadingDate(getToday())

      setSuccess('Meter reading saved successfully.')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSavingReading(false)
    }
  }

  const selectedMeter = meters.find(
    (meter) => String(meter.id) === meterId
  )

  const filteredReadings = readings
    .filter((reading) => String(reading.meter) === meterId)
    .sort((a, b) =>
      new Date(b.reading_date) - new Date(a.reading_date)
    )

  const latestReading = filteredReadings[0]

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Meter Readings</h2>
          <p className="text-muted mb-0">
            Manage electricity meters and track your energy consumption.
          </p>
        </div>
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

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="text-muted mt-2">
            Loading meter information...
          </p>
        </div>
      ) : properties.length === 0 ? (
        <div className="card ps-card p-4 text-center">
          <h5>No properties found</h5>
          <p className="text-muted">
            Add a property before creating an electricity meter.
          </p>
          <a href="/properties" className="btn btn-ps">
            Go to Properties
          </a>
        </div>
      ) : (
        <>
          <div className="card ps-card p-4 mb-4">
            <h5 className="fw-bold mb-3">Select Property</h5>

            <select
              className="form-select"
              value={propertyId}
              onChange={(event) =>
                setPropertyId(event.target.value)
              }
            >
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-lg-6">
              <div className="card ps-card p-4 h-100">
                <h5 className="fw-bold mb-3">
                  Add Electricity Meter
                </h5>

                <form onSubmit={handleCreateMeter}>
                  <div className="mb-3">
                    <label className="form-label">
                      Meter Number
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter meter number"
                      value={meterNumber}
                      onChange={(event) =>
                        setMeterNumber(event.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Example: Main electricity meter"
                      value={meterDescription}
                      onChange={(event) =>
                        setMeterDescription(event.target.value)
                      }
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-ps"
                    disabled={savingMeter}
                  >
                    {savingMeter ? 'Adding...' : 'Add Meter'}
                  </button>
                </form>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card ps-card p-4 h-100">
                <h5 className="fw-bold mb-3">
                  Meter Information
                </h5>

                {meters.length === 0 ? (
                  <p className="text-muted mb-0">
                    No meters added for this property yet.
                  </p>
                ) : (
                  <>
                    <label className="form-label">
                      Select Meter
                    </label>

                    <select
                      className="form-select mb-3"
                      value={meterId}
                      onChange={(event) =>
                        setMeterId(event.target.value)
                      }
                    >
                      {meters.map((meter) => (
                        <option key={meter.id} value={meter.id}>
                          {meter.meter_number}
                        </option>
                      ))}
                    </select>

                    <p className="mb-1">
                      <strong>Meter Number:</strong>{' '}
                      {selectedMeter?.meter_number}
                    </p>

                    <p className="mb-1">
                      <strong>Description:</strong>{' '}
                      {selectedMeter?.description || 'Not provided'}
                    </p>

                    <p className="mb-0">
                      <strong>Status:</strong>{' '}
                      {selectedMeter?.is_active
                        ? 'Active'
                        : 'Inactive'}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="card ps-card p-4 mb-4">
            <h5 className="fw-bold mb-3">
              Add New Meter Reading
            </h5>

            <form onSubmit={handleCreateReading}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">
                    Reading Date
                  </label>

                  <input
                    type="date"
                    className="form-control"
                    value={readingDate}
                    onChange={(event) =>
                      setReadingDate(event.target.value)
                    }
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">
                    Meter Reading (kWh)
                  </label>

                  <input
                    type="number"
                    className="form-control"
                    placeholder="Enter meter reading"
                    min="0"
                    step="0.01"
                    value={readingValue}
                    onChange={(event) =>
                      setReadingValue(event.target.value)
                    }
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">
                    Notes (Optional)
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Additional information"
                    value={notes}
                    onChange={(event) =>
                      setNotes(event.target.value)
                    }
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-ps mt-3"
                disabled={savingReading || !meterId}
              >
                {savingReading ? 'Saving...' : 'Save Reading'}
              </button>
            </form>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="card ps-card p-3 h-100">
                <p className="text-muted mb-1">
                  Total Readings
                </p>
                <h3 className="fw-bold mb-0">
                  {filteredReadings.length}
                </h3>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card ps-card p-3 h-100">
                <p className="text-muted mb-1">
                  Latest Meter Value
                </p>
                <h3 className="fw-bold mb-0">
                  {latestReading
                    ? `${latestReading.reading_value} kWh`
                    : '0 kWh'}
                </h3>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card ps-card p-3 h-100">
                <p className="text-muted mb-1">
                  Latest Consumption
                </p>
                <h3 className="fw-bold mb-0">
                  {latestReading?.consumption != null
                    ? `${latestReading.consumption} kWh`
                    : 'N/A'}
                </h3>
              </div>
            </div>
          </div>

          <div className="card ps-card p-4">
            <h5 className="fw-bold mb-3">
              Reading History
            </h5>

            {filteredReadings.length === 0 ? (
              <p className="text-muted mb-0">
                No readings available for this meter. Add your first reading above.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Meter Number</th>
                      <th>Reading (kWh)</th>
                      <th>Consumption (kWh)</th>
                      <th>Notes</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredReadings.map((reading) => (
                      <tr key={reading.id}>
                        <td>{reading.reading_date}</td>
                        <td>
                          {reading.meter_number ||
                            selectedMeter?.meter_number}
                        </td>
                        <td>{reading.reading_value}</td>
                        <td>
                          {reading.consumption != null
                            ? reading.consumption
                            : 'First reading'}
                        </td>
                        <td>{reading.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Readings
