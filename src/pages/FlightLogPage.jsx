import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../lib/DataContext';
import { fmtDate, fmtHrs, fmtTime } from '../lib/fmt';
import { Card, Title, Text, TextInput } from '@tremor/react';
import { Search } from 'lucide-react';

function Skeleton({ className = '' }) { return <div className={`skeleton ${className}`} />; }

export default function FlightLogPage() {
  const { data, loading, filterByTail } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const legs = filterByTail(data?.flightLog || []);
  const filtered = legs.filter(l => {
    const q = search.toLowerCase();
    return !q ||
      (l.trip_number || '').toLowerCase().includes(q) ||
      (l.dep || '').toLowerCase().includes(q) ||
      (l.arr || '').toLowerCase().includes(q) ||
      (l.tail || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Flight Log</h1>
          <p className="text-slate-500 text-sm mt-0.5">{filtered.length} legs</p>
        </div>
        <TextInput
          icon={Search}
          placeholder="Search trip, DEP, ARR…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-64"
        />
      </div>

      <Card className="ring-0 shadow-sm overflow-hidden p-0">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">No flights found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Trip', 'Leg', 'Tail', 'Route', 'Date', 'OUT', 'OFF', 'ON', 'IN', 'Flt Hrs'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((l, i) => (
                  <tr
                    key={l.id || i}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/trips/${l.trip_id || l.trip_number}`)}
                  >
                    <td className="py-3 px-3 font-mono text-xs text-slate-600">{l.trip_number}</td>
                    <td className="py-3 px-3 text-slate-500 text-center">{l.leg_number}</td>
                    <td className="py-3 px-3"><span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{l.tail}</span></td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{l.dep} → {l.arr}</td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-xs whitespace-nowrap">{fmtDate(l.date)}</td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-500">{fmtTime(l.out_time)}</td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-500">{fmtTime(l.off_time)}</td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-500">{fmtTime(l.on_time)}</td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-500">{fmtTime(l.in_time)}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-[#1E3A5F]">{fmtHrs(l.flight_hours)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
