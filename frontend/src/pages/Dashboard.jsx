<<<<<<< HEAD
import { Link } from 'react-router-dom'
import {
  demoAppliances,
  demoDaily,
  demoSummary,
} from '../data/demoData.js'

const applianceIcons = [
  'bi-snow',
  'bi-box-seam',
  'bi-lightbulb',
  'bi-fan',
]

function Dashboard() {
  const change = (
    ((demoSummary.month - demoSummary.lastMonth) / demoSummary.lastMonth) * 100
  ).toFixed(1)
  const changeMagnitude = Math.min(Math.abs(Number(change)), 100)
  const dailyUsage = demoDaily.slice(0, 7)
  const maxDailyUsage = Math.max(...dailyUsage.map((item) => item.kwh))
  const appliances = demoAppliances.slice(0, 4)
  const maxApplianceUsage = Math.max(...appliances.map((item) => item.value))
=======
function Dashboard() {
  const usage = [
    { day: 'MON', value: 40 },
    { day: 'TUE', value: 100 },
    { day: 'WED', value: 68 },
    { day: 'THU', value: 100 },
    { day: 'FRI', value: 75 },
    { day: 'SAT', value: 45 },
    { day: 'SUN', value: 84 },
  ]
  const devices = [
    { name: 'HVAC System', detail: 'Heating & Cooling', icon: 'bi-grid', active: true },
    { name: 'Smart Fridge', detail: 'Energy Efficient', icon: 'bi-snow', active: true },
    { name: 'Smart Devices', detail: 'Eco Mode - Home', icon: 'bi-laptop', active: true },
    { name: 'EV Charger', detail: 'Disconnected', icon: 'bi-battery-charging', active: false },
  ]
>>>>>>> 8ef158703e71b152a74c6ccdfcc7f793fe4020be

  return (
    <div className="energy-dashboard">
      <header className="dashboard-heading">
        <div>
          <h1>Energy Dashboard</h1>
<<<<<<< HEAD
          <p>Monitor household electricity use · Sample figures for preview only</p>
        </div>
        <div className="heading-actions">
          <Link to="/appliances" className="add-device-button">
            <i className="bi bi-plus"></i> Add Appliance
          </Link>
          <button type="button" className="export-button" onClick={() => window.print()}>
            Export Report
          </button>
        </div>
      </header>

      <section className="metric-grid" aria-label="Energy summary">
        <article className="metric-card metric-primary">
          <div className="metric-label">Total Consumption <i className="bi bi-lightning-charge"></i></div>
          <div className="metric-value">{demoSummary.total.toLocaleString('en-IN')} <span>kWh</span></div>
          <div className="metric-note">Overall estimated usage</div>
        </article>
        <article className="metric-card">
          <div className="metric-label">Today's Consumption <i className="bi bi-sun"></i></div>
          <div className="metric-value">{demoSummary.today} <span>kWh</span></div>
          <div className="metric-note">Estimated daily usage</div>
        </article>
        <article className="metric-card">
          <div className="metric-label">This Week <i className="bi bi-calendar-week"></i></div>
          <div className="metric-value">{demoSummary.week} <span>kWh</span></div>
          <div className="metric-note">Estimated weekly usage</div>
        </article>
        <article className="metric-card">
          <div className="metric-label">Estimated Bill <i className="bi bi-receipt"></i></div>
          <div className="metric-value">₹{demoSummary.bill.toLocaleString('en-IN')}</div>
          <div className="metric-note">Estimate only</div>
        </article>
      </section>

      <section className="dashboard-grid" aria-label="Consumption insights">
        <article className="panel savings-panel">
          <header className="panel-header">
            <div>
              <h2>Monthly Comparison</h2>
              <p>Compared with last month</p>
            </div>
            <i className="bi bi-three-dots"></i>
          </header>
          <div
            className={`savings-ring ${Number(change) > 0 ? 'ring-warning' : ''}`}
            style={{ '--ring-value': `${changeMagnitude}%` }}
            role="img"
            aria-label={`${change}% change from last month`}
          >
            <div className="ring-inner">
              <strong>{Number(change) > 0 ? '+' : ''}{change}%</strong>
              <span>VS LAST MONTH</span>
            </div>
          </div>
          <div className="comparison-legend">
            <span><i className="legend-dot current"></i>This month</span>
            <strong>{demoSummary.month} kWh</strong>
          </div>
          <div className="comparison-legend">
            <span><i className="legend-dot previous"></i>Last month</span>
            <strong>{demoSummary.lastMonth} kWh</strong>
          </div>
        </article>

        <article className="panel usage-panel">
          <header className="panel-header">
            <div>
              <h2>Daily Consumption</h2>
              <p>Estimated power use in kWh</p>
            </div>
            <span className="period-button">Last 7 readings <i className="bi bi-chevron-down"></i></span>
          </header>
          <div className="usage-chart" role="img" aria-label="Bar chart of recent daily consumption">
            {dailyUsage.map((item, index) => (
              <div className="usage-column" key={item.day}>
                {index === 5 && <span className="usage-tooltip">{item.kwh} kWh</span>}
                <div className="usage-track">
                  <div
                    className={`usage-bar ${index === 5 ? 'dark' : ''}`}
                    style={{ height: `${(item.kwh / maxDailyUsage) * 100}%` }}
                  ></div>
                </div>
                <span className="usage-day">{item.day.replace('Day ', 'D')}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel appliances-panel">
          <header className="panel-header">
            <h2>Appliance Usage</h2>
            <Link to="/appliances" className="manage-button">Manage All</Link>
          </header>
          <div className="appliance-list">
            {appliances.map((item, index) => (
              <div className="appliance-row" key={item.name}>
                <span className="appliance-icon">
                  <i className={`bi ${applianceIcons[index]}`}></i>
                </span>
                <span className="appliance-copy">
                  <strong>{item.name}</strong>
                  <small>Estimated monthly use</small>
                </span>
                <span className="appliance-amount">{item.value} kWh</span>
                <span className="appliance-meter">
                  <span style={{ width: `${(item.value / maxApplianceUsage) * 100}%` }}></span>
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel energy-outlook">
          <div className="outlook-heading">
            <div>
              <h2>Monthly Energy Outlook</h2>
              <p>Estimated household usage</p>
            </div>
            <span className="outlook-badge">DEMO DATA</span>
          </div>
          <div className="outlook-stats">
            <div>
              <small>THIS MONTH</small>
              <strong>{demoSummary.month} <span>kWh</span></strong>
            </div>
            <div>
              <small>ESTIMATED BILL</small>
              <strong>₹{demoSummary.bill.toLocaleString('en-IN')}</strong>
            </div>
          </div>
          <footer>
            <Link to="/analytics">View Usage Insights</Link>
            <i className="bi bi-arrow-up-right-circle"></i>
=======
          <p>Monitor and optimize your renewable energy flow in real-time.</p>
        </div>
        <div className="heading-actions">
          <button type="button" className="add-device-button"><i className="bi bi-plus"></i> Add Device</button>
          <button type="button" className="export-button">Export Report</button>
        </div>
      </header>

      <section className="metric-grid">
        <article className="metric-card metric-primary">
          <div className="metric-label">Total Power Generated <i className="bi bi-arrow-up-right"></i></div>
          <div className="metric-value">452.8 <span>kWh</span></div>
          <div className="metric-note"><i className="bi bi-arrow-up-right"></i> 12% more than last week</div>
        </article>
        <article className="metric-card">
          <div className="metric-label">Current Consumption <i className="bi bi-lightning-charge"></i></div>
          <div className="metric-value">2.4 <span>kW</span></div>
          <div className="metric-note warning"><i className="bi bi-exclamation-circle"></i> Peak usage detected</div>
        </article>
        <article className="metric-card">
          <div className="metric-label">Battery Storage Level <i className="bi bi-battery-half"></i></div>
          <div className="metric-value">84 <span>%</span></div>
          <div className="metric-note"><i className="bi bi-check-circle"></i> Charging optimally</div>
        </article>
        <article className="metric-card">
          <div className="metric-label">Grid Status <i className="bi bi-grid"></i></div>
          <div className="metric-value status-value">Online</div>
          <div className="metric-note"><i className="bi bi-clock"></i> Last sync: 2 min ago</div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel savings-panel">
          <header className="panel-header">
            <h2>Savings Progress</h2>
            <button type="button" aria-label="More options"><i className="bi bi-three-dots"></i></button>
          </header>
          <div className="savings-ring">
            <div className="ring-inner">
              <strong>67%</strong>
              <span>GOAL REACHED</span>
            </div>
          </div>
          <div className="savings-legend">
            <div><span><i className="legend-dot eco"></i>Eco Generated</span><strong>$124.50</strong></div>
            <div><span><i className="legend-dot grid"></i>Grid Savings</span><strong>$42.10</strong></div>
          </div>
        </article>

        <article className="panel usage-panel">
          <header className="panel-header">
            <div>
              <h2>Real-time Usage</h2>
              <p>Power consumption (kWh)</p>
            </div>
            <button type="button" className="period-button">Last 24 Hours <i className="bi bi-chevron-down"></i></button>
          </header>
          <div className="usage-chart">
            {usage.map((item) => (
              <div className="usage-column" key={item.day}>
                {item.day === 'TUE' && <span className="usage-tooltip">3.2kW</span>}
                <div className="usage-track">
                  <div className={item.day === 'MON' || item.day === 'THU' || item.day === 'SUN' ? 'usage-bar dark' : 'usage-bar'} style={{ height: `${item.value}%` }}></div>
                </div>
                <span className="usage-day">{item.day}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel devices-panel">
          <header className="panel-header">
            <h2>Smart Devices</h2>
            <button type="button" className="manage-button">Manage All</button>
          </header>
          <div className="device-grid">
            {devices.map((device) => (
              <div className="device-row" key={device.name}>
                <span className="device-icon"><i className={`bi ${device.icon}`}></i></span>
                <span className="device-copy"><strong>{device.name}</strong><small>{device.detail}</small></span>
                <button type="button" className={`device-toggle ${device.active ? 'active' : ''}`} aria-label={`Toggle ${device.name}`}>
                  <span></span>
                </button>
              </div>
            ))}
          </div>
        </article>

        <article className="panel carbon-panel">
          <div className="carbon-top">
            <div>
              <h2>Carbon Offset Tracker</h2>
              <p>Total environmental impact this year</p>
            </div>
            <span className="carbon-badge">LEADERBOARD #3</span>
          </div>
          <div className="carbon-stats">
            <div><small>CO2 AVOIDED</small><strong>12.4 <span>tons</span></strong></div>
            <div><small>TREES EQUIVALENT</small><strong>548 <span>planted</span></strong></div>
          </div>
          <footer>
            <button type="button">View Detailed Impact</button>
            <button type="button" className="share-button" aria-label="Share impact"><i className="bi bi-share"></i></button>
>>>>>>> 8ef158703e71b152a74c6ccdfcc7f793fe4020be
          </footer>
        </article>
      </section>
    </div>
  )
}

export default Dashboard
