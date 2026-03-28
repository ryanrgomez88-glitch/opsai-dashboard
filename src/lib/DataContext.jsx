import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchOpsData } from './api';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const load = useCallback(async (force = false) => {
    try {
      const d = await fetchOpsData(force);
      setData(d);
      setLastRefresh(new Date());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(() => load(true), 60_000);
    return () => clearInterval(iv);
  }, [load]);

  function filterByTail(arr) {
    if (!arr) return [];
    if (filter === 'ALL') return arr;
    return arr.filter(r => r.tail === filter);
  }

  function getStats() {
    if (!data) return { trips: 0, legs: 0, totalCost: 0, flightHours: 0, blockHours: 0 };
    const tails = filter === 'ALL' ? Object.keys(data.stats || {}) : [filter];
    return tails.reduce((acc, tail) => {
      const s = data.stats?.[tail] || {};
      acc.trips += s.trips || 0;
      acc.legs += s.legs || 0;
      acc.totalCost += s.totalCost || 0;
      acc.flightHours += s.flightHours || 0;
      acc.blockHours += s.blockHours || 0;
      return acc;
    }, { trips: 0, legs: 0, totalCost: 0, flightHours: 0, blockHours: 0 });
  }

  return (
    <DataContext.Provider value={{
      data,
      loading,
      error,
      lastRefresh,
      filter,
      setFilter,
      filterByTail,
      getStats,
      refresh: () => load(true),
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be inside DataProvider');
  return ctx;
}
