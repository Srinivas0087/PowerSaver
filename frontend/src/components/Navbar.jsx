import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function closeMobileNavigation(onClosed) {
    const collapseElement = document.getElementById('mainNav')
    const toggleButton = document.querySelector('.landing-nav-toggle')

    if (!collapseElement || !toggleButton) {
      onClosed()
      return
    }

    const hideNavigation = () => {
      if (!collapseElement.classList.contains('show')) {
        onClosed()
        return
      }

      collapseElement.addEventListener('hidden.bs.collapse', onClosed, { once: true })
      toggleButton.click()
    }

    if (collapseElement.classList.contains('collapsing')) {
      const isOpening = toggleButton.getAttribute('aria-expanded') === 'true'
      const eventName = isOpening ? 'shown.bs.collapse' : 'hidden.bs.collapse'
      collapseElement.addEventListener(
        eventName,
        isOpening ? hideNavigation : onClosed,
        { once: true },
      )
      return
    }

    hideNavigation()
  }

  function handleHomeNavigation() {
    closeMobileNavigation(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  }

  function handleSectionNavigation(sectionId) {
    closeMobileNavigation(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <nav className="navbar navbar-expand-lg landing-nav sticky-top">
      <div className="landing-nav-inner container">
        <Link className="navbar-brand landing-brand" to="/" onClick={handleHomeNavigation}>
          <span className="landing-brand-icon"><i className="bi bi-lightning-charge-fill"></i></span>
          <span>PowerSaver</span>
        </Link>

        <button
          className="navbar-toggler landing-nav-toggle"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-3">
            <li className="nav-item">
              <NavLink className="nav-link" to="/" end onClick={handleHomeNavigation}>
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/#features" onClick={() => handleSectionNavigation('features')}>
                Features
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/#how-it-works" onClick={() => handleSectionNavigation('how-it-works')}>
                How it works
              </Link>
            </li>

            {user ? (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/dashboard">
                    Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <button className="landing-nav-logout" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/login">
                    Login
                  </NavLink>
                </li>
                <li className="nav-item">
                  <Link className="landing-nav-cta" to="/register">
                    Get Started
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default Navbar