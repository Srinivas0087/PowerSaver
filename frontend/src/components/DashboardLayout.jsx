import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const menu = [
  { to: '/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
  { to: '/properties', icon: 'bi-building', label: 'Properties' },
  { to: '/readings', icon: 'bi-123', label: 'Meter Readings' },
  { to: '/appliances', icon: 'bi-plug-fill', label: 'Appliances' },
  { to: '/analytics', icon: 'bi-bar-chart-line-fill', label: 'Analytics' },
  { to: '/billing', icon: 'bi-receipt', label: 'Bill Estimation' },
  { to: '/alerts', icon: 'bi-bell-fill', label: 'Alerts' },
  { to: '/recommendations', icon: 'bi-lightbulb-fill', label: 'Recommendations' },
  { to: '/forecast', icon: 'bi-graph-up-arrow', label: 'Forecasting' },
  { to: '/profile', icon: 'bi-person-circle', label: 'Profile' },
]

function SidebarMenu() {
  return (
    <>
      <Link
        to="/"
        className="d-flex align-items-center text-white text-decoration-none fs-4 fw-bold mb-4 px-2"
      >
        <i className="bi bi-lightning-charge-fill text-success me-2"></i>
        PowerSaver
      </Link>
      <ul className="nav nav-pills flex-column">
        {menu.map((item) => (
          <li className="nav-item" key={item.to}>
            <NavLink className="nav-link" to={item.to}>
              <i className={`bi ${item.icon} me-2`}></i>
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
    <div className="container-fluid">
      <div className="row">
        {/* Sidebar: always visible on large screens */}
        <aside className="col-lg-2 d-none d-lg-block ps-sidebar p-3">
          <SidebarMenu />
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
        <div className="col-12 col-lg-10 p-0">
          <div className="ps-topbar d-flex align-items-center justify-content-between px-3 py-2">
            <button
              className="btn btn-outline-secondary d-lg-none"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#mobileSidebar"
              aria-label="Open menu"
            >
              <i className="bi bi-list"></i>
            </button>
            <span className="fw-semibold ms-2">
              <i className="bi bi-person-circle me-1"></i>
              {user?.full_name || user?.username}
            </span>
            <button className="btn btn-sm btn-outline-secondary" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-1"></i>
              Logout
            </button>
          </div>

          <div className="p-3 p-md-4">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout