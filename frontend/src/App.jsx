
import { Routes, Route, Outlet } from 'react-router-dom'

import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import DashboardLayout from './components/DashboardLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ComingSoon from './components/ComingSoon.jsx'

import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import NotFound from './pages/NotFound.jsx'

import Dashboard from './pages/Dashboard.jsx'
import Properties from './pages/Properties.jsx'
import Readings from './pages/Readings.jsx'
import Appliances from './pages/Appliances.jsx'
import Analytics from './pages/Analytics.jsx'
import Billing from './pages/Billing.jsx'
import Alerts from './pages/Alerts.jsx'
import Recommendations from './pages/Recommendations.jsx'
import Forecast from './pages/Forecast.jsx'
import Profile from './pages/Profile.jsx'

function PublicLayout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />

      <main className="flex-grow-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}

function App() {
  return (
    <Routes>

      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Protected Dashboard Pages */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          {/* Property Management */}
          <Route
            path="/properties"
            element={<Properties />}
          />

          {/* Electricity Readings */}
          <Route
            path="/readings"
            element={<Readings />}
          />

          {/* Phase 16: Appliance Management */}
          <Route
            path="/appliances"
            element={<Appliances />}
          />

          {/* Analytics */}
          <Route
            path="/analytics"
            element={<Analytics />}
          />

          {/* Phase 12: Bill Estimation */}
          <Route
            path="/billing"
            element={<Billing />}
          />

          {/* Phase 14: Alerts */}
          <Route
            path="/alerts"
            element={<Alerts />}
          />

          {/* Phase 14: Recommendations */}
          <Route
            path="/recommendations"
            element={<Recommendations />}
          />

          {/* Phase 15: Historical Comparison and Forecasting */}
          <Route
            path="/forecast"
            element={<Forecast />}
          />

          {/* Phase 9: User Profile */}
          <Route
            path="/profile"
            element={<Profile />}
          />

        </Route>
      </Route>

    </Routes>
  )
}

export default App
