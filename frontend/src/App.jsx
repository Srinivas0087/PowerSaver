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
import Billing from './pages/Billing.jsx'

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
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/readings" element={<Readings />} />
          <Route path="/appliances" element={<Appliances />} />
          <Route path="/analytics" element={<ComingSoon title="Consumption Analytics" phase="Phase 13" />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/alerts" element={<ComingSoon title="Alerts and Notifications" phase="Phase 14" />} />
          <Route path="/recommendations" element={<ComingSoon title="Energy Saving Recommendations" phase="Phase 14" />} />
          <Route path="/forecast" element={<ComingSoon title="Historical Comparison and Forecasting" phase="Phase 15" />} />
          <Route path="/profile" element={<ComingSoon title="User Profile" phase="Phase 9" />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App