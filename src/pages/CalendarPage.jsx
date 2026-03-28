import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../lib/DataContext';
import { fmtDate } from '../lib/fmt';
import { Card, Title, Text, Badge } from '@tremor/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function Skeleton({ className = '' }) { return <div className={`skeleton ${className}`} />; }

export default function CalendarPage() {
  const { data, loading } = useData();
  const navigate = useNavigate();
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const trips = data?.recentTrips || [];

  // Group trips by day
  const tripsByDay = {};
  trips.forEach(t => {
    if (!t.date) return;
    const d = new Date(t.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!tripsByDay[day]) tripsByDay[day] = [];
      tripsByDay[day].push(t);
    }
  });

  const tripsThisMonth = trips.filter(t => {
    if (!t.date) return false;
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const monthLabel = viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (day) => {
    const t = new Date();
    return day === t.getDate() && month === t.getMonth() && year === t.getFullYear();
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-[#1E3A5F]">Calendar</h1>

      <Card className="ring-0 shadow-sm">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
            className="p-2 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <Title className="text-[#1E3A5F]">{monthLabel}</Title>
          <button
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
            className="p-2 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {dayNames.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="grid grid-cols-7 gap-1">
            {[...Array(35)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => (
              <div
                key={i}
                className={`min-h-[4rem] rounded-lg p-1.5 ${
                  day === null
                    ? 'bg-transparent'
                    : isToday(day)
                    ? 'bg-[#EFF6FF] border border-[#2196F3]'
                    : tripsByDay[day]
                    ? 'bg-amber-50 border border-amber-200 cursor-pointer hover:border-amber-400 transition-colors'
                    : 'bg-slate-50 hover:bg-slate-100 transition-colors cursor-default'
                }`}
                onClick={() => {
                  if (day && tripsByDay[day]?.length === 1) {
                    const t = tripsByDay[day][0];
                    navigate(`/trips/${t.trip_id || t.trip_number}`);
                  }
                }}
              >
                {day && (
                  <>
                    <span className={`text-xs font-semibold block ${isToday(day) ? 'text-[#2196F3]' : 'text-slate-600'}`}>
                      {day}
                    </span>
                    {(tripsByDay[day] || []).map((t, ti) => (
                      <div
                        key={ti}
                        className="mt-0.5 text-[10px] font-medium text-amber-700 bg-amber-100 rounded px-1 py-0.5 truncate cursor-pointer"
                        onClick={e => { e.stopPropagation(); navigate(`/trips/${t.trip_id || t.trip_number}`); }}
                      >
                        {t.dep}→{t.arr}
                      </div>
                    ))}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Trips this month */}
      {tripsThisMonth.length > 0 && (
        <Card className="ring-0 shadow-sm">
          <Title className="text-[#1E3A5F] mb-4">{monthLabel} — Trips</Title>
          <div className="divide-y divide-slate-100">
            {tripsThisMonth.map((t, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
                onClick={() => navigate(`/trips/${t.trip_id || t.trip_number}`)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{t.trip_number}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{t.dep} → {t.arr}</p>
                    <p className="text-xs text-slate-400">{fmtDate(t.date)} · {t.tail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const s = (t.status || '').toLowerCase();
                    if (s === 'complete' || s === 'completed') return <Badge color="emerald" size="xs">Complete</Badge>;
                    if (s === 'planned' || s === 'scheduled') return <Badge color="amber" size="xs">Planned</Badge>;
                    return <Badge color="gray" size="xs">{t.status || '—'}</Badge>;
                  })()}
                  <span className="text-slate-300">→</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!loading && tripsThisMonth.length === 0 && (
        <Card className="ring-0 shadow-sm">
          <div className="flex items-center justify-center py-12 text-slate-400 text-sm">No trips in {monthLabel}</div>
        </Card>
      )}
    </div>
  );
}
