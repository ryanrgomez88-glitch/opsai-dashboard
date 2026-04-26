import { useReducer, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../lib/DataContext';

// ─── Entity definitions ──────────────────────────────────
const ENTITY_DEFS = {
  POU: { name: 'Ben & Ashleigh',     color: '#6FB8FF', classification: '1099' },
  IGN: { name: 'Ignite Global',      color: '#FFB547', classification: '1099' },
  NAV: { name: 'Navaah',             color: '#00D68F', classification: '1099' },
  POC: { name: 'Pogue Construction', color: '#C77DFF', classification: '1099' },
  HOPE:{ name: 'Hope Mission',       color: '#FF7B9C', classification: '501c3' },
  RJS: { name: 'Internal / RJS',     color: '#F5F5F5', classification: 'W2'   },
};

// ─── Aircraft definitions ────────────────────────────────
const AIRCRAFT_DEFS = {
  'N45BP':  { type: 'Global Express', code: 'GLEX', status: 'available' },
  'N590MS': { type: 'Global Express', code: 'GLEX', status: 'available' },
  'N908SC': { type: 'Cessna Cardinal RG', code: 'C177', status: 'available' },
};

// ─── Extract entity code from trip number ────────────────
function extractEntity(tripNumber) {
  if (!tripNumber) return 'RJS';
  const m = tripNumber.match(/^\d+([A-Z]+)-N\d+/);
  if (m) return m[1];
  if (tripNumber.startsWith('MSG-')) return 'RJS';
  if (tripNumber.startsWith('HOPE-')) return 'HOPE';
  return 'RJS';
}

// ─── Filter reducer ──────────────────────────────────────
function filterReducer(state, action) {
  switch (action.type) {
    case 'SET_AIRCRAFT': return { ...state, aircraft: action.value };
    case 'SET_ENTITY':   return { ...state, entity: action.value };
    default: return state;
  }
}

// ─── Greeting lookup table ───────────────────────────────
function getGreeting(filter, stats, filteredTrips) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const { aircraft, entity } = filter;
  const key = `${aircraft}|${entity}`;
  const mtdCost = filteredTrips.reduce((s, t) => s + (t._cost || 0), 0);

  const lookup = {
    'all|all':    `Fleet-wide · ${stats.N45BP?.trips + stats.N590MS?.trips || 0}+ trips logged in 2026.`,
    'N45BP|all':  `N45BP · ${stats.N45BP?.trips || 0} trips, ${fmt$(stats.N45BP?.totalCost || 0)} ops cost YTD. ${fmtHrs(stats.N45BP?.blockHours || 0)} block hours.`,
    'N590MS|all': `N590MS · ${stats.N590MS?.trips || 0} trips, ${fmt$(stats.N590MS?.totalCost || 0)} ops cost YTD. ${fmtHrs(stats.N590MS?.flightHours || 0)} flight hours.`,
    'N908SC|all': `N908SC Cardinal · training and mission ops. ${filteredTrips.length} trips on record.`,
    'all|POU':    `Ben & Ashleigh · ${filteredTrips.length} trips across fleet. ${fmt$(mtdCost)} in logged expenses.`,
    'all|IGN':    `Ignite Global · ${filteredTrips.length} trips. Charter and corporate ops.`,
    'all|NAV':    `Navaah · ${filteredTrips.length} trips on record.`,
    'all|POC':    `Pogue Construction · ${filteredTrips.length} trips on record.`,
    'all|HOPE':   `Hope Mission · ${filteredTrips.length} charitable ops trips. N908SC primary.`,
    'all|RJS':    `Internal / RJS ops · ${filteredTrips.length} trips. N590MS corporate block.`,
    'N45BP|POU':  `N45BP · Ben & Ashleigh · ${filteredTrips.length} trips. Primary client block.`,
    'N45BP|IGN':  `N45BP · Ignite Global · ${filteredTrips.length} trips logged. Charter ops.`,
    'N590MS|RJS': `N590MS corporate block · ${filteredTrips.length} trips. Internal scheduling.`,
    'N908SC|HOPE':`N908SC · Hope Mission charitable ops · ${filteredTrips.length} trips.`,
  };

  const subtext = lookup[key] || `Filtered to ${aircraft === 'all' ? 'All Fleet' : aircraft} · ${entity === 'all' ? 'All Clients' : (ENTITY_DEFS[entity]?.name || entity)}.`;
  return { greeting, subtext };
}

