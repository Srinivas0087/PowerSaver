
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

<<<<<<< HEAD
const mainMenu = [
  { to: '/dashboard', icon: 'bi-grid-1x2', label: 'Energy Overview' },
  { to: '/properties', icon: 'bi-building', label: 'Properties' },
  { to: '/readings', icon: 'bi-speedometer', label: 'Meter Readings' },
  { to: '/appliances', icon: 'bi-lightning-charge', label: 'Device Control' },
  { to: '/analytics', icon: 'bi-graph-up', label: 'Usage Insights' },
=======
const menu = [
  { to: '/dashboard', icon: 'bi-grid-1x2', label: 'Energy Overview' },
  { to: '/appliances', icon: 'bi-lightning-charge', label: 'Device Control' },
  { to: '/analytics', icon: 'bi-graph-up', label: 'Usage Insights' },
  { to: '/billing', icon: 'bi-receipt', label: 'Billing' },
]

const accountMenu = [
  { to: '/profile', icon: 'bi-gear', label: 'Settings' },
  { to: '/alerts', icon: 'bi-question-circle', label: 'Support' },
>>>>>>> 8ef158703e71b152a74c6ccdfcc7f793fe4020be
]

const accountMenu = [
  { to: '/billing', icon: 'bi-receipt', label: 'Bill Estimation' },
  { to: '/alerts', icon: 'bi-bell', label: 'Alerts' },
  { to: '/recommendations', icon: 'bi-lightbulb', label: 'Recommendations' },
  { to: '/forecast', icon: 'bi-graph-up-arrow', label: 'Forecasting' },
  { to: '/profile', icon: 'bi-gear', label: 'Settings' },
]

function SidebarMenu({ onNavigate }) {
  function renderItems(items) {
    return items.map((item) => (
      <li key={item.to}>
        <NavLink
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <i className={`bi ${item.icon}`}></i>
          <span>{item.label}</span>
        </NavLink>
      </li>
    ))
  }

  return (
    <>
<<<<<<< HEAD
      <Link to="/dashboard" className="brand-link" onClick={onNavigate}>
        <span className="brand-mark"><i className="bi bi-lightning-charge-fill"></i></span>
        <span>PowerSaver</span>
      </Link>
      <div className="sidebar-group-label">MENU</div>
      <ul className="sidebar-nav">{renderItems(mainMenu)}</ul>
      <div className="sidebar-group-label account-label">ACCOUNT</div>
      <ul className="sidebar-nav">{renderItems(accountMenu)}</ul>
      <div className="sidebar-promo">
        <strong>PowerSaver Plus</strong>
        <p>Smarter insights for your energy use.</p>
        <Link to="/recommendations" onClick={onNavigate}>Explore tips</Link>
      </div>
=======
      <Link
        to="/"
        className="brand-link"
      >
        <span className="brand-mark"><i className="bi bi-lightning-charge-fill"></i></span>
        <span>EcoSync</span>
      </Link>
      <div className="sidebar-group-label">MENU</div>
      <ul className="nav sidebar-nav flex-column">
        {menu.map((item) => (
          <li className="nav-item" key={item.to}>
            <NavLink className="nav-link" to={item.to}>
              <i className={`bi ${item.icon}`}></i>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="sidebar-group-label account-label">ACCOUNT</div>
      <ul className="nav sidebar-nav flex-column">
        {accountMenu.map((item) => (
          <li className="nav-item" key={item.to}>
            <NavLink className="nav-link" to={item.to}>
              <i className={`bi ${item.icon}`}></i>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
>>>>>>> 8ef158703e71b152a74c6ccdfcc7f793fe4020be
    </>
  )
}

function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  function closeMobileSidebar() {
    const sidebar = document.getElementById('mobileSidebar')
    if (sidebar) {
      window.bootstrap?.Offcanvas
        ?.getInstance(sidebar)
        ?.hide()
    }
  }

  return (
<<<<<<< HEAD
    <div className="dashboard-viewport">
      <div className="dashboard-shell">
        <aside className="dashboard-sidebar d-none d-lg-flex">
=======
    <div className="dashboard-shell">
        {/* Sidebar: always visible on large screens */}
        <aside className="ps-sidebar d-none d-lg-flex">
>>>>>>> 8ef158703e71b152a74c6ccdfcc7f793fe4020be
          <SidebarMenu />
          <div className="sidebar-promo">
            <div className="promo-title">EcoSync Pro</div>
            <p>Upgrade for smarter AI automation</p>
            <button type="button">Get Pro</button>
          </div>
        </aside>

        <div
          className="offcanvas offcanvas-start dashboard-mobile-sidebar"
          tabIndex="-1"
          id="mobileSidebar"
          aria-label="Main navigation"
        >
          <div className="offcanvas-header">
            <button
              type="button"
              className="btn-close ms-auto"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            ></button>
          </div>
          <div className="offcanvas-body pt-0">
            <SidebarMenu onNavigate={closeMobileSidebar} />
          </div>
        </div>

<<<<<<< HEAD
        <main className="dashboard-main">
          <header className="dashboard-topbar">
            <button
=======
        {/* Main area */}
        <div className="dashboard-main">
          <div className="ps-topbar">
            <button
              className="mobile-menu-button d-lg-none"
>>>>>>> 8ef158703e71b152a74c6ccdfcc7f793fe4020be
              type="button"
              className="mobile-menu-button d-lg-none"
              data-bs-toggle="offcanvas"
              data-bs-target="#mobileSidebar"
              aria-label="Open navigation menu"
            >
              <i className="bi bi-list"></i>
            </button>
            <label className="dashboard-search">
              <i className="bi bi-search"></i>
              <input type="search" placeholder="Search devices or metrics..." />
            </label>
            <div className="topbar-actions">
<<<<<<< HEAD
              <Link to="/alerts" className="topbar-icon" aria-label="Notifications">
                <i className="bi bi-bell"></i>
              </Link>
              <Link to="/profile" className="user-menu">
                <span>
                  <strong>{user?.full_name || user?.username || 'Account'}</strong>
                  <small>PowerSaver user</small>
                </span>
                <span className="user-avatar">
                  {(user?.full_name || user?.username || 'PS').slice(0, 2).toUpperCase()}
                </span>
              </Link>
              <button className="logout-button" onClick={handleLogout} type="button" aria-label="Logout">
                <i className="bi bi-box-arrow-right"></i>
              </button>
            </div>
          </header>

          <div className="dashboard-content">
            <Outlet />
          </div>
        </main>
      </div>
=======
              <button type="button" className="topbar-icon" aria-label="Theme">
                <i className="bi bi-moon"></i>
              </button>
              <button type="button" className="topbar-icon notification-button" aria-label="Notifications">
                <i className="bi bi-bell"></i>
              </button>
              <Link to="/profile" className="user-menu">
                <span>
                  <strong>{user?.full_name || user?.username || 'Julian Rivera'}</strong>
                  <small>Family Owner</small>
                </span>
                <span className="user-avatar">{(user?.full_name || user?.username || 'JR').slice(0, 2).toUpperCase()}</span>
              </Link>
              <button type="button" className="logout-button" onClick={handleLogout} aria-label="Logout">
                <i className="bi bi-box-arrow-right"></i>
              </button>
            </div>
          </div>

          <main className="dashboard-content">
            <Outlet />
          </main>
        </div>
>>>>>>> 8ef158703e71b152a74c6ccdfcc7f793fe4020be
    </div>
  )
}

export default DashboardLayout
