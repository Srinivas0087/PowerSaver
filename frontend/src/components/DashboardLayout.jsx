import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const menu = [
  { to: '/dashboard', icon: 'bi-grid-1x2', label: 'Energy Overview' },
  { to: '/appliances', icon: 'bi-lightning-charge', label: 'Device Control' },
  { to: '/analytics', icon: 'bi-graph-up', label: 'Usage Insights' },
  { to: '/billing', icon: 'bi-receipt', label: 'Billing' },
]

const accountMenu = [
  { to: '/profile', icon: 'bi-gear', label: 'Settings' },
  { to: '/alerts', icon: 'bi-question-circle', label: 'Support' },
]

function SidebarMenu() {
  return (
    <>
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

  return (
    <div className="dashboard-shell">
        {/* Sidebar: always visible on large screens */}
        <aside className="ps-sidebar d-none d-lg-flex">
          <SidebarMenu />
          <div className="sidebar-promo">
            <div className="promo-title">EcoSync Pro</div>
            <p>Upgrade for smarter AI automation</p>
            <button type="button">Get Pro</button>
          </div>
        </aside>

        {/* Slide-out sidebar for phones and tablets */}
        <div
          className="offcanvas offcanvas-start ps-sidebar"
          tabIndex="-1"
          id="mobileSidebar"
          style={{ width: '260px' }}
        >
          <div className="offcanvas-header">
            <button
              type="button"
              className="btn-close btn-close-white ms-auto"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            ></button>
          </div>
          <div className="offcanvas-body pt-0" data-bs-dismiss="offcanvas">
            <SidebarMenu />
          </div>
        </div>

        {/* Main area */}
        <div className="dashboard-main">
          <div className="ps-topbar">
            <button
              className="mobile-menu-button d-lg-none"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#mobileSidebar"
              aria-label="Open menu"
            >
              <i className="bi bi-list"></i>
            </button>
            <label className="dashboard-search">
              <i className="bi bi-search"></i>
              <input type="search" placeholder="Search devices or metrics..." />
            </label>
            <div className="topbar-actions">
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
    </div>
  )
}

export default DashboardLayout