// ─── Formatters ──────────────────────────────────────────
function fmt$(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}
function fmtHrs(n) {
  if (!n && n !== 0) return '—';
  return `${Number(n).toFixed(1)} hr`;
}
function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── MTD helpers ────────────────────────────────────────
function isMTD(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

// ─── Flash panels ────────────────────────────────────────
function useFlash(deps) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('panel-flash');
    void el.offsetWidth;
    el.classList.add('panel-flash');
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return ref;
}

// ─── Main component ──────────────────────────────────────
export default function OverviewDashboard() {
  const { data, loading } = useData();
  const navigate = useNavigate();
  const ottoRef = useRef(null);
  const [filter, dispatch] = useReducer(filterReducer, { aircraft: 'all', entity: 'all' });

  // ── Global ⌘K shortcut
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        ottoRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Enrich trips with entity + cost
  const allTrips = useMemo(() => {
    if (!data?.recentTrips) return [];
    const expByTrip = {};
    (data.expenses || []).forEach(e => {
      expByTrip[e.trip_number] = (expByTrip[e.trip_number] || 0) + Number(e.amount || 0);
    });
    return data.recentTrips.map(t => ({
      ...t,
      entity: extractEntity(t.trip_number),
      _cost: expByTrip[t.trip_number] || 0,
    }));
  }, [data]);

  // ── Derived entity list (stable order)
  const entityList = useMemo(() => {
    const seen = new Set();
    const out = [];
    allTrips.forEach(t => {
      if (!seen.has(t.entity)) { seen.add(t.entity); out.push(t.entity); }
    });
    return out;
  }, [allTrips]);

  // ── Filtered trips
  const filteredTrips = useMemo(() => {
    return allTrips.filter(t => {
      const okAc  = filter.aircraft === 'all' || t.tail   === filter.aircraft;
      const okEnt = filter.entity   === 'all' || t.entity === filter.entity;
      return okAc && okEnt;
    });
  }, [allTrips, filter]);

  // ── KPIs
  const kpis = useMemo(() => {
    const stats = data?.stats || {};
    const expFiltered = (data?.expenses || []).filter(e => {
      const trip = allTrips.find(t => t.trip_number === e.trip_number);
      if (!trip) return filter.aircraft === 'all' && filter.entity === 'all';
      const okAc  = filter.aircraft === 'all' || trip.tail   === filter.aircraft;
      const okEnt = filter.entity   === 'all' || trip.entity === filter.entity;
      return okAc && okEnt;
    });
    const mtdExp  = expFiltered.filter(e => isMTD(e.date));
    const revenue = mtdExp.reduce((s, e) => s + Number(e.amount || 0), 0);

    let blockHours = 0;
    if (filter.aircraft === 'all') {
      blockHours = Object.values(stats).reduce((s, v) => s + (v.blockHours || 0), 0);
    } else {
      blockHours = stats[filter.aircraft]?.blockHours || filteredTrips.length * 3.2;
    }

    const tripCount = filteredTrips.length;
    const reconPct  = tripCount > 0 ? Math.round((filteredTrips.filter(t => t.status === 'completed' || t.status === 'complete').length / tripCount) * 100) : 0;
    const unmatched = tripCount - filteredTrips.filter(t => t.status === 'completed' || t.status === 'complete').length;

    return { revenue, tripCount, blockHours, reconPct, unmatched };
  }, [data, filteredTrips, allTrips, filter]);

  // ── Expense mix (MTD only)
  const expenseMix = useMemo(() => {
    const expFiltered = (data?.expenses || []).filter(e => {
      if (!isMTD(e.date)) return false;
      const trip = allTrips.find(t => t.trip_number === e.trip_number);
      if (!trip) return filter.aircraft === 'all' && filter.entity === 'all';
      const okAc  = filter.aircraft === 'all' || trip.tail   === filter.aircraft;
      const okEnt = filter.entity   === 'all' || trip.entity === filter.entity;
      return okAc && okEnt;
    });
    const bycat = {};
    expFiltered.forEach(e => {
      const cat = e.category || 'Other';
      bycat[cat] = (bycat[cat] || 0) + Number(e.amount || 0);
    });
    const total = Object.values(bycat).reduce((s, v) => s + v, 0);
    return Object.entries(bycat)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 7)
      .map(([category, amount]) => ({
        category,
        amount,
        pct: total > 0 ? Math.round((amount / total) * 100) : 0,
      }));
  }, [data, allTrips, filter]);

  // ── Greeting
  const { greeting, subtext } = useMemo(() => getGreeting(filter, data?.stats || {}, filteredTrips), [filter, data, filteredTrips]);

  // ── MTD trip count (for entity bar meta)
  const mtdTripCount = useMemo(() => filteredTrips.filter(t => isMTD(t.date)).length, [filteredTrips]);

  // ── Flash refs
  const kpiFlashRef   = useFlash([filter.aircraft, filter.entity]);
  const tripFlashRef  = useFlash([filter.aircraft, filter.entity]);
  const panelFlashRef = useFlash([filter.aircraft, filter.entity]);

  const setAircraft = useCallback(v => dispatch({ type: 'SET_AIRCRAFT', value: v }), []);
  const setEntity   = useCallback(v => dispatch({ type: 'SET_ENTITY',   value: v }), []);

  const aircraft = data?.aircraft || [];

  // ── Activity fixtures
  const activityFeed = useMemo(() => buildActivity(filteredTrips, filter, data), [filteredTrips, filter, data]);

  return (
    <div style={{
      maxWidth: 1200,
      margin: '0 auto',
      padding: '40px 56px 100px',
    }}>
      {/* ─── Section 1: Header ────────────────────────────── */}
      <Header filter={filter} aircraft={aircraft} navigate={navigate} />

      {/* ─── Section 2: Greeting ──────────────────────────── */}
      <GreetingBlock greeting={greeting} subtext={subtext} />

      {/* ─── Section 3: Filter Stack ──────────────────────── */}
      <FilterStack
        filter={filter}
        setAircraft={setAircraft}
        setEntity={setEntity}
        aircraft={aircraft}
        entityList={entityList}
        mtdTripCount={mtdTripCount}
        allTrips={allTrips}
      />

      {/* ─── Section 4: KPI Row ───────────────────────────── */}
      <div ref={kpiFlashRef} style={{ marginBottom: 56 }}>
        <KPIRow kpis={kpis} loading={loading} />
      </div>

      {/* ─── Section 5: Trip List ─────────────────────────── */}
      <div ref={tripFlashRef} style={{ marginBottom: 56 }}>
        <TripList trips={filteredTrips} filter={filter} loading={loading} navigate={navigate} />
      </div>

      {/* ─── Section 6: Two-Up Panels ─────────────────────── */}
      <div
        ref={panelFlashRef}
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}
      >
        <ExpenseMixPanel data={expenseMix} filter={filter} loading={loading} />
        <ActivityFeedPanel feed={activityFeed} loading={loading} />
      </div>

      {/* ─── Section 7: Otto Command Bar ──────────────────── */}
      <OttoBar ottoRef={ottoRef} />
    </div>
  );
}

