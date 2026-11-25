import { Link } from 'react-router-dom'
import SocialAuthButtons from './SocialAuthButtons.jsx'

const benefits = [
  { icon: 'bi-speedometer2', text: 'Usage in one clear view' },
  { icon: 'bi-receipt', text: 'Understand estimated costs' },
  { icon: 'bi-graph-up-arrow', text: 'Spot trends over time' },
]

function AuthLayout({ icon, title, subtitle, mode = 'login', children }) {
  const isRegister = mode === 'register'

  return (
    <div className={`auth-page auth-page-${mode}`}>
      <div className="auth-layout">
        <aside className="auth-intro">
          <Link className="auth-brand" to="/">
            <span className="auth-brand-icon"><i className="bi bi-lightning-charge-fill"></i></span>
            <span>PowerSaver</span>
          </Link>

          <div className="auth-intro-copy">
            <span className="auth-eyebrow">
              {isRegister ? 'START WITH A CLEARER VIEW' : 'WELCOME BACK'}
            </span>
            <h1>
              {isRegister
                ? 'Make everyday energy easier to understand.'
                : 'Your energy picture, all in one place.'}
            </h1>
            <p>
              {isRegister
                ? 'Bring readings, appliances and estimated costs together in one simple workspace.'
                : 'Sign in to review your readings, explore usage trends and plan with confidence.'}
            </p>

            <ul className="auth-benefits">
              {benefits.map((benefit) => (
                <li key={benefit.text}>
                  <i className={`bi ${benefit.icon}`} aria-hidden="true"></i>
                  <span>{benefit.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="auth-highlight">
            <span className="auth-highlight-icon">
              <i className="bi bi-lightning-charge-fill" aria-hidden="true"></i>
            </span>
            <span>
              <strong>Built for everyday decisions</strong>
              <small>Start with a property and a meter reading.</small>
            </span>
          </div>
        </aside>

        <section className="auth-form-panel" aria-labelledby="auth-title">
          <div className="auth-form-content">
            <header className="auth-form-heading">
              <span className="auth-form-icon">
                <i className={`bi ${icon}`} aria-hidden="true"></i>
              </span>
              <h2 id="auth-title">{title}</h2>
              <p>{subtitle}</p>
            </header>
            <SocialAuthButtons mode={mode} />
            {children}
          </div>
        </section>
      </div>
    </div>
  )
}

export default AuthLayout
