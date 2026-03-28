import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../lib/DataContext';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const { data, loading, error, filterByTail } = useData();
  const navigate = useNavigate();

  if (loading) return <div className="center-msg"><div className="spinner" /><span>Loading…</span></div>;
  if (error) return <div className="center-msg error">⚠️ {error}</div>;
  if (!data) return null;

  const trips = filterByTail(data.recentTrips);

  // Build a map: date string → [trips]
  const tripMap = {};
  for (const trip of trips) {
    if (!trip.date) continue;
    const key = trip.date.slice(0, 10);
    if (!tripMap[key]) tripMap[key] = [];
    tripMap[key].push(trip);
  }

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  function dateStr(d) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  // Count trips this month
  const monthTrips = trips.filter(t => {
    if (!t.date) return false;
    const [ty, tm] = t.date.split('-').map(Number);
    return ty === year && tm === month + 1;
  });

  return (
    <div className="page-content">
      <div className="cal-header">
        <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
        <div className="cal-title">{MONTH_NAMES[month]} {year}</div>
        <button className="cal-nav-btn" onClick={nextMonth}>›</button>
        <span className="cal-summary">{monthTrips.length} trips this month</span>
      </div>

      <div className="cal-wrap">
        <div className="cal-grid">
          {DAY_NAMES.map(d => (
            <div key={d} className="cal-day-header">{d}</div>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <div key={`empty-${i}`} className="cal-cell empty" />;
            const key = dateStr(d);
            const dayTrips = tripMap[key] || [];
            const isToday = key === todayStr;
            return (
              <div key={key} className={`cal-cell${isToday ? ' today' : ''}${dayTrips.length > 0 ? ' has-trips' : ''}`}>
                <span className="cal-day-num">{d}</span>
                <div className="cal-trips">
                  {dayTrips.slice(0, 3).map(t => (
                    <div
                      key={t.trip_id}
                      className={`cal-trip-dot status-${t.status}`}
                      title={`${t.trip_number}: ${t.dep} → ${t.arr} (${t.status})`}
                      onClick={() => navigate(`/trips/${t.trip_id}`)}
                    >
                      <span className="cal-trip-label">{t.tail} {t.dep}→{t.arr}</span>
                    </div>
                  ))}
                  {dayTrips.length > 3 && (
                    <div className="cal-trip-more">+{dayTrips.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trip list for month */}
      {monthTrips.length > 0 && (
        <div className="cal-list-section">
          <div className="section-title">TRIPS IN {MONTH_NAMES[month].toUpperCase()} {year}</div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>TRIP #</th>
                  <th>TAIL</th>
                  <th>ROUTE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {monthTrips.sort((a, b) => a.date.localeCompare(b.date)).map(t => (
                  <tr
                    key={t.trip_id}
                    className="clickable-row"
                    onClick={() => navigate(`/trips/${t.trip_id}`)}
                  >
                    <td>{t.date}</td>
                    <td className="mono">{t.trip_number}</td>
                    <td className="tail-badge">{t.tail}</td>
                    <td className="mono">{t.dep} → {t.arr}</td>
                    <td><span className={`status-pill ${t.status}`}>{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
