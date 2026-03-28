import { useState, useMemo } from 'react';
import { useData } from '../lib/DataContext';
import { fmt$, fmtDate } from '../lib/fmt';

const PAGE_SIZE = 25;

function exportCSV(rows) {
  const headers = ['Date', 'Tail', 'Vendor', 'Category', 'Amount', 'Trip', 'Status'];
  const lines = [
    headers.join(','),
    ...rows.map(e => [
      e.date, e.tail, `"${(e.vendor || '').replace(/"/g, '""')}"`,
      `"${(e.category || '').replace(/"/g, '""')}"`,
      e.amount, e.trip_number, e.status
    ].join(','))
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `opsai-expenses-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExpensesPage() {
  const { data, loading, error, filterByTail } = useData();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  if (loading) return <div className="center-msg"><div className="spinner" /><span>Loading…</span></div>;
  if (error) return <div className="center-msg error">⚠️ {error}</div>;
  if (!data) return null;

  const allExpenses = filterByTail(data.expenses || []);

  // Unique categories and statuses
  const categories = [...new Set(allExpenses.map(e => e.category).filter(Boolean))].sort();
  const statuses = [...new Set(allExpenses.map(e => e.status).filter(Boolean))].sort();

  const filtered = useMemo(() => {
    let rows = allExpenses;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(e =>
        (e.vendor || '').toLowerCase().includes(q) ||
        (e.trip_number || '').toLowerCase().includes(q) ||
        (e.category || '').toLowerCase().includes(q)
      );
    }
    if (catFilter) rows = rows.filter(e => e.category === catFilter);
    if (statusFilter) rows = rows.filter(e => e.status === statusFilter);
    if (dateFrom) rows = rows.filter(e => e.date >= dateFrom);
    if (dateTo) rows = rows.filter(e => e.date <= dateTo);

    rows = [...rows].sort((a, b) => {
      let av = a[sortField] ?? '';
      let bv = b[sortField] ?? '';
      if (sortField === 'amount') { av = Number(av); bv = Number(bv); }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return rows;
  }, [allExpenses, search, catFilter, statusFilter, dateFrom, dateTo, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalAmount = filtered.reduce((s, e) => s + (e.amount || 0), 0);

  function toggleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
    setPage(1);
  }

  function SortArrow({ field }) {
    if (sortField !== field) return <span className="sort-arrow muted">↕</span>;
    return <span className="sort-arrow active">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  function resetFilters() {
    setSearch(''); setCatFilter(''); setDateFrom(''); setDateTo(''); setStatusFilter(''); setPage(1);
  }

  return (
    <div className="page-content">
      {/* Filters */}
      <div className="filter-section">
        <input
          className="filter-input"
          placeholder="Search vendor, trip, category…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <select className="filter-select" value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="filter-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          className="filter-input date-input"
          type="date"
          value={dateFrom}
          onChange={e => { setDateFrom(e.target.value); setPage(1); }}
          title="From date"
        />
        <input
          className="filter-input date-input"
          type="date"
          value={dateTo}
          onChange={e => { setDateTo(e.target.value); setPage(1); }}
          title="To date"
        />
        <button className="filter-btn" onClick={resetFilters}>RESET</button>
        <button className="filter-btn active" onClick={() => exportCSV(filtered)}>CSV ↓</button>
      </div>

      <div className="filter-summary">
        {filtered.length} of {allExpenses.length} expenses · Total: {fmt$(totalAmount)}
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort('date')} className="sortable">DATE <SortArrow field="date" /></th>
              <th>TAIL</th>
              <th onClick={() => toggleSort('vendor')} className="sortable">VENDOR <SortArrow field="vendor" /></th>
              <th onClick={() => toggleSort('category')} className="sortable">CATEGORY <SortArrow field="category" /></th>
              <th onClick={() => toggleSort('amount')} className="sortable">AMOUNT <SortArrow field="amount" /></th>
              <th onClick={() => toggleSort('trip_number')} className="sortable">TRIP <SortArrow field="trip_number" /></th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map(e => (
              <tr key={e.id}>
                <td>{fmtDate(e.date)}</td>
                <td className="tail-badge">{e.tail}</td>
                <td>{e.vendor}</td>
                <td><span className="cat-tag">{e.category}</span></td>
                <td className="mono amount">{fmt$(e.amount)}</td>
                <td className="mono">{e.trip_number}</td>
                <td><span className={`status-pill ${e.status}`}>{e.status}</span></td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr><td colSpan={7} className="empty-state">No expenses match the current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            onClick={() => setPage(1)}
            disabled={currentPage === 1}
          >«</button>
          <button
            className="page-btn"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >‹</button>
          <span className="page-info">Page {currentPage} of {totalPages}</span>
          <button
            className="page-btn"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >›</button>
          <button
            className="page-btn"
            onClick={() => setPage(totalPages)}
            disabled={currentPage === totalPages}
          >»</button>
        </div>
      )}
    </div>
  );
}
