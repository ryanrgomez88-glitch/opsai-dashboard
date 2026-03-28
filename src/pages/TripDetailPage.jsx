import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../lib/DataContext';
import { fmt$, fmtHrs, fmtDate, fmtTime } from '../lib/fmt';

export default function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useData();

  if (loading) return <div className="center-msg"><div className="spinner" /><span>Loading…</span></div>;
  if (error) return <div className="center-msg error">⚠️ {error}</div>;
  if (!data) return null;

  // Find the trip — id could be trip_id or trip_number
  const trip = data.recentTrips?.find(t => t.trip_id === id || t.trip_number === id);
  if (!trip) {
    return (
      <div className="page-content">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <div className="center-msg">Trip not found: {id}</div>
      </div>
    );
  }

  // Get legs for this trip
  const legs = (data.flightLog || []).filter(l => l.trip_number === trip.trip_number);

  // Get expenses for this trip
  const expenses = (data.expenses || []).filter(e => e.trip_number === trip.trip_number);

  const totalCost = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalHours = legs.reduce((s, l) => s + (l.flight_hours || 0), 0);
  const totalBlock = legs.reduce((s, l) => s + (l.block_time || 0), 0);

  // Group expenses by category
  const catMap = {};
  for (const e of expenses) {
    const cat = e.category || 'Other';
    catMap[cat] = (catMap[cat] || 0) + (e.amount || 0);
  }
  const catBreakdown = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="page-content">
      <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

      {/* Trip Header */}
      <div className="trip-header-card">
        <div className="trip-header-top">
          <div>
            <div className="trip-number">{trip.trip_number}</div>
            <div className="trip-route">{trip.dep} → {trip.arr}</div>
          </div>
          <div className="trip-meta-right">
            <span className="tail-badge large">{trip.tail}</span>
            <span className={`status-pill ${trip.status}`}>{trip.status}</span>
          </div>
        </div>
        <div className="trip-header-meta">
          <div className="trip-meta-item">
            <span className="trip-meta-label">DATE</span>
            <span className="trip-meta-val">{fmtDate(trip.date)}</span>
          </div>
          <div className="trip-meta-item">
            <span className="trip-meta-label">LEGS</span>
            <span className="trip-meta-val">{legs.length}</span>
          </div>
          <div className="trip-meta-item">
            <span className="trip-meta-label">FLIGHT HRS</span>
            <span className="trip-meta-val">{fmtHrs(totalHours)}</span>
          </div>
          <div className="trip-meta-item">
            <span className="trip-meta-label">BLOCK HRS</span>
            <span className="trip-meta-val">{fmtHrs(totalBlock)}</span>
          </div>
          <div className="trip-meta-item">
            <span className="trip-meta-label">TOTAL COST</span>
            <span className="trip-meta-val gold">{fmt$(totalCost)}</span>
          </div>
        </div>
      </div>

      {/* Flight Legs */}
      {legs.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div className="section-title">FLIGHT LEGS</div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>LEG</th>
                  <th>DATE</th>
                  <th>DEP → ARR</th>
                  <th>OUT</th>
                  <th>OFF</th>
                  <th>ON</th>
                  <th>IN</th>
                  <th>FLT HRS</th>
                  <th>BLOCK</th>
                </tr>
              </thead>
              <tbody>
                {legs.sort((a, b) => (a.leg_number || 0) - (b.leg_number || 0)).map(l => (
                  <tr key={l.id}>
                    <td className="mono">{l.leg_number}</td>
                    <td>{fmtDate(l.date)}</td>
                    <td className="mono">{l.dep} → {l.arr}</td>
                    <td className="mono">{fmtTime(l.out_time)}</td>
                    <td className="mono">{fmtTime(l.off_time)}</td>
                    <td className="mono">{fmtTime(l.on_time)}</td>
                    <td className="mono">{fmtTime(l.in_time)}</td>
                    <td className="mono">{l.flight_hours ? Number(l.flight_hours).toFixed(1) : '—'}</td>
                    <td className="mono">{l.block_time ? Number(l.block_time).toFixed(1) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cost Breakdown */}
      {catBreakdown.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div className="section-title">COST BREAKDOWN</div>
          <div className="cost-breakdown-grid">
            {catBreakdown.map(([cat, amount]) => (
              <div key={cat} className="cost-breakdown-item">
                <span className="cost-cat">{cat}</span>
                <span className="cost-amount">{fmt$(amount)}</span>
                <span className="cost-pct">
                  {totalCost > 0 ? ((amount / totalCost) * 100).toFixed(1) : 0}%
                </span>
              </div>
            ))}
            <div className="cost-breakdown-item total">
              <span className="cost-cat">TOTAL</span>
              <span className="cost-amount">{fmt$(totalCost)}</span>
              <span className="cost-pct">100%</span>
            </div>
          </div>
        </div>
      )}

      {/* Expenses */}
      {expenses.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div className="section-title">EXPENSES ({expenses.length})</div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>VENDOR</th>
                  <th>CATEGORY</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {expenses.sort((a, b) => (a.date || '').localeCompare(b.date || '')).map(e => (
                  <tr key={e.id}>
                    <td>{fmtDate(e.date)}</td>
                    <td>{e.vendor}</td>
                    <td><span className="cat-tag">{e.category}</span></td>
                    <td className="mono amount">{fmt$(e.amount)}</td>
                    <td><span className={`status-pill ${e.status}`}>{e.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {legs.length === 0 && expenses.length === 0 && (
        <div className="empty-state" style={{ marginTop: 40 }}>
          No legs or expenses recorded for this trip yet.
        </div>
      )}
    </div>
  );
}
