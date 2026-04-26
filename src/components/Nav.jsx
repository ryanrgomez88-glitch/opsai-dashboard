import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useData } from '../lib/DataContext';
import { Plane, BarChart2, Calendar, DollarSign, List, Briefcase, Waves, Menu, X, RefreshCw, MapPin } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: BarChart2 },
  { to: '/trips', label: 'Trips', icon: MapPin },
  { to: '/budget', label: 'Budget', icon: DollarSign },
  { to: '/expenses', label: 'Expenses', icon: List },
  { to: '/flight-log', label: 'Flight Log', icon: Plane },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/ocean', label: 'Ocean', icon: Waves },
];

export default function Nav() {
  const { filter, setFilter, lastRefresh, refresh } = useData();
  const [menuOpen, setMenuOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const tails = ['ALL', 'N590MS', 'N45BP'];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-[#1E3A5F] flex items-center justify-center">
              <Plane size={16} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-[#1E3A5F] text-sm leading-tight block">OpsAI</span>
              <span className="text-[10px] text-slate-400 leading-tight block">N45BP Ops</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#EFF6FF] text-[#2196F3]'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon size={14} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Aircraft filter */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              {tails.map(tail => (
                <button
                  key={tail}
                  onClick={() => setFilter(tail === 'ALL' ? 'ALL' : tail)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                    filter === tail || (tail === 'ALL' && filter === 'ALL')
                      ? 'bg-white text-[#1E3A5F] shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tail}
                </button>
              ))}
            </div>

            {/* Clock */}
            <div className="hidden lg:block text-right">
              <p className="text-xs font-mono text-slate-700 leading-tight">
                {time.toLocaleTimeString('en-US', { hour12: false })}Z
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">
                {time.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {/* Refresh */}
            <button
              onClick={refresh}
              title="Refresh data"
              className="p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <RefreshCw size={14} />
            </button>

            {/* Mobile menu */}
            <button
              className="md:hidden p-2 rounded-md text-slate-500"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium ${
                  isActive
                    ? 'bg-[#EFF6FF] text-[#2196F3]'
                    : 'text-slate-600'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
          {/* Mobile aircraft filter */}
          <div className="flex items-center gap-1 pt-2 border-t border-slate-100 mt-2">
            <span className="text-xs text-slate-400 mr-1">Aircraft:</span>
            {tails.map(tail => (
              <button
                key={tail}
                onClick={() => { setFilter(tail === 'ALL' ? 'ALL' : tail); setMenuOpen(false); }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                  filter === tail || (tail === 'ALL' && filter === 'ALL')
                    ? 'bg-[#1E3A5F] text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tail}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
