import { useEffect, useState } from 'react'
import { getErrorMessage, getFieldErrors } from '../services/api.js'
import { listProperties } from '../services/propertyService.js'
import {
  calculateBill,
  createTariff,
  deleteTariff,
  listBills,
  listTariffs,
  previewBill,
} from '../services/billingService.js'

const DISCLAIMER =
  'This is an estimate based on the tariff you configured. It may differ from the actual bill from your electricity provider.'

const emptyTariff = {
  property: '',
  name: 'My tariff',
  rate_per_unit: '',
  fixed_charge: 0,
  other_charges: 0,
}

function money(value) {
  return `₹${Number(value).toFixed(2)}`
}

function BillBreakdown({ bill }) {
  return (
    <table className="table table-sm mb-2">
      <tbody>
        <tr><td>Total units consumed</td><td className="text-end">{Number(bill.units_consumed).toFixed(2)} kWh</td></tr>
        <tr><td>Energy charges</td><td className="text-end">{money(bill.energy_charges)}</td></tr>
        <tr><td>Fixed charges</td><td className="text-end">{money(bill.fixed_charges)}</td></tr>
        <tr><td>Other charges</td><td className="text-end">{money(bill.other_charges)}</td></tr>
        <tr className="fw-bold"><td>Estimated total bill</td><td className="text-end">{money(bill.total_amount)}</td></tr>
      </tbody>
    </table>
  )
}

