import { useState, useEffect } from 'react';
import { useData } from '../lib/DataContext';

const KNOWN_JOBS = [
  {
    id: 'ops-query-cache',
    name: 'OPS Data Refresh',
    schedule: 'every 60s (client-side)',
    description: 'Fetches latest operations data from Otto API',
    status: 'active',
    source: 'dashboard',
  },
];

export default function JobsPage() {
  const { lastRefresh, refresh } = useData();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const nextRun = lastRefresh ? new Date(lastRefresh.getTime() + 60_000) : null;
  const secUntilNext = nextRun ? Math.max(0, Math.round((nextRun - now) / 1000)) : null;

  return (
    <div className="page-content">
      <div className="page-title">JOBS & SCHEDULED TASKS</div>

      <div className="jobs-info-banner">
        <span>✦</span>
        <span>
          OpenClaw gateway integration is pending. Showing known client-side jobs.
          Otto API cron jobs will appear here when the gateway endpoint is configured.
        </span>
      </div>

      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>JOB</th>
              <th>SCHEDULE</th>
              <th>STATUS</th>
              <th>LAST RUN</th>
              <th>NEXT RUN</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {KNOWN_JOBS.map(job => (
              <tr key={job.id}>
                <td>
                  <div className="job-name">{job.name}</div>
                  <div className="job-desc">{job.description}</div>
                </td>
                <td className="mono">{job.schedule}</td>
                <td><span className="status-pill active">{job.status}</span></td>
                <td className="mono">{lastRefresh ? lastRefresh.toLocaleTimeString() : '—'}</td>
                <td className="mono">
                  {secUntilNext !== null ? `in ${secUntilNext}s` : '—'}
                </td>
                <td>
                  <button className="action-btn" onClick={refresh}>Run Now</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="jobs-empty-note">
        <div className="section-title" style={{ marginTop: 32 }}>OPENCLAW GATEWAY</div>
        <div className="jobs-info-card">
          <p>To view cron jobs managed by OpenClaw:</p>
          <ol>
            <li>Configure the OpenClaw gateway endpoint in <code>src/lib/api.js</code></li>
            <li>Add a <code>GET /jobs</code> endpoint to the Otto API</li>
            <li>This page will auto-populate with live job status</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
