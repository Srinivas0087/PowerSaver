import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="landing-footer">
      <div className="landing-footer-inner">
        <Link to="/" className="landing-brand">
          <span className="landing-brand-icon"><i className="bi bi-lightning-charge-fill"></i></span>
          <span>PowerSaver</span>
        </Link>
        <p>Electricity monitoring and analysis, made clearer.</p>
        <small>© PowerSaver · Energy insights for everyday decisions</small>
      </div>
    </footer>
  )
}

export default Footer