function Billing() {
  const [properties, setProperties] = useState([])
  const [tariffs, setTariffs] = useState([])
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const [tariffForm, setTariffForm] = useState(emptyTariff)
  const [tariffErrors, setTariffErrors] = useState({})

  const [quick, setQuick] = useState({ tariff: '', units: '' })
  const [quickResult, setQuickResult] = useState(null)
  const [quickError, setQuickError] = useState('')

  const [calc, setCalc] = useState({ property: '', tariff: '', period_start: '', period_end: '' })
  const [calcResult, setCalcResult] = useState(null)
  const [calcError, setCalcError] = useState('')

  async function load() {
    try {
      const [props, tariffList, billList] = await Promise.all([
        listProperties(),
        listTariffs(),
        listBills(),
      ])
      setProperties(props)
      setTariffs(tariffList)
      setBills(billList)
      setPageError('')
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleAddTariff(event) {
    event.preventDefault()
    const found = {}
    if (!tariffForm.property) found.property = 'Choose a property.'
    if (tariffForm.rate_per_unit === '' || Number(tariffForm.rate_per_unit) < 0) {
      found.rate_per_unit = 'Enter a price per unit of 0 or more.'
    }
    if (Number(tariffForm.fixed_charge) < 0) found.fixed_charge = 'Cannot be negative.'
    if (Number(tariffForm.other_charges) < 0) found.other_charges = 'Cannot be negative.'
    setTariffErrors(found)
    if (Object.keys(found).length > 0) return

    try {
      await createTariff(tariffForm)
      setTariffForm({ ...emptyTariff, property: tariffForm.property })
      await load()
    } catch (error) {
      setTariffErrors(getFieldErrors(error))
      if (Object.keys(getFieldErrors(error)).length === 0) setPageError(getErrorMessage(error))
    }
  }

  async function handleDeleteTariff(tariff) {
    if (!window.confirm(`Delete tariff "${tariff.name}"?`)) return
    try {
      await deleteTariff(tariff.id)
      await load()
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
  }

  async function handleQuick(event) {
    event.preventDefault()
    setQuickError('')
    setQuickResult(null)
    if (!quick.tariff || quick.units === '' || Number(quick.units) < 0) {
      setQuickError('Choose a tariff and enter units of 0 or more.')
      return
    }
    try {
      setQuickResult(await previewBill(quick.tariff, quick.units))
    } catch (error) {
      setQuickError(getErrorMessage(error))
    }
  }

  async function handleCalculate(event) {
    event.preventDefault()
    setCalcError('')
    setCalcResult(null)
    if (!calc.property || !calc.tariff || !calc.period_start || !calc.period_end) {
      setCalcError('Choose a property, a tariff, and both dates.')
      return
    }
    try {
      setCalcResult(await calculateBill(calc))
      await load()
    } catch (error) {
      setCalcError(getErrorMessage(error))
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    )
  }

  const tariffsForProperty = tariffs.filter(
    (t) => !calc.property || String(t.property) === String(calc.property)
  )

  return (
    <>
      <h2 className="fw-bold mb-3">Bill Estimation</h2>
      {pageError && <div className="alert alert-danger">{pageError}</div>}

      <div className="alert alert-warning">
        <i className="bi bi-info-circle-fill me-2"></i>
        {DISCLAIMER}
      </div>

      {properties.length === 0 ? (
        <div className="alert alert-info">
          You need a property first. Go to <strong>Properties</strong> and add one.
        </div>
      ) : (
        <>
          <div className="card ps-card mb-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3">Your tariffs</h5>
              {tariffs.length === 0 ? (
                <p className="text-muted">No tariffs yet. Add one below.</p>
              ) : (
                <ul className="list-group mb-3">
                  {tariffs.map((t) => (
                    <li key={t.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <span>
                        <strong>{t.name}</strong> ({t.property_name}): ₹{t.rate_per_unit}/unit,
                        fixed ₹{t.fixed_charge}, other ₹{t.other_charges}
                      </span>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteTariff(t)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <form onSubmit={handleAddTariff} noValidate>
                <div className="row g-2">
                  <div className="col-md-3">
                    <label className="form-label" htmlFor="t_property">Property</label>
                    <select
                      id="t_property"
                      className={`form-select ${tariffErrors.property ? 'is-invalid' : ''}`}
                      value={tariffForm.property}
                      onChange={(e) => setTariffForm({ ...tariffForm, property: e.target.value })}
                    >
                      <option value="">Choose...</option>
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    {tariffErrors.property && <div className="invalid-feedback">{tariffErrors.property}</div>}
                  </div>
                  <div className="col-md-3">
                    <label className="form-label" htmlFor="t_name">Tariff name</label>
                    <input
                      id="t_name"
                      className="form-control"
                      value={tariffForm.name}
                      onChange={(e) => setTariffForm({ ...tariffForm, name: e.target.value })}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label" htmlFor="t_rate">Price per unit (₹)</label>
                    <input
                      id="t_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      className={`form-control ${tariffErrors.rate_per_unit ? 'is-invalid' : ''}`}
                      value={tariffForm.rate_per_unit}
                      onChange={(e) => setTariffForm({ ...tariffForm, rate_per_unit: e.target.value })}
                    />
                    {tariffErrors.rate_per_unit && <div className="invalid-feedback">{tariffErrors.rate_per_unit}</div>}
                  </div>
                  <div className="col-md-2">
                    <label className="form-label" htmlFor="t_fixed">Fixed charge (₹)</label>
                    <input
                      id="t_fixed"
                      type="number"
                      step="0.01"
                      min="0"
                      className={`form-control ${tariffErrors.fixed_charge ? 'is-invalid' : ''}`}
                      value={tariffForm.fixed_charge}
                      onChange={(e) => setTariffForm({ ...tariffForm, fixed_charge: e.target.value })}
                    />
                    {tariffErrors.fixed_charge && <div className="invalid-feedback">{tariffErrors.fixed_charge}</div>}
                  </div>
                  <div className="col-md-2">
                    <label className="form-label" htmlFor="t_other">Other charges (₹)</label>
                    <input
                      id="t_other"
                      type="number"
                      step="0.01"
                      min="0"
                      className={`form-control ${tariffErrors.other_charges ? 'is-invalid' : ''}`}
                      value={tariffForm.other_charges}
                      onChange={(e) => setTariffForm({ ...tariffForm, other_charges: e.target.value })}
                    />
                    {tariffErrors.other_charges && <div className="invalid-feedback">{tariffErrors.other_charges}</div>}
                  </div>
                </div>
                <button type="submit" className="btn btn-ps mt-3">Add tariff</button>
              </form>
            </div>
          </div>

          {tariffs.length > 0 && (
            <div className="row g-3 mb-4">
              <div className="col-12 col-xl-6">
                <div className="card ps-card h-100">
                  <div className="card-body">
                    <h5 className="fw-bold">Quick calculator</h5>
                    <p className="small text-muted">Type a number of units. Nothing is saved.</p>
                    <form onSubmit={handleQuick} noValidate className="row g-2 align-items-end">
                      <div className="col-md-5">
                        <label className="form-label" htmlFor="q_tariff">Tariff</label>
                        <select
                          id="q_tariff"
                          className="form-select"
                          value={quick.tariff}
                          onChange={(e) => setQuick({ ...quick, tariff: e.target.value })}
                        >
                          <option value="">Choose...</option>
                          {tariffs.map((t) => (
                            <option key={t.id} value={t.id}>{t.name} ({t.property_name})</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label" htmlFor="q_units">Units (kWh)</label>
                        <input
                          id="q_units"
                          type="number"
                          min="0"
                          step="0.01"
                          className="form-control"
                          value={quick.units}
                          onChange={(e) => setQuick({ ...quick, units: e.target.value })}
                        />
                      </div>
                      <div className="col-md-3">
                        <button type="submit" className="btn btn-ps w-100">Calculate</button>
                      </div>
                    </form>
                    {quickError && <div className="alert alert-danger py-2 mt-3">{quickError}</div>}
                    {quickResult && <div className="mt-3"><BillBreakdown bill={quickResult} /></div>}
                  </div>
                </div>
              </div>

              <div className="col-12 col-xl-6">
                <div className="card ps-card h-100">
                  <div className="card-body">
                    <h5 className="fw-bold">From your meter readings</h5>
                    <p className="small text-muted">
                      Uses your actual readings for the dates you pick, and saves the bill.
                    </p>
                    <form onSubmit={handleCalculate} noValidate className="row g-2">
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="c_property">Property</label>
                        <select
                          id="c_property"
                          className="form-select"
                          value={calc.property}
                          onChange={(e) => setCalc({ ...calc, property: e.target.value, tariff: '' })}
                        >
                          <option value="">Choose...</option>
                          {properties.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="c_tariff">Tariff</label>
                        <select
                          id="c_tariff"
                          className="form-select"
                          value={calc.tariff}
                          onChange={(e) => setCalc({ ...calc, tariff: e.target.value })}
                        >
                          <option value="">Choose...</option>
                          {tariffsForProperty.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="c_start">From</label>
                        <input
                          id="c_start"
                          type="date"
                          className="form-control"
                          value={calc.period_start}
                          onChange={(e) => setCalc({ ...calc, period_start: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="c_end">To</label>
                        <input
                          id="c_end"
                          type="date"
                          className="form-control"
                          value={calc.period_end}
                          onChange={(e) => setCalc({ ...calc, period_end: e.target.value })}
                        />
                      </div>
                      <div className="col-12">
                        <button type="submit" className="btn btn-ps">Calculate and save</button>
                      </div>
                    </form>
                    {calcError && <div className="alert alert-danger py-2 mt-3">{calcError}</div>}
                    {calcResult && <div className="mt-3"><BillBreakdown bill={calcResult} /></div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card ps-card">
            <div className="card-body">
              <h5 className="fw-bold">Bill history <span className="badge text-bg-warning">Estimates</span></h5>
              {bills.length === 0 ? (
                <p className="text-muted mb-0">No saved bills yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Property</th>
                        <th>Period</th>
                        <th className="text-end">Units</th>
                        <th className="text-end">Energy</th>
                        <th className="text-end">Fixed</th>
                        <th className="text-end">Other</th>
                        <th className="text-end">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bills.map((bill) => (
                        <tr key={bill.id}>
                          <td>{bill.property_name}</td>
                          <td>{bill.period_start} to {bill.period_end}</td>
                          <td className="text-end">{Number(bill.units_consumed).toFixed(2)}</td>
                          <td className="text-end">{money(bill.energy_charges)}</td>
                          <td className="text-end">{money(bill.fixed_charges)}</td>
                          <td className="text-end">{money(bill.other_charges)}</td>
                          <td className="text-end fw-bold">{money(bill.total_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default Billing