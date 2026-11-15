import { Link } from 'react-router-dom'

const features = [
  {
    icon: 'bi-speedometer2',
    title: 'Meter Readings',
    text: 'Enter meter readings and see your consumption calculated automatically.',
  },
  {
    icon: 'bi-plug-fill',
    title: 'Appliance Inventory',
    text: 'List your appliances and estimate how much electricity each one uses.',
  },
  {
    icon: 'bi-receipt',
    title: 'Bill Estimation',
    text: 'Set your own tariff rates and estimate your electricity bill.',
  },
  {
    icon: 'bi-bar-chart-line-fill',
    title: 'Analytics Charts',
    text: 'Daily, weekly and monthly charts to understand your usage.',
  },
  {
    icon: 'bi-bell-fill',
    title: 'Smart Alerts',
    text: 'Get warned when your consumption suddenly rises or crosses your limit.',
  },
  {
    icon: 'bi-graph-up-arrow',
    title: 'Forecasting',
    text: 'Statistical forecasts based on your own history, with limitations explained.',
  },
]

const steps = [
  { title: 'Add your property', text: 'Home, hotel, small business or commercial facility.' },
  { title: 'Enter your readings', text: 'Add meter readings and appliances.' },
  { title: 'Save electricity', text: 'Follow the charts, alerts and recommendations.' },
]

function Landing() {
  return (
    <>
      <section className="ps-hero">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-7 text-center text-lg-start">
              <h1 className="display-4 fw-bold">
                Understand and reduce your <span className="text-success">electricity</span> usage
              </h1>
              <p className="lead mt-3">
                PowerSaver helps households, hotels, small businesses and facility managers
                monitor consumption, estimate bills and find ways to save energy.
              </p>
              <div className="mt-4 d-flex gap-3 justify-content-center justify-content-lg-start">
                <Link to="/register" className="btn btn-ps btn-lg">
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-outline-light btn-lg">
                  Login
                </Link>
              </div>
            </div>
            <div className="col-lg-5 text-center d-none d-lg-block">
              <i className="bi bi-lightning-charge-fill ps-hero-icon"></i>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-5">
        <h2 className="text-center fw-bold mb-2">What PowerSaver can do</h2>
        <p className="text-center text-muted mb-5">
          Everything you need to track and understand your electricity usage.
        </p>
        <div className="row g-4">
          {features.map((feature) => (
            <div className="col-12 col-md-6 col-lg-4" key={feature.title}>
              <div className="card ps-card h-100 p-3">
                <div className="card-body">
                  <div className="ps-feature-icon mb-3">
                    <i className={`bi ${feature.icon}`}></i>
                  </div>
                  <h5 className="fw-bold">{feature.title}</h5>
                  <p className="text-muted mb-0">{feature.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-5">
        <div className="container">
          <h2 className="text-center fw-bold mb-5">How it works</h2>
          <div className="row g-4">
            {steps.map((step, index) => (
              <div className="col-12 col-md-4 text-center" key={step.title}>
                <div className="ps-step-number mx-auto mb-3">{index + 1}</div>
                <h5 className="fw-bold">{step.title}</h5>
                <p className="text-muted">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-5 text-center">
        <h2 className="fw-bold">Ready to start saving?</h2>
        <p className="text-muted">Create a free account and add your first property.</p>
        <Link to="/register" className="btn btn-ps btn-lg">
          Create an Account
        </Link>
      </section>
    </>
  )
}

export default Landing