import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useData } from '../lib/DataContext';
import { fmt$, fmtHrs, fmtDate } from '../lib/fmt';

function buildMonthlyChart(expenses) {
  const map = {};
  for (const e of expenses || []) {
    if (!e.date) continue;
    const mo = e.date.slice(0, 7);
    map[mo] = (map[mo] || 0) + (e.amount || 0);
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([mo, cost]) => ({
      month: new Date(mo + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      cost: Math.round(cost),
    }));
}

export default function Home() {
  const { data, loading, error, getStats, filterByTail, lastRefresh } = useData();
  const navigate = useNavigate();

  if (loading) return <div className="center-msg"><div className="spinner" /><span>Loading operations data…</span></div>;
  if (error) return <div className="center-msg error">⚠️ Unable to reach Otto API: {error}<br /><small>Check Railway deployment status.</small></div>;
  if (!data) return null;

  const stats = getStats();
  const filteredTrips = filterByTail(data.recentTrips);
  const filteredExpenses = filterByTail(data.expenses);
  const chartData = buildMonthlyChart(filteredExpenses);
  const costPerHr = stats.flightHours > 0 ? stats.totalCost / stats.flightHours : 0;

  // Budget vs actual for 2026
  const ANNUAL_BUDGET = 4_000_000;
  const ytdPct = Math.min(100, (stats.totalCost / ANNUAL_BUDGET) * 100);

  return (
    <div className="page-content">
      {lastRefresh && (
        <div className="page-refresh-note">
          Last updated: {lastRefresh.toLocaleTimeString()} · Auto-refresh every 60s
        </div>
      )}

      {/* KPI Cards */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-label">TOTAL OPS COST</div>
          <div className="stat-value">{fmt$(stats.totalCost)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">FLIGHT HOURS</div>
          <div className="stat-value">{fmtHrs(stats.flightHours)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">COST / HR</div>
          <div className="stat-value">{fmt$(costPerHr)}</div>
          <div className="stat-sub">target: $12,308/hr</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">2026 BUDGET USED</div>
          <div className="stat-value">{ytdPct.toFixed(1)}%</div>
          <div className="budget-mini-bar">
            <div className="budget-mini-fill" style={{ width: `${ytdPct}%` }} />
          </div>
          <div className="stat-sub">{fmt$(stats.totalCost)} of {fmt$(ANNUAL_BUDGET)}</div>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="stat-cards" style={{ marginTop: 0 }}>
        <div className="stat-card">
          <div className="stat-label">TOTAL TRIPS</div>
          <div className="stat-value">{stats.trips}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">TOTAL LEGS</div>
          <div className="stat-value">{stats.legs}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">BLOCK HOURS</div>
          <div className="stat-value">{fmtHrs(stats.blockHours)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">AIRCRAFT</div>
          <div className="stat-value">{data.aircraft?.length || 0}</div>
        </div>
      </div>

      {/* Chart + Recent */}
      <div className="home-grid">
        <div className="chart-section">
          <div className="section-title">MONTHLY OPS COST</div>
          {chartData.length === 0
            ? <div className="empty-state">No expense data available yet.</div>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2035" />
                  <XAxis dataKey="month" tick={{ fill: '#8a9bb8', fontSize: 11 }} />
                  <YAxis
                    tickFormatter={v => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)}
                    tick={{ fill: '#8a9bb8', fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={v => [fmt$(v), 'Cost']}
                    contentStyle={{ background: '#0d1326', border: '1px solid #c8a84b', borderRadius: 6, color: '#e8eaf0' }}
                  />
                  <Bar dataKey="cost" fill="#c8a84b" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>

        <div className="recent-section">
          <div className="section-title">RECENT ACTIVITY</div>
          <div className="recent-list">
            {filteredTrips.slice(0, 8).map(t => (
              <div
                key={t.trip_id}
                className="recent-item clickable"
                onClick={() => navigate(`/trips/${t.trip_id}`)}
              >
                <span className="ri-tail">{t.tail}</span>
                <span className="ri-trip">{t.trip_number}</span>
                <span className="ri-route">{t.dep} → {t.arr}</span>
                <span className="ri-date">{fmtDate(t.date)}</span>
                <span className={`ri-status ${t.status}`}>{t.status}</span>
              </div>
            ))}
            {filteredTrips.length === 0 && <div className="empty-state">No trips recorded yet.</div>}
          </div>
          {filteredTrips.length > 8 && (
            <button className="view-all-btn" onClick={() => navigate('/expenses')}>
              View all expenses →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
