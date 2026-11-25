import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { demoDaily, demoSummary } from '../data/demoData.js'

const features = [
  {
    icon: 'bi-speedometer2',
    title: 'Meter readings',
    text: 'Record electricity readings and see usage calculated over time.',
  },
  {
    icon: 'bi-plug',
    title: 'Appliance tracking',
    text: 'Keep an appliance inventory and estimate where energy is used.',
  },
  {
    icon: 'bi-receipt',
    title: 'Bill estimation',
    text: 'Configure your tariff and understand your estimated electricity bill.',
  },
  {
    icon: 'bi-bar-chart-line',
    title: 'Usage analytics',
    text: 'Explore daily, weekly and monthly consumption trends.',
  },
  {
    icon: 'bi-bell',
    title: 'Helpful alerts',
    text: 'Get notified about unusual usage and important account updates.',
  },
  {
    icon: 'bi-graph-up-arrow',
    title: 'Forecasting',
    text: 'Use your reading history to estimate upcoming energy consumption.',
  },
]

const steps = [
  { title: 'Add a property', text: 'Set up the home or facility you want to monitor.' },
  { title: 'Enter readings', text: 'Add meter readings and the appliances you use.' },
  { title: 'Understand usage', text: 'Use charts, estimates and recommendations to plan ahead.' },
]

function Landing() {
  const previewData = demoDaily.slice(0, 7)
  const maxUsage = Math.max(...previewData.map((item) => item.kwh))
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (pathname !== '/') return

    const frame = window.requestAnimationFrame(() => {
      if (hash) {
        document.getElementById(hash.slice(1))?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })

    return () => window.cancelAnimationFrame(frame)
  }, [pathname, hash])

  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-copy">
            <span className="landing-kicker">
              <i className="bi bi-lightning-charge-fill"></i>
              SMARTER ENERGY MANAGEMENT
            </span>
            <h1>Make every unit of energy <span>count.</span></h1>
            <p className="landing-description">
              Track electricity use, estimate bills and make confident decisions
              for your home or business with PowerSaver.
            </p>
            <div className="landing-actions">
              <Link to="/register" className="landing-primary-button">
                Get started <i className="bi bi-arrow-up-right"></i>
              </Link>
              <Link to="/login" className="landing-secondary-button">
                Sign in
              </Link>
            </div>
            <div className="landing-benefits">
              <span><i className="bi bi-check-circle-fill"></i> Usage insights</span>
              <span><i className="bi bi-check-circle-fill"></i> Bill estimates</span>
              <span><i className="bi bi-check-circle-fill"></i> One clear view</span>
            </div>
          </div>

          <div className="landing-preview-wrap">
            <div className="landing-preview-orbit orbit-one"></div>
            <div className="landing-preview-orbit orbit-two"></div>
            <article className="landing-preview">
              <header className="preview-header">
                <div className="preview-brand">
                  <span className="preview-brand-icon"><i className="bi bi-lightning-charge-fill"></i></span>
                  <span>
                    <strong>Energy overview</strong>
                    <small>Sample dashboard</small>
                  </span>
                </div>
                <span className="preview-status"><i></i> DEMO</span>
              </header>

              <div className="preview-welcome">
                <div>
                  <span>YOUR ENERGY AT A GLANCE</span>
                  <h2>Good energy starts with insight.</h2>
                </div>
                <i className="bi bi-three-dots"></i>
              </div>

              <div className="preview-metrics">
                <div className="preview-metric">
                  <span><i className="bi bi-lightning-charge"></i> TODAY</span>
                  <strong>{demoSummary.today}<small> kWh</small></strong>
                </div>
                <div className="preview-metric">
                  <span><i className="bi bi-calendar-week"></i> THIS WEEK</span>
                  <strong>{demoSummary.week}<small> kWh</small></strong>
                </div>
                <div className="preview-metric">
                  <span><i className="bi bi-receipt"></i> EST. BILL</span>
                  <strong>₹{demoSummary.bill.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <div className="preview-chart">
                <div className="preview-chart-heading">
                  <div>
                    <strong>Recent consumption</strong>
                    <small>Daily use · kWh</small>
                  </div>
                  <span>Last 7 readings <i className="bi bi-chevron-down"></i></span>
                </div>
                <div className="preview-bars" role="img" aria-label="Sample daily energy consumption chart">
                  {previewData.map((item, index) => (
                    <div className="preview-bar-column" key={item.day}>
                      <div className={`preview-bar ${index === 5 ? 'highlight' : ''}`} style={{ height: `${(item.kwh / maxUsage) * 100}%` }}></div>
                      <small>{item.day.replace('Day ', 'D')}</small>
                    </div>
                  ))}
                </div>
              </div>

              <footer className="preview-footer">
                <span><i className="bi bi-shield-check"></i> Sample values, not live meter data</span>
                <Link to="/register">Explore PowerSaver <i className="bi bi-arrow-right"></i></Link>
              </footer>
            </article>
          </div>
        </div>
        <a className="landing-scroll-cue" href="#features">
          Discover PowerSaver <i className="bi bi-arrow-down"></i>
        </a>
      </section>

      <section className="landing-features" id="features">
        <div className="landing-section-inner">
          <div className="landing-section-heading">
            <span>BUILT FOR CLARITY</span>
            <h2>Everything you need to understand your energy.</h2>
            <p>One simple place to track consumption, costs and the details behind them.</p>
          </div>
          <div className="landing-feature-grid">
            {features.map((feature, index) => (
              <article className="landing-feature-card" key={feature.title}>
                <span className="feature-icon"><i className={`bi ${feature.icon}`}></i></span>
                <span className="feature-index">0{index + 1}</span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-how" id="how-it-works">
        <div className="landing-section-inner">
          <div className="landing-section-heading">
            <span>GET STARTED IN THREE STEPS</span>
            <h2>From readings to a clearer picture.</h2>
          </div>
          <div className="landing-steps">
            {steps.map((step, index) => (
              <article className="landing-step" key={step.title}>
                <span className="step-number">0{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
                {index < steps.length - 1 && <i className="bi bi-arrow-right step-arrow"></i>}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-cta-inner">
          <div>
            <span>START WITH WHAT YOU KNOW</span>
            <h2>Your energy story starts here.</h2>
            <p>Create an account and add your first property to get started.</p>
          </div>
          <Link to="/register" className="landing-primary-button">
            Create a free account <i className="bi bi-arrow-up-right"></i>
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Landing