// ─── Header ──────────────────────────────────────────────
function Header({ filter, aircraft, navigate }) {
  const tail   = filter.aircraft !== 'all' ? filter.aircraft : (aircraft[0]?.tail || 'N45BP');
  const navItems = ['Overview', 'Operations', 'Calendar', 'Expenses', 'Invoices', 'Reconcile'];
  const pathMap  = { Overview: '/', Operations: '/flight-log', Calendar: '/calendar', Expenses: '/expenses', Invoices: '/jobs', Reconcile: '/budget' };
  const active   = 'Overview';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 24,
      borderBottom: '1px solid var(--line)',
      marginBottom: 36,
    }}>
      {/* Left: logo + ticker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Logo */}
        <span style={{ fontSize: 18, letterSpacing: '-0.02em' }}>
          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Ops</span>
          <span style={{ fontWeight: 500, fontStyle: 'italic', color: 'var(--blue)' }}>AI</span>
        </span>

        {/* Status ticker */}
        <div style={{
          borderLeft: '1px solid var(--line)',
          paddingLeft: 16,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          color: 'var(--ink-dim)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span className="pulse-dot" />
          <span>
            <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{tail} · KADS · Available</span>
            <span style={{ color: 'var(--ink-faded)' }}> / </span>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase()}
            <span style={{ color: 'var(--ink-faded)' }}> · </span>
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
        </div>
      </div>

      {/* Right: nav */}
      <nav style={{ display: 'flex', gap: 4 }}>
        {navItems.map(item => (
          <button
            key={item}
            onClick={() => navigate(pathMap[item] || '/')}
            style={{
              padding: '7px 13px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              background: item === active ? 'var(--blue-soft)' : 'transparent',
              color: item === active ? 'var(--blue)' : 'var(--ink-dim)',
              transition: 'all 100ms',
            }}
            onMouseEnter={e => { if (item !== active) { e.target.style.background = 'var(--navy-2)'; e.target.style.color = 'var(--ink)'; } }}
            onMouseLeave={e => { if (item !== active) { e.target.style.background = 'transparent'; e.target.style.color = 'var(--ink-dim)'; } }}
          >
            {item}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ─── Greeting Block ───────────────────────────────────────
function GreetingBlock({ greeting, subtext }) {
  const hour = new Date().getHours();
  const name = 'Ryan';
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{
        fontSize: 36,
        fontWeight: 500,
        letterSpacing: '-0.03em',
        lineHeight: 1.15,
        color: 'var(--ink)',
        margin: 0,
      }}>
        {greeting}, <span style={{ color: 'var(--blue)' }}>{name}</span>.{' '}
        <span style={{ color: 'var(--ink-dim)', fontWeight: 400 }}>{subtext}</span>
      </h1>
      <p style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 13,
        color: 'var(--ink-dim)',
        marginTop: 8,
        marginBottom: 0,
      }}>
        METAR KADS · Wind 180/08 · VIS 10SM · 24/14 · A2995
      </p>
    </div>
  );
}

