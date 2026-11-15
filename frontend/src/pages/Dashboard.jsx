import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

import StatCard from '../components/StatCard.jsx'
import {
  demoSummary, demoDaily, demoWeekly, demoMonthly, demoAppliances,
} from '../data/demoData.js'

const PIE_COLORS = ['#16a34a', '#0b2447', '#4ade80', '#19376d', '#94a3b8']

function Dashboard() {
  const change = (
    ((demoSummary.month - demoSummary.lastMonth) / demoSummary.lastMonth) * 100
  ).toFixed(1)

  return (
    <>
      <h2 className="fw-bold mb-3">Dashboard</h2>

      <div className="alert alert-warning">
        <i className="bi bi-info-circle-fill me-2"></i>
        <strong>Demonstration data:</strong> these numbers are not from your account.
        Real data appears after the backend is connected (Phase 9).
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-4">
          <StatCard icon="bi-lightning-charge" label="Total consumption" value={`${demoSummary.total} kWh`} />
        </div>
        <div className="col-12 col-sm-6 col-xl-4">
          <StatCard icon="bi-sun" label="Today" value={`${demoSummary.today} kWh`} />
        </div>
        <div className="col-12 col-sm-6 col-xl-4">
          <StatCard icon="bi-calendar-week" label="This week" value={`${demoSummary.week} kWh`} />
        </div>
        <div className="col-12 col-sm-6 col-xl-4">
          <StatCard icon="bi-calendar-month" label="This month" value={`${demoSummary.month} kWh`} />
        </div>
        <div className="col-12 col-sm-6 col-xl-4">
          <StatCard icon="bi-receipt" label="Estimated bill" value={`₹${demoSummary.bill}`} note="Estimate only" />
        </div>
        <div className="col-12 col-sm-6 col-xl-4">
          <StatCard
            icon="bi-arrow-left-right"
            label="Vs previous month"
            value={`${change > 0 ? '+' : ''}${change}%`}
            note={`Previous: ${demoSummary.lastMonth} kWh`}
          />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-8">
          <div className="card ps-card h-100">
            <div className="card-body">
              <h5 className="fw-bold">Daily consumption (kWh)</h5>
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <LineChart data={demoDaily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="kwh" stroke="#16a34a" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card ps-card h-100">
            <div className="card-body">
              <h5 className="fw-bold">Appliance usage (estimated)</h5>
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={demoAppliances} dataKey="value" nameKey="name" outerRadius={85}>
                      {demoAppliances.map((item, index) => (
                        <Cell key={item.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card ps-card h-100">
            <div className="card-body">
              <h5 className="fw-bold">Weekly consumption (kWh)</h5>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={demoWeekly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="kwh" fill="#0b2447" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card ps-card h-100">
            <div className="card-body">
              <h5 className="fw-bold">Monthly consumption (kWh)</h5>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={demoMonthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="kwh" fill="#16a34a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard