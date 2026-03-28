import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../lib/DataContext';
import { fmt$, fmtHrs, fmtDate, fmtTime } from '../lib/fmt';
import { Card, Grid, Col, Metric, Text, Title, Badge, Flex, Button } from '@tremor/react';
import { ArrowLeft, Plane, DollarSign, Clock, Map } from 'lucide-react';

function Skeleton({ className = '' }) { return <div className={`skeleton ${className}`} />; }

export default function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading } = useData();

  const trips = data?.recentTrips || [];
  const expenses = data?.expenses || [];
  const legs = data?.flightLog || [];

  // Find trip by trip_id or trip_number
  const trip = trips.find(t => String(t.trip_id) === id || String(t.trip_number) === id);
  const tripExpenses = expenses.filter(e => String(e.trip_number) === String(trip?.trip_number) || String(e.trip_id) === id);
  const tripLegs = legs.filter(l => String(l.trip_number) === String(trip?.trip_number) || String(l.trip_id) === id);

  const totalCost = tripExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalHours = tripLegs.reduce((s, l) => s + Number(l.flight_hours || 0), 0);

  // Category breakdown
  const catBreakdown = {};
  tripExpenses.forEach(e => {
    const cat = e.category || 'Other';
    catBreakdown[cat] = (catBreakdown[cat] || 0) + Number(e.amount || 0);
  });

  function StatusBadge({ status }) {
    const s = (status || '').toLowerCase();
    if (s === 'complete' || s === 'completed') return <Badge color="emerald">Complete</Badge>;
    if (s === 'in-progress' || s === 'active') return <Badge color="blue">Active</Badge>;
    if (s === 'planned' || s === 'scheduled') return <Badge color="amber">Planned</Badge>;
    return <Badge color="gray">{status || 'Unknown'}</Badge>;
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-48" />
        <Grid numItemsSm={4} className="gap-4">
          {[...Array(4)].map((_, i) => <Card key={i} className="ring-0 shadow-sm"><Skeleton className="h-16 w-full" /></Card>)}
        </Grid>
        <Card className="ring-0 shadow-sm"><Skeleton className="h-40 w-full" /></Card>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400 text-sm">Trip not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-[#2196F3] text-sm hover:underline">← Go back</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate(-1)}
          className="mt-1 p-2 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <Flex justifyContent="between" alignItems="start">
            <div>
              <h1 className="text-2xl font-bold text-[#1E3A5F]">Trip {trip.trip_number}</h1>
              <p className="text-slate-500 text-sm mt-0.5">{trip.dep} → {trip.arr} · {fmtDate(trip.date)} · {trip.tail}</p>
            </div>
            <StatusBadge status={trip.status} />
          </Flex>
        </div>
      </div>

      {/* KPIs */}
      <Grid numItemsSm={2} numItemsLg={4} className="gap-4">
        {[
          { label: 'Total Cost', value: fmt$(totalCost), icon: DollarSign },
          { label: 'Flight Hours', value: fmtHrs(totalHours), icon: Clock },
          { label: 'Legs', value: String(tripLegs.length), icon: Map },
          { label: 'Expenses', value: String(tripExpenses.length), icon: Plane },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="ring-0 shadow-sm">
            <Flex justifyContent="between">
              <div>
                <Text className="text-slate-500 text-sm">{label}</Text>
                <Metric className="text-[#1E3A5F] font-mono mt-1 text-2xl">{value || '—'}</Metric>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg"><Icon size={16} className="text-[#2196F3]" /></div>
            </Flex>
          </Card>
        ))}
      </Grid>

      {/* Flight Legs */}
      {tripLegs.length > 0 && (
        <Card className="ring-0 shadow-sm overflow-hidden p-0">
          <div className="px-4 pt-4 pb-3 border-b border-slate-100">
            <Title className="text-[#1E3A5F]">Flight Legs</Title>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Leg', 'Tail', 'Route', 'Date', 'OUT', 'OFF', 'ON', 'IN', 'Flt Hrs'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide py-2.5 px-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tripLegs.sort((a, b) => (a.leg_number || 0) - (b.leg_number || 0)).map((l, i) => (
                  <tr key={l.id || i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-500">{l.leg_number}</td>
                    <td className="py-2.5 px-3"><span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{l.tail}</span></td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{l.dep} → {l.arr}</td>
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-500 whitespace-nowrap">{fmtDate(l.date)}</td>
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-500">{fmtTime(l.out_time)}</td>
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-500">{fmtTime(l.off_time)}</td>
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-500">{fmtTime(l.on_time)}</td>
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-500">{fmtTime(l.in_time)}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-[#1E3A5F]">{fmtHrs(l.flight_hours)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Cost Breakdown */}
      {Object.keys(catBreakdown).length > 0 && (
        <Card className="ring-0 shadow-sm">
          <Title className="text-[#1E3A5F] mb-4">Cost by Category</Title>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(catBreakdown).sort(([, a], [, b]) => b - a).map(([cat, amt]) => (
              <div key={cat} className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">{cat}</p>
                <p className="text-base font-mono font-semibold text-[#1E3A5F] mt-0.5">{fmt$(amt)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Expenses Table */}
      {tripExpenses.length > 0 && (
        <Card className="ring-0 shadow-sm overflow-hidden p-0">
          <div className="px-4 pt-4 pb-3 border-b border-slate-100">
            <Flex justifyContent="between">
              <Title className="text-[#1E3A5F]">Expenses</Title>
              <Text className="font-mono text-sm font-semibold text-slate-700">{fmt$(totalCost)}</Text>
            </Flex>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Date', 'Vendor', 'Category', 'Amount', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide py-2.5 px-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tripExpenses.map((e, i) => (
                  <tr key={e.id || i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-500 whitespace-nowrap">{fmtDate(e.date)}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{e.vendor || '—'}</td>
                    <td className="py-2.5 px-3 text-slate-500 text-xs">{e.category || '—'}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{fmt$(e.amount)}</td>
                    <td className="py-2.5 px-3">
                      {(() => {
                        const s = (e.status || '').toLowerCase();
                        if (s === 'paid' || s === 'complete') return <Badge color="emerald" size="xs">Paid</Badge>;
                        if (s === 'pending') return <Badge color="amber" size="xs">Pending</Badge>;
                        return <Badge color="gray" size="xs">{e.status || '—'}</Badge>;
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