// ─── Filter Stack ─────────────────────────────────────────
function FilterStack({ filter, setAircraft, setEntity, aircraft, entityList, mtdTripCount, allTrips }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
      {/* Aircraft bar */}
      <FilterBar
        axis="AIRCRAFT"
        items={[
          {
            id: 'all',
            label: 'All Fleet',
            badge: aircraft.length,
            isAll: true,
          },
          ...aircraft.map(ac => ({
            id: ac.tail,
            tail: ac.tail,
            code: AIRCRAFT_DEFS[ac.tail]?.code || 'AC',
            status: AIRCRAFT_DEFS[ac.tail]?.status || 'available',
          })),
        ]}
        active={filter.aircraft}
        onSelect={setAircraft}
        meta={null}
      />

      {/* Entity bar */}
      <FilterBar
        axis="ENTITY"
        items={[
          {
            id: 'all',
            label: 'All Clients',
            badge: entityList.length,
            isAll: true,
          },
          ...entityList.map(code => ({
            id: code,
            name: ENTITY_DEFS[code]?.name || code,
            color: ENTITY_DEFS[code]?.color || '#F5F5F5',
            classification: ENTITY_DEFS[code]?.classification || '1099',
          })),
        ]}
        active={filter.entity}
        onSelect={setEntity}
        meta={
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-faded)', paddingRight: 14 }}>
            <span style={{ color: 'var(--blue)', fontWeight: 600 }}>{mtdTripCount}</span> trips · MTD
          </span>
        }
      />
    </div>
  );
}

