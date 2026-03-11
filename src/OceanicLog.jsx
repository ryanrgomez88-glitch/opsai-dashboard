import { useState, useEffect, useRef } from 'react';

// ─── Default Crossing Data ────────────────────────────────────────────────────
const DEFAULT_CROSSING = {
  tail: 'N45BP',
  dep: 'KADS',
  arr: 'LSGG',
  etd: '2345Z 11 MAR 2026',
  eta: '0844Z 12 MAR 2026',
  blockFuel: 89680,
  landingFuel: 62191,
  waypointsRaw: 'KADS, MLC, FAM, VHP, DJB, JHW, GONZZ, SAEZE, MPV, ALLEX, ALLRY, 51N050W, 52N040W, 52N030W, 52N020W, LIMRI, XETBO, SUVAN, UNLID, ARKIL, JSY, RESMI, PEKIM, PIMUP, LSGG',
  status: 'PRE-FLIGHT',
};

const DEFAULT_PLANNED_TIMES = {
  '51N050W': '0255Z',
  '52N040W': '0335Z',
  '52N030W': '0415Z',
  '52N020W': '0455Z',
};

const DEFAULT_PLANNED_FUEL = {
  '51N050W': 82100,
  '52N040W': 78200,
  '52N030W': 74300,
  '52N020W': 70400,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isOceanicFix(wp) {
  return /^\d{2}[NS]\d{3}[EW]$/.test(wp.trim());
}

function parseWaypoints(raw) {
  return raw
    .split(/[\n,]+/)
    .map(w => w.trim().toUpperCase())
    .filter(Boolean);
}

function fmtFuel(n) {
  if (!n && n !== 0) return '—';
  return Number(n).toLocaleString('en-US') + ' lbs';
}

function getStatus(wp, rows) {
  const row = rows.find(r => r.waypoint === wp);
  if (!row) return 'pending';
  if (row.actualTime) return 'logged';
  if (row.plannedEta) {
    // Parse plannedEta like "0255Z" — overdue if current UTC > planned + 15min
    const match = row.plannedEta.match(/^(\d{2})(\d{2})Z?$/);
    if (match) {
      const now = new Date();
      const planned = new Date();
      planned.setUTCHours(parseInt(match[1], 10));
      planned.setUTCMinutes(parseInt(match[2], 10));
      planned.setUTCSeconds(0);
      // Handle day rollover: if planned time is in the past by more than 12h, it's next day
      if (now - planned > 12 * 3600 * 1000) planned.setUTCDate(planned.getUTCDate() + 1);
      if (planned - now < -15 * 60 * 1000) return 'overdue';
    }
  }
  return 'pending';
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function OceanicLog() {
  const LS_KEY = 'opsai_oceanic_crossing';

  const loadFromStorage = () => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return null;
  };

  const [crossing, setCrossing] = useState(() => loadFromStorage()?.crossing || DEFAULT_CROSSING);
  const [rows, setRows] = useState(() => loadFromStorage()?.rows || []);
  const [planOpen, setPlanOpen] = useState(false);
  const [editCrossing, setEditCrossing] = useState(false);
  const [draftPlan, setDraftPlan] = useState({ ...DEFAULT_CROSSING });
  const [editingCell, setEditingCell] = useState(null); // { rowIdx, field }
  const [editingVal, setEditingVal] = useState('');
  const [reportText, setReportText] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  // Initialize rows from crossing waypoints if none stored
  useEffect(() => {
    if (!loadFromStorage()?.rows) {
      buildRows(DEFAULT_CROSSING);
    }
  }, []);

  function buildRows(c) {
    const wps = parseWaypoints(c.waypointsRaw);
    const newRows = wps.map(wp => ({
      waypoint: wp,
      isOceanic: isOceanicFix(wp),
      plannedEta: DEFAULT_PLANNED_TIMES[wp] || '',
      actualTime: '',
      fl: '',
      mach: '',
      fuel: '',
      winds: '',
      oat: '',
    }));
    setRows(newRows);
    return newRows;
  }

  function save(c, r) {
    localStorage.setItem(LS_KEY, JSON.stringify({ crossing: c, rows: r }));
  }

  function handleLoadPlan() {
    const newCrossing = { ...draftPlan };
    const newRows = buildRows(newCrossing);
    setCrossing(newCrossing);
    save(newCrossing, newRows);
    setPlanOpen(false);
    setEditCrossing(false);
  }

  function startEdit(rowIdx, field, currentVal) {
    setEditingCell({ rowIdx, field });
    setEditingVal(currentVal || '');
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function commitEdit() {
    if (!editingCell) return;
    const updated = rows.map((r, i) =>
      i === editingCell.rowIdx ? { ...r, [editingCell.field]: editingVal } : r
    );
    setRows(updated);
    save(crossing, updated);
    setEditingCell(null);
    setEditingVal('');
  }

  function handleCellKey(e) {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') { setEditingCell(null); setEditingVal(''); }
  }

  function generateReport() {
    const oceanicRows = rows.filter(r => r.isOceanic);
    if (oceanicRows.length === 0) {
      setReportText('No oceanic fixes logged yet.');
      setReportOpen(true);
      return;
    }
    const lines = [`POSITION REPORT — ${crossing.tail}`, `ROUTE: ${crossing.dep} → ${crossing.arr}`, `ETD: ${crossing.etd}  ETA: ${crossing.eta}`, ''];
    for (const r of oceanicRows) {
      const status = r.actualTime ? `ATA: ${r.actualTime}` : `ETA: ${r.plannedEta || 'TBD'}`;
      const fl = r.fl ? `FL${r.fl}` : 'FL—';
      const mach = r.mach ? `M.${r.mach.replace(/^M\.?/i, '')}` : 'M.—';
      const fuel = r.fuel ? `FUEL: ${Number(r.fuel).toLocaleString()} lbs` : '';
      const winds = r.winds ? `WINDS: ${r.winds}` : '';
      const oat = r.oat ? `OAT: ${r.oat}` : '';
      lines.push([r.waypoint, status, fl, mach, fuel, winds, oat].filter(Boolean).join('  '));
    }
    setReportText(lines.join('\n'));
    setReportOpen(true);
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  }

  // ─── Derived state ─────────────────────────────────────────────────────────
  const waypoints = parseWaypoints(crossing.waypointsRaw);
  const oceanicRows = rows.filter(r => r.isOceanic);
  const loggedCount = oceanicRows.filter(r => r.actualTime).length;

  // Fuel bar: find last logged fuel entry among oceanic rows
  const lastFuelEntry = [...rows].reverse().find(r => r.fuel && r.isOceanic);
  const currentFuel = lastFuelEntry ? parseFloat(lastFuelEntry.fuel.replace(/,/g, '')) : crossing.blockFuel;
  const fuelRange = crossing.blockFuel - crossing.landingFuel;
  const fuelPct = Math.min(100, Math.max(0, ((currentFuel - crossing.landingFuel) / fuelRange) * 100));

  // Status colors
  const statusColors = { 'PRE-FLIGHT': '#4a90d9', 'IN PROGRESS': '#c8a84b', 'COMPLETE': '#4caf82' };

  return (
    <div className="oceanic-log">

      {/* ── Active Crossing Header ─────────────────────────────────── */}
      <div className="ol-header-card">
        <div className="ol-header-top">
          <div className="ol-flight-id">
            <span className="ol-tail">{crossing.tail}</span>
            <span className="ol-arrow">→</span>
            <span className="ol-route">{crossing.dep} → {crossing.arr}</span>
          </div>
          <div className="ol-header-right">
            <span
              className="ol-status-badge"
              style={{ borderColor: statusColors[crossing.status] || '#c8a84b', color: statusColors[crossing.status] || '#c8a84b' }}
            >
              {crossing.status}
            </span>
            <button className="ol-btn-sm" onClick={() => { setDraftPlan({ ...crossing }); setEditCrossing(true); setPlanOpen(true); }}>
              ✎ EDIT
            </button>
          </div>
        </div>
        <div className="ol-header-meta">
          <div className="ol-meta-item"><span className="ol-meta-label">ETD</span><span className="ol-meta-val">{crossing.etd}</span></div>
          <div className="ol-meta-sep">|</div>
          <div className="ol-meta-item"><span className="ol-meta-label">ETA</span><span className="ol-meta-val">{crossing.eta}</span></div>
          <div className="ol-meta-sep">|</div>
          <div className="ol-meta-item"><span className="ol-meta-label">BLOCK FUEL</span><span className="ol-meta-val">{fmtFuel(crossing.blockFuel)}</span></div>
          <div className="ol-meta-sep">|</div>
          <div className="ol-meta-item"><span className="ol-meta-label">LDG FUEL MIN</span><span className="ol-meta-val">{fmtFuel(crossing.landingFuel)}</span></div>
        </div>
        <div className="ol-header-actions">
          <button className="ol-btn" onClick={() => { setDraftPlan({ ...crossing }); setPlanOpen(o => !o); }}>
            {planOpen ? '▲ HIDE FLIGHT PLAN' : '▼ FLIGHT PLAN ENTRY'}
          </button>
          <button className="ol-btn ol-btn-gold" onClick={generateReport}>
            📋 GENERATE POSITION REPORT
          </button>
          <div className="ol-oceanic-count">
            {loggedCount}/{oceanicRows.length} OCEANIC FIXES LOGGED
          </div>
        </div>
      </div>

      {/* ── Flight Plan Entry Panel ────────────────────────────────── */}
      {planOpen && (
        <div className="ol-plan-panel">
          <div className="ol-plan-title">FLIGHT PLAN ENTRY</div>
          <div className="ol-plan-grid">
            <label className="ol-plan-field">
              <span>AIRCRAFT</span>
              <input value={draftPlan.tail} onChange={e => setDraftPlan(p => ({ ...p, tail: e.target.value.toUpperCase() }))} placeholder="N45BP" />
            </label>
            <label className="ol-plan-field">
              <span>DEPARTURE</span>
              <input value={draftPlan.dep} onChange={e => setDraftPlan(p => ({ ...p, dep: e.target.value.toUpperCase() }))} placeholder="KADS" />
            </label>
            <label className="ol-plan-field">
              <span>DESTINATION</span>
              <input value={draftPlan.arr} onChange={e => setDraftPlan(p => ({ ...p, arr: e.target.value.toUpperCase() }))} placeholder="LSGG" />
            </label>
            <label className="ol-plan-field">
              <span>ETD (Z)</span>
              <input value={draftPlan.etd} onChange={e => setDraftPlan(p => ({ ...p, etd: e.target.value }))} placeholder="2345Z 11 MAR 2026" />
            </label>
            <label className="ol-plan-field">
              <span>ETA (Z)</span>
              <input value={draftPlan.eta} onChange={e => setDraftPlan(p => ({ ...p, eta: e.target.value }))} placeholder="0844Z 12 MAR 2026" />
            </label>
            <label className="ol-plan-field">
              <span>BLOCK FUEL (lbs)</span>
              <input type="number" value={draftPlan.blockFuel} onChange={e => setDraftPlan(p => ({ ...p, blockFuel: parseFloat(e.target.value) || 0 }))} placeholder="89680" />
            </label>
            <label className="ol-plan-field">
              <span>LDG FUEL MIN (lbs)</span>
              <input type="number" value={draftPlan.landingFuel} onChange={e => setDraftPlan(p => ({ ...p, landingFuel: parseFloat(e.target.value) || 0 }))} placeholder="62191" />
            </label>
            <label className="ol-plan-field">
              <span>STATUS</span>
              <select value={draftPlan.status} onChange={e => setDraftPlan(p => ({ ...p, status: e.target.value }))}>
                <option>PRE-FLIGHT</option>
                <option>IN PROGRESS</option>
                <option>COMPLETE</option>
              </select>
            </label>
          </div>
          <label className="ol-plan-field ol-plan-field-wide">
            <span>WAYPOINTS (comma or newline separated — oceanic fixes auto-detected)</span>
            <textarea
              rows={4}
              value={draftPlan.waypointsRaw}
              onChange={e => setDraftPlan(p => ({ ...p, waypointsRaw: e.target.value }))}
              placeholder="KADS, MLC, FAM, ..., 51N050W, 52N040W, ..., LSGG"
            />
          </label>
          <div className="ol-plan-preview">
            {parseWaypoints(draftPlan.waypointsRaw).map(wp => (
              <span key={wp} className={`ol-wp-chip${isOceanicFix(wp) ? ' oceanic' : ''}`}>{wp}</span>
            ))}
          </div>
          <button className="ol-btn ol-btn-gold ol-load-btn" onClick={handleLoadPlan}>⬆ LOAD PLAN</button>
        </div>
      )}

      {/* ── Oceanic Fixes Summary Card ─────────────────────────────── */}
      <div className="ol-oceanic-card">
        <span className="ol-oc-label">{oceanicRows.length} OCEANIC FIXES</span>
        <div className="ol-oc-fixes">
          {oceanicRows.map(r => {
            const st = getStatus(r.waypoint, rows);
            return (
              <span key={r.waypoint} className={`ol-oc-fix ol-oc-fix-${st}`}>
                {r.waypoint} {st === 'logged' ? '✅' : st === 'overdue' ? '⚠️' : '⏳'}
              </span>
            );
          })}
          {oceanicRows.length === 0 && <span className="ol-oc-empty">No oceanic fixes in route</span>}
        </div>
      </div>

      {/* ── Fuel Burn Tracker ─────────────────────────────────────── */}
      <div className="ol-fuel-card">
        <div className="ol-fuel-title">FUEL BURN TRACKER</div>
        <div className="ol-fuel-bar-wrap">
          <div className="ol-fuel-bar-bg">
            {/* Oceanic waypoint fuel markers */}
            {oceanicRows.map(r => {
              const plannedFuel = DEFAULT_PLANNED_FUEL[r.waypoint];
              if (!plannedFuel) return null;
              const pct = Math.min(100, Math.max(0, ((plannedFuel - crossing.landingFuel) / fuelRange) * 100));
              return (
                <div
                  key={r.waypoint}
                  className="ol-fuel-marker"
                  style={{ left: `${pct}%` }}
                  title={`${r.waypoint}: ${fmtFuel(plannedFuel)}`}
                >
                  <div className="ol-fuel-marker-line" />
                  <div className="ol-fuel-marker-label">{r.waypoint.replace(/(\d{2}[NS])(\d{3}[EW])/, '$1\n$2')}</div>
                </div>
              );
            })}
            {/* Current fuel fill */}
            <div className="ol-fuel-fill" style={{ width: `${fuelPct}%` }} />
            {/* Current fuel indicator */}
            <div className="ol-fuel-current" style={{ left: `${fuelPct}%` }} />
          </div>
          <div className="ol-fuel-labels">
            <span className="ol-fuel-label-left">BLOCK {fmtFuel(crossing.blockFuel)}</span>
            <span className="ol-fuel-label-right">LDG MIN {fmtFuel(crossing.landingFuel)}</span>
          </div>
          <div className="ol-fuel-current-label">
            CURRENT EST: <strong>{fmtFuel(Math.round(currentFuel))}</strong>
          </div>
        </div>
      </div>

      {/* ── Position Report Table ─────────────────────────────────── */}
      <div className="ol-table-card">
        <div className="ol-table-title">POSITION LOG</div>
        <div className="ol-table-wrap">
          <table className="ol-table">
            <thead>
              <tr>
                <th>WAYPOINT</th>
                <th>TYPE</th>
                <th>PLANNED ETA (Z)</th>
                <th>ACTUAL TIME (Z)</th>
                <th>FL</th>
                <th>MACH</th>
                <th>FUEL (lbs)</th>
                <th>WINDS</th>
                <th>OAT</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const st = getStatus(row.waypoint, rows);
                const isEditing = (field) => editingCell?.rowIdx === idx && editingCell?.field === field;
                const cell = (field, placeholder) => (
                  isEditing(field)
                    ? <input
                        ref={inputRef}
                        className="ol-cell-input"
                        value={editingVal}
                        onChange={e => setEditingVal(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={handleCellKey}
                        placeholder={placeholder}
                      />
                    : <span
                        className={`ol-cell-editable${row[field] ? ' filled' : ''}`}
                        onClick={() => startEdit(idx, field, row[field])}
                        title="Click to edit"
                      >
                        {row[field] || <span className="ol-cell-placeholder">{placeholder}</span>}
                      </span>
                );

                return (
                  <tr key={row.waypoint + idx} className={row.isOceanic ? 'ol-row-oceanic' : ''}>
                    <td>
                      <span className="ol-wp-name">{row.waypoint}</span>
                      {row.isOceanic && <span className="ol-oceanic-badge">⬛</span>}
                    </td>
                    <td className="ol-type">
                      {row.isOceanic
                        ? <span className="ol-type-oceanic">OCEANIC</span>
                        : <span className="ol-type-dom">DOMESTIC</span>}
                    </td>
                    <td className="mono">{row.plannedEta || '—'}</td>
                    <td className="mono">{cell('actualTime', 'HHMMz')}</td>
                    <td className="mono">{cell('fl', 'e.g. 410')}</td>
                    <td className="mono">{cell('mach', '.85')}</td>
                    <td className="mono">{cell('fuel', '80000')}</td>
                    <td className="mono">{cell('winds', '280/45')}</td>
                    <td className="mono">{cell('oat', '-52C')}</td>
                    <td>
                      {st === 'logged' && <span className="ol-status logged">✅ LOGGED</span>}
                      {st === 'overdue' && <span className="ol-status overdue">⚠️ OVERDUE</span>}
                      {st === 'pending' && <span className="ol-status pending">⏳ PENDING</span>}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={10} className="ol-empty">Load a flight plan to populate waypoints.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Position Report Modal ─────────────────────────────────── */}
      {reportOpen && (
        <div className="ol-modal-overlay" onClick={() => setReportOpen(false)}>
          <div className="ol-modal" onClick={e => e.stopPropagation()}>
            <div className="ol-modal-header">
              <span>POSITION REPORT</span>
              <button className="ol-modal-close" onClick={() => setReportOpen(false)}>✕</button>
            </div>
            <pre className="ol-report-text">{reportText}</pre>
            <div className="ol-modal-actions">
              <button className="ol-btn ol-btn-gold" onClick={copyReport}>
                {copied ? '✅ COPIED!' : '📋 COPY TO CLIPBOARD'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
