
function StatCard({ icon, label, value, note }) {
  return (
    <div className="ps-stat-card h-100">
      <div className="ps-stat-card-top">
        <div className="ps-stat-icon">
          <i className={`bi ${icon}`}></i>
        </div>

        <span className="ps-stat-card-indicator">
          <i className="bi bi-lightning-charge"></i>
        </span>
      </div>

      <div className="ps-stat-label">{label}</div>

      <div className="ps-stat-value">{value}</div>

      {note && (
        <div className="ps-stat-note">
          {note}
        </div>
      )}
    </div>
  )
}

export default StatCard