function FilterBar({ axis, items, active, onSelect, meta }) {
  return (
    <div style={{
      background: 'var(--navy)',
      border: '1px solid var(--line)',
      borderRadius: 12,
      padding: 6,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {/* Axis label */}
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: '0.18em',
        color: 'var(--ink-faded)',
        padding: '0 14px 0 12px',
        borderRight: '1px solid var(--line)',
        marginRight: 6,
        alignSelf: 'stretch',
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
      }}>
        {axis}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, flex: 1, overflowX: 'auto' }} className="no-scrollbar">
        {items.map(item => {
          const isActive = active === item.id;
          return (
            <FilterTab
              key={item.id}
              item={item}
              isActive={isActive}
              onSelect={() => onSelect(item.id)}
            />
          );
        })}
      </div>

      {/* Right meta */}
      {meta && <div>{meta}</div>}
    </div>
  );
}

function FilterTab({ item, isActive, onSelect }) {
  const baseStyle = {
    padding: '9px 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    whiteSpace: 'nowrap',
    transition: 'all 100ms',
    background: isActive ? 'linear-gradient(135deg, var(--blue-deep) 0%, #1976D2 100%)' : 'transparent',
    color: isActive ? 'var(--ink)' : 'var(--ink-dim)',
    boxShadow: isActive ? '0 0 0 1px rgba(77,168,255,0.3), 0 4px 14px rgba(33,150,243,0.25)' : 'none',
  };

  if (item.isAll) {
    return (
      <button style={baseStyle} onClick={onSelect}>
        {item.label}
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          padding: '2px 6px', background: 'var(--bg)', borderRadius: 4,
          color: isActive ? 'var(--ink)' : 'var(--ink-faded)',
        }}>{item.badge}</span>
      </button>
    );
  }

  if (item.tail) {
    // Aircraft tab
    const dotColor = item.status === 'flying' ? 'var(--blue)' : item.status === 'maintenance' ? 'var(--amber)' : 'var(--green)';
    return (
      <button style={baseStyle} onClick={onSelect}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{item.tail}</span>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          padding: '2px 6px', background: 'var(--bg)', borderRadius: 4,
          color: isActive ? 'var(--ink)' : 'var(--ink-faded)',
        }}>{item.code}</span>
      </button>
    );
  }

  // Entity tab
  return (
    <button style={baseStyle} onClick={onSelect}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
      {item.name}
      <span style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
        padding: '2px 6px', background: 'var(--bg)', borderRadius: 4,
        color: isActive ? 'var(--ink)' : 'var(--ink-faded)',
      }}>{item.classification}</span>
    </button>
  );
}

// ─── KPI Row ──────────────────────────────────────────────
function KPIRow({ kpis, loading }) {
  const { revenue, tripCount, blockHours, reconPct, unmatched } = kpis;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {/* Revenue — featured card */}
      <div style={{
        background: 'linear-gradient(135deg, #0F2A47 0%, #1A3D5F 100%)',
        border: '1px solid rgba(77, 168, 255, 0.2)',
        borderRadius: 10,
        padding: '22px 24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px rgba(33,150,243,0.06)',
        transition: 'transform 150ms, border-color 150ms',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, var(--blue), transparent)',
          opacity: 0.6,
        }} />
        <KPIInner
          label="Ops Cost · MTD"
          value={loading ? null : fmt$(revenue)}
          delta={{ text: revenue > 0 ? `${fmt$(revenue)} this month` : 'No MTD expenses yet', positive: false }}
          featured
        />
      </div>

      {/* Trips */}
      <KPICard
        label="Trips"
        value={loading ? null : String(tripCount)}
        suffix={`/ ${tripCount}`}
        delta={{ text: `${tripCount} in current view`, neutral: true }}
        loading={loading}
      />

      {/* Block Hours */}
      <KPICard
        label="Block Hours"
        value={loading ? null : fmtHrs(blockHours)}
        delta={{ text: 'YTD 2026', neutral: true }}
        loading={loading}
      />

      {/* Reconciled */}
      <KPICard
        label="Reconciled"
        value={loading ? null : reconPct > 0 ? String(reconPct) : '—'}
        suffix={reconPct > 0 ? '%' : ''}
        delta={{ text: unmatched > 0 ? `${unmatched} trips unmatched` : 'All matched', amber: unmatched > 0 }}
        loading={loading}
      />
    </div>
  );
}

function KPICard({ label, value, suffix, delta, loading }) {
  return (
    <div style={{
      background: 'var(--navy)',
      border: '1px solid var(--line)',
      borderRadius: 10,
      padding: '22px 24px',
      transition: 'transform 150ms, border-color 150ms',
      cursor: 'default',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--line-bright)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.transform = 'none'; }}
    >
      <KPIInner label={label} value={value} suffix={suffix} delta={delta} loading={loading} />
    </div>
  );
}

function KPIInner({ label, value, suffix, delta, featured, loading }) {
  return (
    <>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: 'var(--ink-faded)',
        marginBottom: 14,
      }}>{label}</div>

      {loading ? (
        <div className="skeleton" style={{ height: 36, width: 120, marginBottom: 8 }} />
      ) : (
        <div style={{
          fontSize: 30,
          fontWeight: 500,
          letterSpacing: '-0.025em',
          lineHeight: 1,
          marginBottom: 8,
          fontFeatureSettings: '"tnum"',
          ...(featured ? {
            background: 'linear-gradient(135deg, #fff 0%, var(--blue) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          } : { color: 'var(--ink)' }),
        }}>
          {value || '—'}
          {suffix && (
            <span style={{
              fontSize: 16,
              fontWeight: 400,
              color: 'var(--ink-faded)',
              WebkitTextFillColor: 'var(--ink-faded)',
              marginLeft: 2,
            }}>{suffix}</span>
          )}
        </div>
      )}

      {delta && (
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          color: delta.amber ? 'var(--amber)' : delta.positive ? 'var(--green)' : 'var(--ink-dim)',
        }}>
          {delta.positive && '+'}
          {delta.text}
        </div>
      )}
    </>
  );
}

// ─── Trip List ────────────────────────────────────────────
function TripList({ trips, filter, loading, navigate }) {
  const acLabel  = filter.aircraft === 'all' ? 'All Fleet' : filter.aircraft;
  const entLabel = filter.entity   === 'all' ? 'All Clients' : (ENTITY_DEFS[filter.entity]?.name || filter.entity);

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
          Recent Trips · {acLabel} · {entLabel}
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textTransform: 'uppercase' }}>
          <span style={{ color: 'var(--blue)', fontWeight: 500, cursor: 'pointer' }} onClick={() => navigate('/trips')}>View all →</span>
        </span>
      </div>

      <div style={{
        background: 'var(--navy)',
        border: '1px solid var(--line)',
        borderRadius: 10,
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 20 }} />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--ink-dim)', fontSize: 13 }}>
            No trips for this combination yet.
          </div>
        ) : (
          trips.slice(0, 12).map((trip, i) => (
            <TripRow
              key={trip.trip_id || i}
              trip={trip}
              isLast={i === Math.min(trips.length, 12) - 1}
              navigate={navigate}
            />
          ))
        )}
      </div>
    </section>
  );
}

function TripRow({ trip, isLast, navigate }) {
  const entity = ENTITY_DEFS[trip.entity] || { name: trip.entity, color: '#F5F5F5' };
  const statusStyle = {
    complete:   { color: 'var(--green)',  bg: 'var(--green-soft)',  border: 'rgba(0,214,143,0.25)' },
    completed:  { color: 'var(--green)',  bg: 'var(--green-soft)',  border: 'rgba(0,214,143,0.25)' },
    invoiced:   { color: 'var(--blue)',   bg: 'var(--blue-soft)',   border: 'rgba(77,168,255,0.25)' },
    planned:    { color: 'var(--amber)',  bg: 'var(--amber-soft)',  border: 'rgba(255,181,71,0.25)' },
    open:       { color: 'var(--amber)',  bg: 'var(--amber-soft)',  border: 'rgba(255,181,71,0.25)' },
    review:     { color: 'var(--red)',    bg: 'var(--red-soft)',    border: 'rgba(255,92,124,0.25)' },
  }[trip.status?.toLowerCase()] || { color: 'var(--ink-dim)', bg: 'var(--navy-2)', border: 'var(--line)' };

  const icaos = [trip.dep, trip.arr].filter(Boolean).filter(x => x !== '—');

  return (
    <div
      onClick={() => navigate(`/trips/${trip.trip_id}`)}
      style={{
        display: 'grid',
        gridTemplateColumns: '80px 80px 1fr 180px 110px 110px 24px',
        gap: 14,
        padding: '16px 20px',
        borderBottom: isLast ? 'none' : '1px solid var(--line)',
        cursor: 'pointer',
        alignItems: 'center',
        transition: 'background 100ms',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--navy-2)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Trip ID */}
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {trip.trip_number}
      </span>

      {/* Tail */}
      <span style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 500,
        padding: '3px 8px', background: 'var(--navy-2)', border: '1px solid var(--line)',
        borderRadius: 4, width: 'fit-content', color: 'var(--ink-dim)',
      }}>
        {trip.tail || '—'}
      </span>

      {/* Route */}
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
        {icaos.length === 0 ? '—' : icaos.map((code, ci) => (
          <span key={ci}>
            {ci > 0 && <span style={{ color: 'var(--blue)', fontWeight: 400 }}> → </span>}
            {code}
          </span>
        ))}
      </span>

      {/* Client */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: entity.color, flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: 'var(--ink-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entity.name}
        </span>
      </div>

      {/* Status */}
      <span style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        padding: '4px 9px', borderRadius: 4,
        color: statusStyle.color, background: statusStyle.bg,
        border: `1px solid ${statusStyle.border}`,
        width: 'fit-content',
      }}>
        {trip.status || 'unknown'}
      </span>

      {/* Amount */}
      <span style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600,
        color: 'var(--ink)', textAlign: 'right', fontFeatureSettings: '"tnum"',
      }}>
        {trip._cost > 0 ? fmt$(trip._cost) : '—'}
      </span>

      {/* Chevron */}
      <span style={{ fontSize: 16, color: 'var(--ink-faded)', textAlign: 'right' }}>›</span>
    </div>
  );
}

// ─── Expense Mix Panel ────────────────────────────────────
function ExpenseMixPanel({ data, filter, loading }) {
  const scopeLabel = filter.aircraft !== 'all' ? filter.aircraft :
                     filter.entity   !== 'all' ? (ENTITY_DEFS[filter.entity]?.name || filter.entity) :
                     'All Fleet';
  return (
    <div style={{ background: 'var(--navy)', border: '1px solid var(--line)', borderRadius: 10, padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Expense Mix · MTD</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textTransform: 'uppercase', color: 'var(--ink-faded)' }}>{scopeLabel}</span>
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 20 }} />)}
        </div>
      ) : data.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--ink-dim)', fontSize: 13 }}>No expense data for this scope.</div>
      ) : (
        <div>
          {data.map((row, i) => (
            <div key={row.category} style={{
              display: 'grid', gridTemplateColumns: '110px 1fr 90px', gap: 16,
              padding: '12px 0',
              borderBottom: i < data.length - 1 ? '1px solid var(--line)' : 'none',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{row.category}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${row.pct}%` }} />
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 500, color: 'var(--ink)', textAlign: 'right', fontFeatureSettings: '"tnum"' }}>
                {fmt$(row.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Activity Feed Panel ──────────────────────────────────
function ActivityFeedPanel({ feed, loading }) {
  return (
    <div style={{ background: 'var(--navy)', border: '1px solid var(--line)', borderRadius: 10, padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Activity Feed</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textTransform: 'uppercase', color: 'var(--green)' }}>LIVE</span>
        </div>
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 40 }} />)}
        </div>
      ) : (
        feed.map((item, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '56px 1fr', gap: 18,
            padding: '14px 0',
            borderBottom: i < feed.length - 1 ? '1px solid var(--line)' : 'none',
            alignItems: 'start',
          }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 500, color: 'var(--ink-faded)', paddingTop: 2 }}>
              {item.time}
            </span>
            <div>
              <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}
                dangerouslySetInnerHTML={{ __html: item.body }} />
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--ink-dim)', marginTop: 4 }}>
                {item.meta}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Otto Command Bar ─────────────────────────────────────
function OttoBar({ ottoRef }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'min(640px, calc(100% - 48px))',
      background: 'linear-gradient(135deg, var(--navy) 0%, #122436 100%)',
      border: '1px solid var(--line-bright)',
      borderRadius: 14,
      padding: '14px 18px',
      zIndex: 100,
      boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    }}>
      {/* Otto avatar */}
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: 'linear-gradient(135deg, var(--blue) 0%, #6FB8FF 100%)',
        boxShadow: '0 0 20px rgba(77,168,255,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 700, fontSize: 14,
      }}>O</div>

      {/* Input */}
      <input
        ref={ottoRef}
        type="text"
        placeholder="Ask Otto… log fuel, generate invoice, MTD totals"
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontSize: 14,
          fontFamily: 'Geist, sans-serif',
          color: 'var(--ink)',
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' && e.target.value.trim()) {
            console.log('[Otto]', e.target.value);
            e.target.value = '';
          }
        }}
      />

      {/* Keyboard hint */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <kbd style={{ background: 'var(--navy-3)', padding: '2px 6px', borderRadius: 4, fontSize: 10, color: 'var(--ink-dim)', fontFamily: 'JetBrains Mono, monospace' }}>⌘</kbd>
        <kbd style={{ background: 'var(--navy-3)', padding: '2px 6px', borderRadius: 4, fontSize: 10, color: 'var(--ink-dim)', fontFamily: 'JetBrains Mono, monospace' }}>K</kbd>
      </div>
    </div>
  );
}

// ─── Activity builder ─────────────────────────────────────
function buildActivity(filteredTrips, filter, data) {
  const now = new Date();
  const feed = [];
  const expenses = data?.expenses || [];

  const recentExp = expenses.slice(0, 5).map(e => {
    const d = new Date(e.date);
    const diffDays = Math.floor((now - d) / 86400000);
    const time = diffDays === 0 ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) :
                 diffDays === 1 ? 'YDA' : `${diffDays}D`;
    return {
      time,
      body: `Expense logged · <span class="em">${e.category}</span> · <span class="em">${fmt$(e.amount)}</span>`,
      meta: `${e.vendor || 'Unknown vendor'} · ${e.trip_number || '—'}`,
    };
  });

  const recentTrips2 = filteredTrips.slice(0, 3).map(t => {
    const d = new Date(t.date);
    const diffDays = Math.floor((now - d) / 86400000);
    const time = diffDays === 0 ? 'Now' : diffDays === 1 ? 'YDA' : `${diffDays}D`;
    return {
      time,
      body: `Trip <span class="em">${t.trip_number}</span> · <span class="em">${t.tail}</span> · ${t.dep && t.dep !== '—' ? `<span class="em">${t.dep}</span> → <span class="em">${t.arr}</span>` : 'Route TBD'}`,
      meta: `Status: ${t.status || 'unknown'} · ${fmtDate(t.date)}`,
    };
  });

  return [...recentTrips2, ...recentExp].slice(0, 6);
}
