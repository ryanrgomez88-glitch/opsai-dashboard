import { useState } from 'react';
import { useData } from '../lib/DataContext';
import { fmt$, fmtDate } from '../lib/fmt';
import {
  Card, Title, Text, TextInput, Select, SelectItem, Badge, Flex, Button
} from '@tremor/react';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';

function Skeleton({ className = '' }) { return <div className={`skeleton ${className}`} />; }

const PAGE_SIZE = 25;

export default function ExpensesPage() {
  const { data, loading, filterByTail } = useData();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  const allExpenses = filterByTail(data?.expenses || []);

  // Unique categories
  const categories = [...new Set(allExpenses.map(e => e.category).filter(Boolean))].sort();

  // Filter
  let filtered = allExpenses.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (e.vendor || '').toLowerCase().includes(q) ||
      (e.trip_number || '').toLowerCase().includes(q) ||
      (e.category || '').toLowerCase().includes(q) ||
      (e.description || '').toLowerCase().includes(q);
    const matchCat = !category || e.category === category;
    return matchSearch && matchCat;
  });

  // Sort
  filtered = [...filtered].sort((a, b) => {
    let av = a[sortKey] || '';
    let bv = b[sortKey] || '';
    if (sortKey === 'amount') { av = Number(av); bv = Number(bv); }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const total = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(1);
  }

  function exportCSV() {
    const header = ['Date', 'Tail', 'Trip', 'Vendor', 'Category', 'Amount', 'Status'];
    const rows = filtered.map(e => [
      e.date, e.tail, e.trip_number, e.vendor, e.category, e.amount, e.status
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  function SortTh({ label, k }) {
    return (
      <th
        className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-3 cursor-pointer select-none hover:text-slate-800 transition-colors"
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
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Expense Log</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {filtered.length} records · {fmt$(total)} total
          </p>
        </div>
        <Button size="sm" variant="secondary" icon={Download} onClick={exportCSV}>
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="ring-0 shadow-sm">
        <Flex className="gap-3 flex-col sm:flex-row">
          <TextInput
            icon={Search}
            placeholder="Search vendor, trip, category…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="flex-1"
          />
          <Select
            value={category}
            onValueChange={v => { setCategory(v); setPage(1); }}
            placeholder="All categories"
            className="w-full sm:w-48"
          >
            <SelectItem value="">All categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </Select>
        </Flex>
      </Card>

      {/* Table */}
      <Card className="ring-0 shadow-sm overflow-hidden p-0">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-slate-400 text-sm">No expenses match your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <SortTh label="Date" k="date" />
                  <SortTh label="Tail" k="tail" />
                  <SortTh label="Trip" k="trip_number" />
                  <SortTh label="Vendor" k="vendor" />
                  <SortTh label="Category" k="category" />
                  <SortTh label="Amount" k="amount" />
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paged.map((e, i) => (
                  <tr key={e.id || i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 text-slate-600 font-mono text-xs whitespace-nowrap">{fmtDate(e.date)}</td>
                    <td className="py-3 px-3">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{e.tail || '—'}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 text-xs font-mono">{e.trip_number || '—'}</td>
                    <td className="py-3 px-3 text-slate-800 font-medium max-w-[160px] truncate">{e.vendor || '—'}</td>
                    <td className="py-3 px-3 text-slate-500 text-xs">{e.category || '—'}</td>
                    <td className="py-3 px-3 text-slate-800 font-mono font-semibold text-right whitespace-nowrap">{fmt$(e.amount)}</td>
                    <td className="py-3 px-3"><ExpenseBadge status={e.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between">
            <Text className="text-xs text-slate-400">
              Page {page} of {totalPages} · {filtered.length} results
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

function ExpenseBadge({ status }) {
  const s = (status || '').toLowerCase();
  if (s === 'paid' || s === 'complete') return <Badge color="emerald" size="xs">Paid</Badge>;
  if (s === 'pending') return <Badge color="amber" size="xs">Pending</Badge>;
  if (s === 'disputed') return <Badge color="red" size="xs">Disputed</Badge>;
  return <Badge color="gray" size="xs">{status || 'Unknown'}</Badge>;
}
