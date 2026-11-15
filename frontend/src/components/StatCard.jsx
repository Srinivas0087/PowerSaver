function StatCard({ icon, label, value, note }) {
  return (
    <div className="card ps-card h-100">
      <div className="card-body d-flex align-items-center gap-3">
        <div className="ps-stat-icon">
          <i className={`bi ${icon}`}></i>
        </div>
        <div>
          <div className="text-muted small">{label}</div>
          <div className="fs-4 fw-bold">{value}</div>
          {note && <div className="small text-muted">{note}</div>}
        </div>
      </div>
    </div>
  )
}

export default StatCard