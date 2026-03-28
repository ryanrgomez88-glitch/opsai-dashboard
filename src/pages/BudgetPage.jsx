import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { useData } from '../lib/DataContext';
import { fmt$, fmtHrs } from '../lib/fmt';

const ANNUAL_BUDGET = 4_000_000;
const ANNUAL_HOURS = 325;
const TARGET_COST_PER_HR = 12_308;

const CURRENT_YEAR = 2026;
const CURRENT_MONTH = 2; // 0-indexed (March)

// Fraction of year elapsed through end of March
const MONTHS_ELAPSED = 3;
const YTD_BUDGET_FRACTION = MONTHS_ELAPSED / 12;
const YTD_BUDGET = ANNUAL_BUDGET * YTD_BUDGET_FRACTION;
const YTD_HOURS_BUDGET = ANNUAL_HOURS * YTD_BUDGET_FRACTION;

function ProgressBar({ pct, color }) {
  const c = color || '#2196F3';
  const over = pct > 100;
  return (
    <div className="budget-bar-bg">
      <div
        className="budget-bar-fill"
        style={{ width: `${Math.min(pct, 100)}%`, background: over ? '#e05c5c' : c }}
      />
      {over && <div className="budget-bar-over" style={{ left: '100%' }} />}
    </div>
  );
}

export default function BudgetPage() {
  const { data, loading, error, filterByTail, getStats } = useData();

  if (loading) return <div className="center-msg"><div className="spinner" /><span>Loading…</span></div>;
  if (error) return <div className="center-msg error">⚠️ {error}</div>;
  if (!data) return null;

  const allExpenses = filterByTail(data.expenses || []);
  const stats = getStats();

  // YTD expenses (2026)
  const ytdExpenses = allExpenses.filter(e => e.date && e.date.startsWith('2026'));
  const ytdActual = ytdExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const ytdHours = stats.flightHours;
  const actualCostPerHr = ytdHours > 0 ? ytdActual / ytdHours : 0;

  // Category breakdown
  const catMap = {};
  for (const e of ytdExpenses) {
    const cat = e.category || 'Other';
    catMap[cat] = (catMap[cat] || 0) + (e.amount || 0);
  }
  const catData = Object.entries(catMap)
    .map(([cat, amount]) => ({ cat, amount: Math.round(amount) }))
    .sort((a, b) => b.amount - a.amount);

  const ytdPct = (ytdActual / YTD_BUDGET) * 100;
  const hrsPct = (ytdHours / YTD_HOURS_BUDGET) * 100;
  const costHrPct = (actualCostPerHr / TARGET_COST_PER_HR) * 100;

  const CHART_COLORS = ['#2196F3', '#FF9800', '#4CAF50', '#c8a84b', '#9C27B0', '#00BCD4', '#F44336', '#8BC34A'];

  return (
    <div className="page-content">
      <div className="page-title">2026 BUDGET TRACKER</div>

      {/* Top KPIs */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-label">ANNUAL BUDGET</div>
          <div className="stat-value">{fmt$(ANNUAL_BUDGET)}</div>
          <div className="stat-sub">325 hrs · $12,308/hr target</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">YTD ACTUAL (2026)</div>
          <div className="stat-value" style={{ color: ytdPct > 100 ? '#e05c5c' : '#c8a84b' }}>
            {fmt$(ytdActual)}
          </div>
          <div className="stat-sub">{ytdPct.toFixed(1)}% of YTD budget</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">FLIGHT HOURS YTD</div>
          <div className="stat-value">{fmtHrs(ytdHours)}</div>
          <div className="stat-sub">target: {fmtHrs(YTD_HOURS_BUDGET)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">ACTUAL COST / HR</div>
          <div className="stat-value" style={{ color: costHrPct > 110 ? '#e05c5c' : '#c8a84b' }}>
            {fmt$(actualCostPerHr)}
          </div>
          <div className="stat-sub">target: {fmt$(TARGET_COST_PER_HR)}/hr</div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="budget-progress-section">
        <div className="section-title">BUDGET VS ACTUAL</div>

        <div className="budget-row">
          <div className="budget-row-label">
            <span>TOTAL SPEND (YTD)</span>
            <span className={ytdPct > 100 ? 'over-budget' : ''}>{fmt$(ytdActual)} / {fmt$(YTD_BUDGET)}</span>
          </div>
          <ProgressBar pct={ytdPct} color="#2196F3" />
          <div className="budget-pct">{ytdPct.toFixed(1)}%</div>
        </div>

        <div className="budget-row">
          <div className="budget-row-label">
            <span>ANNUAL PACE</span>
            <span>{fmt$(ytdActual)} / {fmt$(ANNUAL_BUDGET)}</span>
          </div>
          <ProgressBar pct={(ytdActual / ANNUAL_BUDGET) * 100} color="#c8a84b" />
          <div className="budget-pct">{((ytdActual / ANNUAL_BUDGET) * 100).toFixed(1)}%</div>
        </div>

        <div className="budget-row">
          <div className="budget-row-label">
            <span>FLIGHT HOURS (YTD)</span>
            <span>{fmtHrs(ytdHours)} / {fmtHrs(YTD_HOURS_BUDGET)}</span>
          </div>
          <ProgressBar pct={hrsPct} color="#4CAF50" />
          <div className="budget-pct">{hrsPct.toFixed(1)}%</div>
        </div>

        <div className="budget-row">
          <div className="budget-row-label">
            <span>COST PER HOUR</span>
            <span className={costHrPct > 110 ? 'over-budget' : ''}>{fmt$(actualCostPerHr)} / {fmt$(TARGET_COST_PER_HR)}</span>
          </div>
          <ProgressBar pct={costHrPct} color={costHrPct > 110 ? '#e05c5c' : '#FF9800'} />
          <div className="budget-pct">{costHrPct.toFixed(1)}%</div>
        </div>
      </div>

      {/* Category Chart */}
      {catData.length > 0 && (
        <div className="chart-section">
          <div className="section-title">SPEND BY CATEGORY (2026 YTD)</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={catData}
              margin={{ top: 10, right: 20, left: 20, bottom: 80 }}
              layout="horizontal"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2035" />
              <XAxis
                dataKey="cat"
                tick={{ fill: '#8a9bb8', fontSize: 10 }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                tickFormatter={v => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)}
                tick={{ fill: '#8a9bb8', fontSize: 11 }}
              />
              <Tooltip
                formatter={v => [fmt$(v), 'Amount']}
                contentStyle={{ background: '#0d1326', border: '1px solid #c8a84b', borderRadius: 6, color: '#e8eaf0' }}
              />
              <Bar dataKey="amount" radius={[3, 3, 0, 0]}>
                {catData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Table */}
      {catData.length > 0 && (
        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>CATEGORY</th>
                <th>AMOUNT</th>
                <th>% OF TOTAL</th>
                <th>TRANSACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {catData.map(({ cat, amount }) => {
                const count = ytdExpenses.filter(e => (e.category || 'Other') === cat).length;
                return (
                  <tr key={cat}>
                    <td>{cat}</td>
                    <td className="mono amount">{fmt$(amount)}</td>
                    <td className="mono">{ytdActual > 0 ? ((amount / ytdActual) * 100).toFixed(1) : 0}%</td>
                    <td className="mono">{count}</td>
                  </tr>
                );
              })}
              <tr className="total-row">
                <td><strong>TOTAL</strong></td>
                <td className="mono amount"><strong>{fmt$(ytdActual)}</strong></td>
                <td className="mono">100%</td>
                <td className="mono">{ytdExpenses.length}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
