import { useData } from '../lib/DataContext';
import { Card, Title, Text, Badge, Flex, Button } from '@tremor/react';
import { RefreshCw, Clock, CheckCircle, AlertCircle } from 'lucide-react';

function Skeleton({ className = '' }) { return <div className={`skeleton ${className}`} />; }

export default function JobsPage() {
  const { loading, lastRefresh, refresh } = useData();

  const scheduledJobs = [
    {
      name: 'OPS Data Refresh',
      description: 'Pulls latest trips, expenses, and flight logs from Otto API',
      interval: 'Every 60 seconds',
      lastRun: lastRefresh ? new Date(lastRefresh).toLocaleTimeString() : 'Never',
      status: 'active',
      nextRun: lastRefresh
        ? new Date(new Date(lastRefresh).getTime() + 60000).toLocaleTimeString()
        : '—',
    },
    {
      name: 'Otto API Health Check',
      description: 'Verifies Otto API connectivity',
      interval: 'Every 5 minutes',
      lastRun: lastRefresh ? new Date(lastRefresh).toLocaleTimeString() : 'Never',
      status: 'active',
      nextRun: '—',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Scheduled Jobs</h1>
          <p className="text-slate-500 text-sm mt-0.5">Dashboard automation tasks</p>
        </div>
        <Button size="sm" variant="secondary" icon={RefreshCw} onClick={refresh} loading={loading}>
          Refresh Now
        </Button>
      </div>

      <div className="space-y-3">
        {scheduledJobs.map((job, i) => (
          <Card key={i} className="ring-0 shadow-sm">
            <Flex justifyContent="between" alignItems="start" className="flex-col sm:flex-row gap-3">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 p-2 rounded-lg ${job.status === 'active' ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                  {job.status === 'active'
                    ? <CheckCircle size={16} className="text-emerald-600" />
                    : <AlertCircle size={16} className="text-slate-400" />
                  }
                </div>
                <div>
                  <Flex alignItems="center" className="gap-2">
                    <Text className="font-semibold text-slate-800">{job.name}</Text>
                    <Badge color={job.status === 'active' ? 'emerald' : 'gray'} size="xs">
                      {job.status}
                    </Badge>
                  </Flex>
                  <Text className="text-slate-400 text-xs mt-0.5">{job.description}</Text>
                </div>
              </div>
              <div className="text-right text-xs text-slate-400 space-y-0.5 ml-10 sm:ml-0">
                <Flex justifyContent="end" className="gap-1.5">
                  <Clock size={11} className="text-slate-300" />
                  <span>{job.interval}</span>
                </Flex>
                <p>Last run: <span className="font-mono text-slate-600">{job.lastRun}</span></p>
                <p>Next run: <span className="font-mono text-slate-600">{job.nextRun}</span></p>
              </div>
            </Flex>
          </Card>
        ))}
      </div>

      <Card className="ring-0 shadow-sm bg-amber-50 border-amber-200">
        <Text className="text-amber-800 text-sm">
          <strong>OpenClaw Gateway integration pending.</strong> When available, live cron job status will appear here.
        </Text>
      </Card>
    </div>
  );
}
