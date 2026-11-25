import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const mainMenu = [
  { to: '/dashboard', icon: 'bi-grid-1x2', label: 'Energy Overview' },
  { to: '/properties', icon: 'bi-building', label: 'Properties' },
  { to: '/readings', icon: 'bi-speedometer', label: 'Meter Readings' },
  { to: '/appliances', icon: 'bi-lightning-charge', label: 'Device Control' },
  { to: '/analytics', icon: 'bi-graph-up', label: 'Usage Insights' },
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
    <div className="dashboard-viewport">
      <div className="dashboard-shell">
        <aside className="dashboard-sidebar d-none d-lg-flex">
          <SidebarMenu />
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

        <main className="dashboard-main">
          <header className="dashboard-topbar">
            <button
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
    </div>
  )
}

export default DashboardLayout