
import { useEffect, useMemo, useState } from 'react'

import {
  listTariffs,
  createTariff,
  listBillEstimates,
  generateBillEstimate,
} from '../services/billingService.js'

import { listProperties } from '../services/propertyService.js'

import { getErrorMessage, getFieldErrors } from '../services/api.js'

const emptyTariff = {
  property: '',
  name: 'Home Electricity Tariff',
  rate_per_unit: '5.00',
  fixed_charge: '100.00',
  other_charges: '20.00',
}

const emptyBill = {
  property: '',
  tariff: '',
  period_start: '',
  period_end: '',
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(Number(value || 0))
}

function formatDate(value) {
  if (!value) return '-'

  return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function Billing() {
  const [properties, setProperties] = useState([])
  const [tariffs, setTariffs] = useState([])
  const [estimates, setEstimates] = useState([])

  const [tariffForm, setTariffForm] = useState(emptyTariff)
  const [billForm, setBillForm] = useState(emptyBill)

  const [loading, setLoading] = useState(true)
  const [savingTariff, setSavingTariff] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [pageError, setPageError] = useState('')
  const [success, setSuccess] = useState('')
  const [tariffErrors, setTariffErrors] = useState({})
  const [billError, setBillError] = useState('')

  const [latestBill, setLatestBill] = useState(null)
  const [showTariffForm, setShowTariffForm] = useState(false)

  async function loadBillingData() {
    setLoading(true)
    setPageError('')

    try {
      const [propertyData, tariffData, estimateData] = await Promise.all([
        listProperties(),
        listTariffs(),
        listBillEstimates(),
      ])

      const propertyList = Array.isArray(propertyData)
        ? propertyData
        : propertyData.results || []

      const tariffList = Array.isArray(tariffData)
        ? tariffData
        : tariffData.results || []

      const estimateList = Array.isArray(estimateData)
        ? estimateData
        : estimateData.results || []

      setProperties(propertyList)
      setTariffs(tariffList)
      setEstimates(estimateList)

      setBillForm((previous) => ({
        ...previous,
        property:
          previous.property ||
          (propertyList.length === 1 ? String(propertyList[0].id) : ''),
      }))

      setTariffForm((previous) => ({
        ...previous,
        property:
          previous.property ||
          (propertyList.length === 1 ? String(propertyList[0].id) : ''),
      }))
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBillingData()
  }, [])

  const activeTariffs = useMemo(
    () => tariffs.filter((tariff) => tariff.is_active),
    [tariffs]
  )

  const selectedTariffs = activeTariffs.filter(
    (tariff) => String(tariff.property) === String(billForm.property)
  )

  const selectedTariff = selectedTariffs.find(
    (tariff) => String(tariff.id) === String(billForm.tariff)
  )

  const totalEstimatedAmount = estimates.reduce(
    (total, bill) => total + Number(bill.total_amount || 0),
    0
  )

  const totalEstimatedUnits = estimates.reduce(
    (total, bill) => total + Number(bill.units_consumed || 0),
    0
  )

  function handleTariffChange(event) {
    const { name, value } = event.target

    setTariffForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  function handleBillChange(event) {
    const { name, value } = event.target

    setBillForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === 'property' ? { tariff: '' } : {}),
    }))

    setBillError('')
  }

  async function handleCreateTariff(event) {
    event.preventDefault()

    setSavingTariff(true)
    setSuccess('')
    setPageError('')
    setTariffErrors({})

    try {
      const payload = {
        ...tariffForm,
        property: Number(tariffForm.property),
        slabs: [],
        is_active: true,
      }

      await createTariff(payload)

      setSuccess('Electricity tariff created successfully!')
      setTariffForm({
        ...emptyTariff,
        property: tariffForm.property,
      })
      setShowTariffForm(false)

      await loadBillingData()
    } catch (error) {
      setTariffErrors(getFieldErrors(error))
      setPageError(getErrorMessage(error))
    } finally {
      setSavingTariff(false)
    }
  }

  async function handleGenerateBill(event) {
    event.preventDefault()

    setGenerating(true)
    setSuccess('')
    setPageError('')
    setBillError('')
    setLatestBill(null)

    try {
      if (!billForm.property || !billForm.tariff) {
        setBillError('Please select a property and an active tariff.')
        return
      }

      if (!billForm.period_start || !billForm.period_end) {
        setBillError('Please select both billing dates.')
        return
      }

      if (billForm.period_start > billForm.period_end) {
        setBillError('Start date cannot be after the end date.')
        return
      }

      const payload = {
        property: Number(billForm.property),
        tariff: Number(billForm.tariff),
        period_start: billForm.period_start,
        period_end: billForm.period_end,
      }

      const result = await generateBillEstimate(payload)

      setLatestBill(result)
      setSuccess('Your electricity bill estimate was generated successfully!')

      const updatedEstimates = await listBillEstimates()
      setEstimates(
        Array.isArray(updatedEstimates)
          ? updatedEstimates
          : updatedEstimates.results || []
      )
    } catch (error) {
      setBillError(getErrorMessage(error))
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status"></div>
        <p className="text-muted mt-3">Loading billing information...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Page heading */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-receipt text-success me-2"></i>
            Bill Estimation
          </h2>
          <p className="text-muted mb-0">
            Manage electricity tariffs and estimate your electricity bills.
          </p>
        </div>

        <button
          className="btn btn-success"
          onClick={() => setShowTariffForm((previous) => !previous)}
        >
          <i className="bi bi-plus-lg me-1"></i>
          Add Tariff
        </button>
      </div>

      {/* Messages */}
      {pageError && (
        <div className="alert alert-danger alert-dismissible">
          {pageError}
          <button
            type="button"
            className="btn-close"
            onClick={() => setPageError('')}
          ></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible">
          {success}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccess('')}
          ></button>
        </div>
      )}

      {/* Summary cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-muted mb-1">Total Estimates</p>
                  <h3 className="fw-bold">{estimates.length}</h3>
                </div>
                <i className="bi bi-receipt fs-2 text-success"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-muted mb-1">Total Units Estimated</p>
                  <h3 className="fw-bold">
                    {totalEstimatedUnits.toFixed(2)} kWh
                  </h3>
                </div>
                <i className="bi bi-lightning-charge fs-2 text-warning"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-muted mb-1">Total Estimated Amount</p>
                  <h3 className="fw-bold text-success">
                    {formatCurrency(totalEstimatedAmount)}
                  </h3>
                </div>
                <i className="bi bi-currency-rupee fs-2 text-success"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add tariff form */}
      {showTariffForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3">
            <h5 className="fw-bold mb-0">Create Electricity Tariff</h5>
          </div>

          <div className="card-body">
            {properties.length === 0 ? (
              <div className="alert alert-warning mb-0">
                Please create a property before adding an electricity tariff.
              </div>
            ) : (
              <form onSubmit={handleCreateTariff}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Property</label>
                    <select
                      className="form-select"
                      name="property"
                      value={tariffForm.property}
                      onChange={handleTariffChange}
                      required
                    >
                      <option value="">Select property</option>
                      {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.name}
                        </option>
                      ))}
                    </select>
                    {tariffErrors.property && (
                      <div className="text-danger small mt-1">
                        {tariffErrors.property}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Tariff Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={tariffForm.name}
                      onChange={handleTariffChange}
                      required
                    />
                    {tariffErrors.name && (
                      <div className="text-danger small mt-1">
                        {tariffErrors.name}
                      </div>
                    )}
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Rate per Unit (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-control"
                      name="rate_per_unit"
                      value={tariffForm.rate_per_unit}
                      onChange={handleTariffChange}
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Fixed Charge (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-control"
                      name="fixed_charge"
                      value={tariffForm.fixed_charge}
                      onChange={handleTariffChange}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Other Charges (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-control"
                      name="other_charges"
                      value={tariffForm.other_charges}
                      onChange={handleTariffChange}
                    />
                  </div>
                </div>

                <div className="d-flex gap-2 mt-4">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={savingTariff}
                  >
                    {savingTariff ? 'Saving...' : 'Save Tariff'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowTariffForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Existing tariffs */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3">
          <h5 className="fw-bold mb-0">
            <i className="bi bi-tags text-success me-2"></i>
            Electricity Tariffs
          </h5>
        </div>

        <div className="card-body">
          {tariffs.length === 0 ? (
            <p className="text-muted mb-0">
              No tariffs created yet. Click Add Tariff to create one.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Tariff Name</th>
                    <th>Property</th>
                    <th>Rate / Unit</th>
                    <th>Fixed Charge</th>
                    <th>Other Charges</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tariffs.map((tariff) => (
                    <tr key={tariff.id}>
                      <td className="fw-semibold">{tariff.name}</td>
                      <td>{tariff.property_name}</td>
                      <td>{formatCurrency(tariff.rate_per_unit)}</td>
                      <td>{formatCurrency(tariff.fixed_charge)}</td>
                      <td>{formatCurrency(tariff.other_charges)}</td>
                      <td>
                        <span
                          className={`badge ${
                            tariff.is_active
                              ? 'text-bg-success'
                              : 'text-bg-secondary'
                          }`}
                        >
                          {tariff.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Generate bill form */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3">
          <h5 className="fw-bold mb-0">
            <i className="bi bi-calculator text-success me-2"></i>
            Generate Electricity Bill
          </h5>
        </div>

        <div className="card-body">
          {properties.length === 0 ? (
            <div className="alert alert-warning">
              Please add a property before generating a bill.
            </div>
          ) : (
            <form onSubmit={handleGenerateBill}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Select Property</label>
                  <select
                    className="form-select"
                    name="property"
                    value={billForm.property}
                    onChange={handleBillChange}
                    required
                  >
                    <option value="">Select property</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Select Electricity Tariff</label>
                  <select
                    className="form-select"
                    name="tariff"
                    value={billForm.tariff}
                    onChange={handleBillChange}
                    required
                    disabled={!billForm.property}
                  >
                    <option value="">Select tariff</option>
                    {selectedTariffs.map((tariff) => (
                      <option key={tariff.id} value={tariff.id}>
                        {tariff.name} - {formatCurrency(tariff.rate_per_unit)}/unit
                      </option>
                    ))}
                  </select>

                  {billForm.property && selectedTariffs.length === 0 && (
                    <small className="text-danger">
                      No active tariff available for this property.
                    </small>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label">Billing Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="period_start"
                    value={billForm.period_start}
                    onChange={handleBillChange}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Billing End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="period_end"
                    value={billForm.period_end}
                    onChange={handleBillChange}
                    min={billForm.period_start || undefined}
                    required
                  />
                </div>
              </div>

              {selectedTariff && (
                <div className="alert alert-light border mt-3 mb-0">
                  <strong>Selected tariff:</strong> {selectedTariff.name}
                  <div className="small text-muted mt-1">
                    ₹{selectedTariff.rate_per_unit} per unit + fixed and other charges.
                  </div>
                </div>
              )}

              {billError && (
                <div className="alert alert-danger mt-3 mb-0">
                  {billError}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-success mt-3"
                disabled={generating || selectedTariffs.length === 0}
              >
                <i className="bi bi-calculator me-1"></i>
                {generating ? 'Generating...' : 'Generate Bill Estimate'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Latest generated bill */}
      {latestBill && (
        <div className="card border-success shadow-sm mb-4">
          <div className="card-header bg-success text-white py-3">
            <h5 className="fw-bold mb-0">
              <i className="bi bi-check-circle me-2"></i>
              Bill Generated Successfully
            </h5>
          </div>

          <div className="card-body">
            <div className="text-center py-3">
              <p className="text-muted mb-1">Estimated Total Amount</p>
              <h2 className="fw-bold text-success">
                {formatCurrency(latestBill.total_amount)}
              </h2>
              <p className="text-muted mb-0">
                {latestBill.units_consumed} kWh consumed
              </p>
            </div>

            <hr />

            <div className="row g-3">
              <div className="col-md-6">
                <p className="mb-1 text-muted">Energy Charges</p>
                <h6>{formatCurrency(latestBill.energy_charges)}</h6>
              </div>

              <div className="col-md-6">
                <p className="mb-1 text-muted">Fixed Charges</p>
                <h6>{formatCurrency(latestBill.fixed_charges)}</h6>
              </div>

              <div className="col-md-6">
                <p className="mb-1 text-muted">Other Charges</p>
                <h6>{formatCurrency(latestBill.other_charges)}</h6>
              </div>

              <div className="col-md-6">
                <p className="mb-1 text-muted">Billing Period</p>
                <h6>
                  {formatDate(latestBill.period_start)} -{' '}
                  {formatDate(latestBill.period_end)}
                </h6>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bill history */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3">
          <h5 className="fw-bold mb-0">
            <i className="bi bi-clock-history text-success me-2"></i>
            Bill Estimate History
          </h5>
        </div>

        <div className="card-body">
          {estimates.length === 0 ? (
            <p className="text-muted mb-0">
              No bill estimates available. Generate your first bill above.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Billing Period</th>
                    <th>Units (kWh)</th>
                    <th>Energy Charges</th>
                    <th>Total Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {estimates.map((bill) => (
                    <tr key={bill.id}>
                      <td className="fw-semibold">{bill.property_name}</td>
                      <td>
                        {formatDate(bill.period_start)} -{' '}
                        {formatDate(bill.period_end)}
                      </td>
                      <td>{Number(bill.units_consumed).toFixed(2)}</td>
                      <td>{formatCurrency(bill.energy_charges)}</td>
                      <td className="fw-bold text-success">
                        {formatCurrency(bill.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <p className="text-muted small">
        <i className="bi bi-info-circle me-1"></i>
        These are estimated bills based on your saved meter readings and
        configured tariff. They may differ from your electricity provider's
        official bill.
      </p>
    </div>
  )
}

export default Billing
