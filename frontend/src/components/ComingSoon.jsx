function ComingSoon({ title, phase }) {
  return (
    <div className="card ps-card">
      <div className="card-body text-center py-5">
        <h3 className="fw-bold">{title}</h3>
        <p className="text-muted mb-0">This page will be built in {phase}.</p>
      </div>
    </div>
  )
}

export default ComingSoon