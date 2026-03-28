import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useData } from '../lib/DataContext';

const NAV_LINKS = [
  { to: '/', label: 'HOME' },
  { to: '/calendar', label: 'CALENDAR' },
  { to: '/budget', label: 'BUDGET' },
  { to: '/expenses', label: 'EXPENSES' },
  { to: '/jobs', label: 'JOBS' },
  { to: '/ocean', label: 'OCEAN ✈' },
];

export default function Nav() {
  const [now, setNow] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const { filter, setFilter } = useData();
  const location = useLocation();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  return (
    <header className="nav-header">
      <div className="nav-top">
        <NavLink to="/" className="nav-logo">
          ✈ RYNO JET SOLUTIONS <span className="nav-logo-sep">/</span> <span className="nav-logo-sub">OPSAI</span>
        </NavLink>

        <div className="nav-clock">
          {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          &nbsp;&nbsp;
          {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>

        <button
          className={`nav-hamburger${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>

      <div className={`nav-bottom${menuOpen ? ' open' : ''}`}>
        <nav className="nav-links">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-filter">
          {['ALL', 'N590MS', 'N45BP'].map(f => (
            <button
              key={f}
              className={`filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
