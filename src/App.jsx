import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { DataProvider } from './lib/DataContext';
import Nav from './components/Nav';
import ChatPanel from './components/ChatPanel';
import OverviewDashboard from './pages/OverviewDashboard';
import CalendarPage from './pages/CalendarPage';
import BudgetPage from './pages/BudgetPage';
import ExpensesPage from './pages/ExpensesPage';
import FlightLogPage from './pages/FlightLogPage';
import TripDetailPage from './pages/TripDetailPage';
import AllTripsPage from './pages/AllTripsPage';
import JobsPage from './pages/JobsPage';
import OceanicLog from './OceanicLog';
import './App.css';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: 'easeIn' } },
};

function AnimatedRoutes() {
  const location = useLocation();
  const isOverview = location.pathname === '/';
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><OverviewDashboard /></PageWrapper>} />
        <Route path="/calendar" element={<PageWrapper><CalendarPage /></PageWrapper>} />
        <Route path="/budget" element={<PageWrapper><BudgetPage /></PageWrapper>} />
        <Route path="/expenses" element={<PageWrapper><ExpensesPage /></PageWrapper>} />
        <Route path="/flight-log" element={<PageWrapper><FlightLogPage /></PageWrapper>} />
        <Route path="/trips" element={<PageWrapper><AllTripsPage /></PageWrapper>} />
        <Route path="/trips/:id" element={<PageWrapper><TripDetailPage /></PageWrapper>} />
        <Route path="/jobs" element={<PageWrapper><JobsPage /></PageWrapper>} />
        <Route path="/ocean" element={<PageWrapper><OceanicLog /></PageWrapper>} />
        <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}

function PageWrapper({ children }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  );
}

function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <p style={{ fontSize: 64, fontWeight: 700, color: 'var(--ink-dim)', marginBottom: 16 }}>404</p>
      <p style={{ color: 'var(--ink-dim)', fontSize: 18 }}>Page not found</p>
    </div>
  );
}

function InnerApp() {
  const location = useLocation();
  const isOverview = location.pathname === '/';

  return (
    <div style={{ minHeight: '100vh' }}>
      {!isOverview && <Nav />}
      <main style={isOverview ? {} : { maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>
        <AnimatedRoutes />
      </main>
      {!isOverview && <ChatPanel />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        <InnerApp />
      </DataProvider>
    </BrowserRouter>
  );
}
