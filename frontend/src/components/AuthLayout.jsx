function AuthLayout({ icon, title, subtitle, children }) {
  return (
    <div className="ps-auth-wrapper">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-5">
            <div className="card ps-auth-card p-3 p-md-4">
              <div className="card-body">
                <div className="ps-auth-icon mx-auto mb-3">
                  <i className={`bi ${icon}`}></i>
                </div>
                <h2 className="text-center fw-bold">{title}</h2>
                <p className="text-center text-muted mb-4">{subtitle}</p>
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout