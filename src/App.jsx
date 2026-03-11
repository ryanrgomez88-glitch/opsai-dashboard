import { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import './App.css';

const API_BASE = 'https://web-production-d7336.up.railway.app';

function fmt$(n) {
  if (!n && n !== 0) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}
function fmtHrs(n) {
  if (!n && n !== 0) return '—';
  return Number(n).toFixed(1) + ' hrs';
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtTime(t) {
  if (!t) return '—';
  return t.slice(0, 5);
}

function buildMonthlyChart(expenses) {
  const map = {};
  for (const e of expenses || []) {
    if (!e.date) continue;
    const mo = e.date.slice(0, 7);
    map[mo] = (map[mo] || 0) + (e.amount || 0);
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([mo, cost]) => ({
      month: new Date(mo + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      cost: Math.round(cost),
    }));
}

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [tab, setTab] = useState('OVERVIEW');
  const [now, setNow] = useState(new Date());

  // Chat state
  const [chatOpen, setChatOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m Otto. Ask me anything about Ryno Jet Solutions operations.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/query`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  function getFilteredStats() {
    if (!data) return { trips: 0, legs: 0, totalCost: 0, flightHours: 0 };
    const tails = filter === 'ALL' ? ['N590MS', 'N45BP'] : [filter];
    return tails.reduce((acc, tail) => {
      const s = data.stats?.[tail] || {};
      acc.trips += s.trips || 0;
      acc.legs += s.legs || 0;
      acc.totalCost += s.totalCost || 0;
      acc.flightHours += s.flightHours || 0;
      return acc;
    }, { trips: 0, legs: 0, totalCost: 0, flightHours: 0 });
  }

  function filterByTail(arr) {
    if (!arr) return [];
    if (filter === 'ALL') return arr;
    return arr.filter(r => r.tail === filter);
  }

  async function sendChat(e) {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = { role: 'user', content: chatInput.trim() };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput('');
    setChatLoading(true);

    try {
      const context = {
        stats: data?.stats,
        recentTrips: data?.recentTrips?.slice(0, 5),
        expenses: data?.expenses?.slice(0, 10),
      };
      const apiMessages = newMessages.filter(m => m.role !== 'assistant' || m !== chatMessages[0]);
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, context }),
      });
      const json = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: json.reply || 'No response.' }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  }

  const stats = getFilteredStats();
  const filteredTrips = filterByTail(data?.recentTrips);
  const filteredLegs = filterByTail(data?.flightLog);
  const filteredExpenses = filterByTail(data?.expenses);
  const chartData = buildMonthlyChart(filteredExpenses);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <span className="logo">✈ RYNO JET SOLUTIONS</span>
          <span className="logo-sep">/</span>
          <span className="logo-sub">OPSAI</span>
        </div>
        <div className="header-right">
          <span className="clock">{now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} &nbsp; {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </header>

      {/* Aircraft Filter */}
      <div className="filter-bar">
        {['ALL', 'N590MS', 'N45BP'].map(f => (
          <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      {/* Loading / Error */}
      {loading && <div className="center-msg"><div className="spinner" /><span>Loading operations data…</span></div>}
      {error && <div className="center-msg error">⚠️ Unable to reach Otto API: {error}<br /><small>Check Railway deployment status.</small></div>}

      {data && (
        <>
          {/* Stat Cards */}
          <div className="stat-cards">
            <div className="stat-card">
              <div className="stat-label">TOTAL OPS COST</div>
              <div className="stat-value">{fmt$(stats.totalCost)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">TOTAL TRIPS</div>
              <div className="stat-value">{stats.trips}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">FLIGHT HOURS</div>
              <div className="stat-value">{fmtHrs(stats.flightHours)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">TOTAL LEGS</div>
              <div className="stat-value">{stats.legs}</div>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="tab-bar">
            {['OVERVIEW', 'TRIPS', 'FLIGHT LOG', 'EXPENSES'].map(t => (
              <button key={t} className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="tab-content">

            {tab === 'OVERVIEW' && (
              <div className="overview">
                <div className="chart-section">
                  <div className="section-title">MONTHLY OPS COST</div>
                  {chartData.length === 0
                    ? <div className="empty-state">No expense data available yet.</div>
                    : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1a2035" />
                          <XAxis dataKey="month" tick={{ fill: '#8a9bb8', fontSize: 11 }} />
                          <YAxis tickFormatter={v => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)} tick={{ fill: '#8a9bb8', fontSize: 11 }} />
                          <Tooltip formatter={v => fmt$(v)} contentStyle={{ background: '#0d1326', border: '1px solid #c8a84b', borderRadius: 6, color: '#e8eaf0' }} />
                          <Bar dataKey="cost" fill="#c8a84b" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )
                  }
                </div>
                <div className="recent-section">
                  <div className="section-title">RECENT ACTIVITY</div>
                  <div className="recent-list">
                    {filteredTrips.slice(0, 8).map(t => (
                      <div key={t.trip_id} className="recent-item">
                        <span className="ri-tail">{t.tail}</span>
                        <span className="ri-trip">{t.trip_number}</span>
                        <span className="ri-route">{t.dep} → {t.arr}</span>
                        <span className="ri-date">{fmtDate(t.date)}</span>
                        <span className={`ri-status ${t.status}`}>{t.status}</span>
                      </div>
                    ))}
                    {filteredTrips.length === 0 && <div className="empty-state">No trips recorded yet.</div>}
                  </div>
                </div>
              </div>
            )}

            {tab === 'TRIPS' && (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>TRIP #</th>
                      <th>TAIL</th>
                      <th>ROUTE</th>
                      <th>DATE</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrips.map(t => (
                      <tr key={t.trip_id}>
                        <td className="mono">{t.trip_number}</td>
                        <td className="tail-badge">{t.tail}</td>
                        <td className="mono">{t.dep} → {t.arr}</td>
                        <td>{fmtDate(t.date)}</td>
                        <td><span className={`status-pill ${t.status}`}>{t.status}</span></td>
                      </tr>
                    ))}
                    {filteredTrips.length === 0 && (
                      <tr><td colSpan={5} className="empty-state">No trips found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'FLIGHT LOG' && (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>TRIP</th>
                      <th>LEG</th>
                      <th>TAIL</th>
                      <th>DEP → ARR</th>
                      <th>DATE</th>
                      <th>OUT</th>
                      <th>OFF</th>
                      <th>ON</th>
                      <th>IN</th>
                      <th>FLT HRS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLegs.map(l => (
                      <tr key={l.id}>
                        <td className="mono">{l.trip_number}</td>
                        <td className="mono">{l.leg_number}</td>
                        <td className="tail-badge">{l.tail}</td>
                        <td className="mono">{l.dep} → {l.arr}</td>
                        <td>{fmtDate(l.date)}</td>
                        <td className="mono">{fmtTime(l.out_time)}</td>
                        <td className="mono">{fmtTime(l.off_time)}</td>
                        <td className="mono">{fmtTime(l.on_time)}</td>
                        <td className="mono">{fmtTime(l.in_time)}</td>
                        <td className="mono">{l.flight_hours ? Number(l.flight_hours).toFixed(1) : '—'}</td>
                      </tr>
                    ))}
                    {filteredLegs.length === 0 && (
                      <tr><td colSpan={10} className="empty-state">No flight legs found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'EXPENSES' && (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>DATE</th>
                      <th>TAIL</th>
                      <th>VENDOR</th>
                      <th>CATEGORY</th>
                      <th>AMOUNT</th>
                      <th>TRIP</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map(e => (
                      <tr key={e.id}>
                        <td>{fmtDate(e.date)}</td>
                        <td className="tail-badge">{e.tail}</td>
                        <td>{e.vendor}</td>
                        <td>{e.category}</td>
                        <td className="mono amount">{fmt$(e.amount)}</td>
                        <td className="mono">{e.trip_number}</td>
                        <td><span className={`status-pill ${e.status}`}>{e.status}</span></td>
                      </tr>
                    ))}
                    {filteredExpenses.length === 0 && (
                      <tr><td colSpan={7} className="empty-state">No expenses found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Otto Chat Panel */}
      <div className={`chat-panel${chatOpen ? ' open' : ' collapsed'}`}>
        <div className="chat-header" onClick={() => setChatOpen(o => !o)}>
          <span>✦ OTTO AI</span>
          <span className="chat-toggle">{chatOpen ? '▼' : '▲'}</span>
        </div>
        {chatOpen && (
          <>
            <div className="chat-messages">
              {chatMessages.map((m, i) => (
                <div key={i} className={`chat-msg ${m.role}`}>
                  <span className="chat-role">{m.role === 'assistant' ? 'OTTO' : 'YOU'}</span>
                  <span className="chat-text">{m.content}</span>
                </div>
              ))}
              {chatLoading && (
                <div className="chat-msg assistant">
                  <span className="chat-role">OTTO</span>
                  <span className="chat-text typing">Thinking…</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <form className="chat-input-row" onSubmit={sendChat}>
              <input
                className="chat-input"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask Otto anything…"
                disabled={chatLoading}
              />
              <button className="chat-send" type="submit" disabled={chatLoading || !chatInput.trim()}>➤</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
