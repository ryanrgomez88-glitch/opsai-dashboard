export function fmt$(n) {
  if (!n && n !== 0) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function fmtHrs(n) {
  if (!n && n !== 0) return '—';
  return Number(n).toFixed(1) + ' hrs';
}

export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtTime(t) {
  if (!t) return '—';
  // Handles ISO timestamps and HH:MM strings
  if (t.includes('T')) {
    const d = new Date(t);
    return d.toISOString().slice(11, 16) + 'Z';
  }
  return t.slice(0, 5);
}

export function fmtShortDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
