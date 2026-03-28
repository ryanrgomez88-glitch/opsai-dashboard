import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../lib/DataContext';
import { fmtDate, fmtTime } from '../lib/fmt';

export default function FlightLogPage() {
  const { data, loading, error, filterByTail } = useData();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  if (loading) return <div className="center-msg"><div className="spinner" /><span>Loading…</span></div>;
  if (error) return <div className="center-msg error">⚠️ {error}</div>;
  if (!data) return null;

  const legs = filterByTail(data.flightLog || []);
  const filtered = search
    ? legs.filter(l =>
        (l.trip_number || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.dep || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.arr || '').toLowerCase().includes(search.toLowerCase())
      )
    : legs;

  return (
    <div className="page-content">
      <div className="filter-section">
        <input
          className="filter-input"
          placeholder="Search trip, DEP, ARR…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className="filter-summary">{filtered.length} legs</span>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>TRIP</th>
              <th>LEG</th>
              <th>TAIL</th>
              <th>DEP → ARR</th>
              <th>DATE</th>
              <th>OUT</th>
              <th>OFF</th>
              <th>ON</th>
              <th>IN</th>
              <th>FLT HRS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(l => (
              <tr
                key={l.id}
                className="clickable-row"
                onClick={() => navigate(`/trips/${l.trip_number}`)}
                title="View trip detail"
              >
                <td className="mono">{l.trip_number}</td>
                <td className="mono">{l.leg_number}</td>
                <td className="tail-badge">{l.tail}</td>
                <td className="mono">{l.dep} → {l.arr}</td>
                <td>{fmtDate(l.date)}</td>
                <td className="mono">{fmtTime(l.out_time)}</td>
                <td className="mono">{fmtTime(l.off_time)}</td>
                <td className="mono">{fmtTime(l.on_time)}</td>
                <td className="mono">{fmtTime(l.in_time)}</td>
                <td className="mono">{l.flight_hours ? Number(l.flight_hours).toFixed(1) : '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="empty-state">No flight legs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
