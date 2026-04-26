import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../lib/DataContext';
import { fmtDate, fmt$ } from '../lib/fmt';
import { Card, Title, Text, TextInput, Select, SelectItem, Badge } from '@tremor/react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

function Skeleton({ className = '' }) { return <div className={`skeleton ${className}`} />; }

const PAGE_SIZE = 25;

const ENTITY_MAP = {
  POU: 'Ben & Ashleigh',
  IGN: 'Ignite Global',
  NAV: 'Navaah',
  POC: 'Pogue Construction',
  HOPE: 'Hope Mission',
  RJS: 'Internal / RJS',
};

function extractEntity(tripNumber) {
  if (!tripNumber) return 'RJS';
  const m = tripNumber.match(/^\d+([A-Z]+)-N\d+/);
  if (m) return m[1];
  if (tripNumber.startsWith('HOPE-')) return 'HOPE';
  return 'RJS';
}

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  if (s === 'complete' || s === 'completed') return <Badge color="emerald" size="xs">Complete</Badge>;
  if (s === 'invoiced') return <Badge color="blue" size="xs">Invoiced</Badge>;
  if (s === 'in-progress' || s === 'active' || s === 'open') return <Badge color="blue" size="xs">Active</Badge>;
  if (s === 'planned' || s === 'scheduled') return <Badge color="amber" size="xs">Planned</Badge>;
  return <Badge color="gray" size="xs">{status || 'Unknown'}</Badge>;
}

export default function AllTripsPage() {
  const { data, loading, filterByTail } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  const allExpenses = data?.expenses || [];
  const expByTrip = useMemo(() => {
    const m = {};
    allExpenses.forEach(e => {
      m[e.trip_number] = (m[e.trip_number] || 0) + Number(e.amount || 0);
    });
    return m;
  }, [allExpenses]);

  const allTrips = useMemo(() => {
    return filterByTail(data?.recentTrips || []).map(t => ({
      ...t,
      entity: extractEntity(t.trip_number),
      cost: expByTrip[t.trip_number] || 0,
    }));
  }, [data, filterByTail, expByTrip]);

  const statuses = [...new Set(allTrips.map(t => t.status).filter(Boolean))].sort();
  const entities = [...new Set(allTrips.map(t => t.entity).filter(Boolean))].sort();

  let filtered = allTrips.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (t.trip_number || '').toLowerCase().includes(q) ||
      (t.dep || '').toLowerCase().includes(q) ||
      (t.arr || '').toLowerCase().includes(q) ||
      (t.tail || '').toLowerCase().includes(q);
    const matchStatus = !statusFilter || t.status === statusFilter;
    const matchEntity = !entityFilter || t.entity === entityFilter;
    return matchSearch && matchStatus && matchEntity;
  });

  filtered = [...filtered].sort((a, b) => {
    let av = a[sortKey] || '';
    let bv = b[sortKey] || '';
    if (sortKey === 'cost') { av = Number(av); bv = Number(bv); }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(1);
  }

  function SortTh({ label, k, className = '' }) {
    return (
      <th
        className={`text-left text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-3 cursor-pointer select-none hover:text-slate-800 transition-colors whitespace-nowrap ${className}`}
        onClick={() => handleSort(k)}
      >
        {label} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </th>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">All Trips</h1>
          <p className="text-slate-500 text-sm mt-0.5">{filtered.length} trips found</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="ring-0 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <TextInput
            icon={Search}
            placeholder="Search trip #, route, tail…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="flex-1"
          />
          <Select
            value={statusFilter}
            onValueChange={v => { setStatusFilter(v); setPage(1); }}
            placeholder="All statuses"
            className="w-full sm:w-44"
          >
            <SelectItem value="">All statuses</SelectItem>
            {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </Select>
          <Select
            value={entityFilter}
            onValueChange={v => { setEntityFilter(v); setPage(1); }}
            placeholder="All clients"
            className="w-full sm:w-48"
          >
            <SelectItem value="">All clients</SelectItem>
            {entities.map(e => <SelectItem key={e} value={e}>{ENTITY_MAP[e] || e}</SelectItem>)}
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="ring-0 shadow-sm overflow-hidden p-0">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : paged.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">No trips match your filters</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <SortTh label="Trip #" k="trip_number" />
                  <SortTh label="Tail" k="tail" />
                  <SortTh label="Route" k="dep" />
                  <SortTh label="Date" k="date" />
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-3">Client</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-3">Status</th>
                  <SortTh label="Cost" k="cost" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paged.map((t, i) => (
                  <tr
                    key={t.trip_id || i}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/trips/${t.trip_id}`)}
                  >
                    <td className="py-3 px-3 font-mono text-xs text-slate-800 font-semibold">{t.trip_number}</td>
                    <td className="py-3 px-3">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{t.tail || '—'}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-sm font-medium text-slate-800">
                      {t.dep && t.dep !== '—' ? `${t.dep} → ${t.arr}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-xs whitespace-nowrap">{fmtDate(t.date)}</td>
                    <td className="py-3 px-3 text-slate-500 text-xs">{ENTITY_MAP[t.entity] || t.entity}</td>
                    <td className="py-3 px-3"><StatusBadge status={t.status} /></td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-800 text-right whitespace-nowrap">
                      {t.cost > 0 ? fmt$(t.cost) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between">
            <Text className="text-xs text-slate-400">
              Page {page} of {totalPages} · {filtered.length} trips
            </Text>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
