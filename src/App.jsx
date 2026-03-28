import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { DataProvider } from './lib/DataContext';
import Nav from './components/Nav';
import ChatPanel from './components/ChatPanel';
import Home from './pages/Home';
import CalendarPage from './pages/CalendarPage';
import BudgetPage from './pages/BudgetPage';
import ExpensesPage from './pages/ExpensesPage';
import FlightLogPage from './pages/FlightLogPage';
import TripDetailPage from './pages/TripDetailPage';
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
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/calendar" element={<PageWrapper><CalendarPage /></PageWrapper>} />
        <Route path="/budget" element={<PageWrapper><BudgetPage /></PageWrapper>} />
        <Route path="/expenses" element={<PageWrapper><ExpensesPage /></PageWrapper>} />
        <Route path="/flight-log" element={<PageWrapper><FlightLogPage /></PageWrapper>} />
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <p className="text-6xl font-bold text-slate-200 mb-4">404</p>
      <p className="text-slate-500 text-lg">Page not found</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        <div className="min-h-screen bg-[#F8FAFC]">
          <Nav />
          <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <AnimatedRoutes />
          </main>
          <ChatPanel />
        </div>
      </DataProvider>
    </BrowserRouter>
  );
}
