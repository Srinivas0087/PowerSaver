
import { useEffect, useState } from 'react'
import {
  listAlerts,
  markAlertRead,
  generateNotifications,
} from '../services/notificationService.js'

function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)

  async function loadAlerts() {
    try {
      setError('')
      const data = await listAlerts()
      setAlerts(Array.isArray(data) ? data : data.results || [])
    } catch (err) {
      setError('Unable to load alerts. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [])

  async function handleMarkRead(id) {
    try {
      await markAlertRead(id)
      await loadAlerts()
    } catch (err) {
      setError('Unable to mark alert as read.')
    }
  }

  async function handleGenerate() {
    try {
      setGenerating(true)
      setError('')
      const result = await generateNotifications()
      await loadAlerts()
      window.alert(
        `Generated ${result.alerts_created} alerts and ${result.recommendations_created} recommendations.`
      )
    } catch (err) {
      setError('Unable to generate notifications.')
    } finally {
      setGenerating(false)
    }
  }

  const unreadCount = alerts.filter(alert => !alert.is_read).length

  if (loading) {
    return <div className="container-fluid p-4">Loading alerts...</div>
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1">Energy Alerts</h2>
          <p className="text-muted mb-0">
            Monitor unusual electricity consumption.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? 'Generating...' : 'Generate Alerts'}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <p className="text-muted mb-1">Total Alerts</p>
              <h3 className="fw-bold">{alerts.length}</h3>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <p className="text-muted mb-1">Unread Alerts</p>
              <h3 className="fw-bold text-danger">{unreadCount}</h3>
            </div>
          </div>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <h5>No alerts found</h5>
            <p className="text-muted mb-0">
              Click Generate Alerts to check your electricity usage.
            </p>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className="border-bottom py-3 d-flex justify-content-between align-items-start gap-3"
              >
                <div>
                  <div className="d-flex gap-2 align-items-center flex-wrap mb-2">
                    <strong>{alert.alert_type_display}</strong>

                    <span
                      className={`badge ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-danger'
                          : alert.severity === 'WARNING'
                          ? 'bg-warning text-dark'
                          : 'bg-info'
                      }`}
                    >
                      {alert.severity_display}
                    </span>

                    {!alert.is_read && (
                      <span className="badge bg-primary">New</span>
                    )}
                  </div>

                  <p className="mb-1">{alert.message}</p>

                  <small className="text-muted">
                    {alert.property_name} ·{' '}
                    {new Date(alert.created_at).toLocaleString()}
                  </small>
                </div>

                {!alert.is_read && (
                  <button
                    className="btn btn-sm btn-outline-primary flex-shrink-0"
                    onClick={() => handleMarkRead(alert.id)}
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Alerts
