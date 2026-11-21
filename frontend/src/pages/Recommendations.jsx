
import { useEffect, useState } from 'react'
import {
  listRecommendations,
  generateNotifications,
} from '../services/notificationService.js'

function Recommendations() {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)

  async function loadRecommendations() {
    try {
      setError('')
      const data = await listRecommendations()
      setRecommendations(
        Array.isArray(data) ? data : data.results || []
      )
    } catch (err) {
      setError('Unable to load recommendations. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecommendations()
  }, [])

  async function handleGenerate() {
    try {
      setGenerating(true)
      setError('')

      const result = await generateNotifications()
      await loadRecommendations()

      window.alert(
        `Generated ${result.recommendations_created} recommendations.`
      )
    } catch (err) {
      setError('Unable to generate recommendations.')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="container-fluid p-4">
        Loading recommendations...
      </div>
    )
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1">Energy Saving Recommendations</h2>
          <p className="text-muted mb-0">
            Practical tips to reduce your electricity consumption.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? 'Generating...' : 'Generate Recommendations'}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <p className="text-muted mb-1">
                Total Recommendations
              </p>
              <h3 className="fw-bold">
                {recommendations.length}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <h5>No recommendations available</h5>
            <p className="text-muted mb-0">
              Add appliances and generate recommendations to see
              energy-saving suggestions.
            </p>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {recommendations.map(item => (
            <div className="col-md-6 col-lg-4" key={item.id}>
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                    <h5 className="fw-bold mb-0">
                      {item.title}
                    </h5>

                    <span
                      className={`badge ${
                        item.priority === 'HIGH'
                          ? 'bg-danger'
                          : item.priority === 'MEDIUM'
                          ? 'bg-warning text-dark'
                          : 'bg-success'
                      }`}
                    >
                      {item.priority_display}
                    </span>
                  </div>

                  <p>{item.message}</p>

                  <div className="bg-light rounded p-3 mb-3">
                    <strong className="d-block mb-1">
                      Why this recommendation?
                    </strong>
                    <small className="text-muted">
                      {item.reason}
                    </small>
                  </div>

                  <small className="text-muted">
                    Property: {item.property_name}
                  </small>
                  <br />
                  <small className="text-muted">
                    Created: {new Date(item.created_at).toLocaleString()}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Recommendations
