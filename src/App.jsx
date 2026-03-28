import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

export default function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        <div className="app">
          <Nav />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/budget" element={<BudgetPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/flight-log" element={<FlightLogPage />} />
              <Route path="/trips/:id" element={<TripDetailPage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/ocean" element={
                <div className="page-content">
                  <OceanicLog />
                </div>
              } />
              <Route path="*" element={
                <div className="center-msg">
                  404 — Page not found
                </div>
              } />
            </Routes>
          </main>
          <ChatPanel />
        </div>
      </DataProvider>
    </BrowserRouter>
  );
}
