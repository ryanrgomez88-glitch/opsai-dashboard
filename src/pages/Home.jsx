import { useData } from '../lib/DataContext';
import { fmt$, fmtHrs, fmtDate } from '../lib/fmt';
import { useNavigate } from 'react-router-dom';
import {
  Card, Grid, Col, Metric, Text, Title, BarChart, AreaChart, DonutChart,
  Flex, BadgeDelta, ProgressBar, Badge
} from '@tremor/react';
import { TrendingUp, TrendingDown, Plane, DollarSign, Clock, Target } from 'lucide-react';

function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

function KpiCard({ label, value, subtext, deltaType, deltaText, icon: Icon, loading }) {
  if (loading) {
    return (
      <Card className="ring-0 shadow-sm">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </Card>
    );
  }
  return (
    <Card className="ring-0 shadow-sm hover:shadow-md transition-shadow">
      <Flex justifyContent="between" alignItems="start">
        <div>
          <Text className="text-slate-500 text-sm">{label}</Text>
          <Metric className="text-[#1E3A5F] mt-1 font-mono">{value}</Metric>
          {subtext && <Text className="text-slate-400 text-xs mt-1">{subtext}</Text>}
        </div>
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon size={18} className="text-[#2196F3]" />
        </div>
      </Flex>
      {deltaType && deltaText && (
        <Flex className="mt-3">
          <BadgeDelta deltaType={deltaType} size="xs">{deltaText}</BadgeDelta>
        </Flex>
      )}
    </Card>
  );
}

export default function Home() {
  const { data, loading, lastRefresh, getStats, filterByTail } = useData();
  const navigate = useNavigate();
  const stats = getStats();
  const recentTrips = filterByTail(data?.recentTrips || []).slice(0, 8);
  const expenses = filterByTail(data?.expenses || []);

  // Build monthly spend data from expenses
  const monthlyData = buildMonthlyData(expenses);

  // Build category data for donut
  const categoryData = buildCategoryData(expenses);

  // Budget 2026 targets
  const BUDGET_TOTAL = 4000000;
  const budgetPct = stats.totalCost > 0 ? Math.round((stats.totalCost / BUDGET_TOTAL) * 100) : 0;

  const costPerHour = stats.flightHours > 0 ? stats.totalCost / stats.flightHours : 0;
  const TARGET_CPH = 12308;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Operations Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">N45BP · 2026 Fiscal Year</p>
        </div>
        {lastRefresh && (
          <p className="text-xs text-slate-400 font-mono">
            Updated {fmtDate(lastRefresh)}
          </p>
        )}
      </div>

      {/* KPI Grid */}
      <Grid numItemsSm={2} numItemsLg={4} className="gap-4">
        <Col>
          <KpiCard
            label="Total Ops Cost"
            value={loading ? '—' : fmt$(stats.totalCost)}
            subtext={`${stats.trips} trips · ${stats.legs} legs`}
            deltaType="moderateDecrease"
            deltaText="vs. budget pace"
            icon={DollarSign}
            loading={loading}
          />
        </Col>
        <Col>
          <KpiCard
            label="Flight Hours"
            value={loading ? '—' : fmtHrs(stats.flightHours)}
            subtext={`Block: ${fmtHrs(stats.blockHours)}`}
            deltaType="moderateIncrease"
            deltaText="YTD 2026"
            icon={Clock}
            loading={loading}
          />
        </Col>
        <Col>
          <KpiCard
            label="Cost / Hour"
            value={loading ? '—' : fmt$(costPerHour)}
            subtext={`Target: ${fmt$(TARGET_CPH)}/hr`}
            deltaType={costPerHour <= TARGET_CPH ? 'moderateIncrease' : 'moderateDecrease'}
            deltaText={costPerHour <= TARGET_CPH ? 'On target' : 'Above target'}
            icon={TrendingUp}
            loading={loading}
          />
        </Col>
        <Col>
          <KpiCard
            label="Budget Used"
            value={loading ? '—' : `${budgetPct}%`}
            subtext={`${fmt$(stats.totalCost)} of ${fmt$(BUDGET_TOTAL)}`}
            deltaType={budgetPct < 25 ? 'moderateIncrease' : budgetPct < 50 ? 'unchanged' : 'moderateDecrease'}
            deltaText="Q1 2026"
            icon={Target}
            loading={loading}
          />
        </Col>
      </Grid>

      {/* Budget Progress */}
      {!loading && (
        <Card className="ring-0 shadow-sm">
          <Flex>
            <Title className="text-[#1E3A5F]">2026 Budget Utilization</Title>
            <Text className="font-mono text-sm">{fmt$(stats.totalCost)} / {fmt$(BUDGET_TOTAL)}</Text>
          </Flex>
          <ProgressBar value={budgetPct} color="blue" className="mt-3" />
          <Flex className="mt-2">
            <Text className="text-xs text-slate-400">{budgetPct}% used — Q1</Text>
            <Text className="text-xs text-slate-400">Target: {fmt$(TARGET_CPH)}/hr</Text>
          </Flex>
        </Card>
      )}

      {/* Charts Row */}
      <Grid numItemsSm={1} numItemsLg={2} className="gap-4">
        {/* Monthly Spend */}
        <Card className="ring-0 shadow-sm">
          <Title className="text-[#1E3A5F] mb-1">Monthly Ops Cost</Title>
          <Text className="text-slate-400 text-xs mb-4">Last 6 months — all aircraft</Text>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-48 w-full" />
            </div>
          ) : monthlyData.length === 0 ? (
            <EmptyState message="No expense data yet" />
          ) : (
            <BarChart
              data={monthlyData}
              index="month"
              categories={["Cost"]}
              colors={["blue"]}
              valueFormatter={(v) => fmt$(v)}
              showLegend={false}
              showAnimation
              className="h-48"
            />
          )}
        </Card>

        {/* Category Donut */}
        <Card className="ring-0 shadow-sm">
          <Title className="text-[#1E3A5F] mb-1">Spend by Category</Title>
          <Text className="text-slate-400 text-xs mb-4">YTD breakdown</Text>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : categoryData.length === 0 ? (
            <EmptyState message="No expense data yet" />
          ) : (
            <DonutChart
              data={categoryData}
              index="category"
              category="amount"
              valueFormatter={(v) => fmt$(v)}
              colors={["blue", "amber", "emerald", "rose", "purple", "cyan"]}
              showAnimation
              className="h-48"
            />
          )}
        </Card>
      </Grid>

      {/* Recent Trips */}
      <Card className="ring-0 shadow-sm">
        <Title className="text-[#1E3A5F] mb-4">Recent Trips</Title>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Flex key={i} className="gap-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
              </Flex>
            ))}
          </div>
        ) : recentTrips.length === 0 ? (
          <EmptyState message="No trips found" />
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTrips.map((trip) => (
              <div
                key={trip.trip_id || trip.trip_number}
                className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors group"
                onClick={() => navigate(`/trips/${trip.trip_id || trip.trip_number}`)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {trip.trip_number}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-800 group-hover:text-[#2196F3] transition-colors">
                      {trip.dep} → {trip.arr}
                    </p>
                    <p className="text-xs text-slate-400">{fmtDate(trip.date)} · {trip.tail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={trip.status} />
                  <span className="text-sm font-mono text-slate-600">→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  if (s === 'complete' || s === 'completed') return <Badge color="emerald" size="xs">Complete</Badge>;
  if (s === 'in-progress' || s === 'active') return <Badge color="blue" size="xs">Active</Badge>;
  if (s === 'planned' || s === 'scheduled') return <Badge color="amber" size="xs">Planned</Badge>;
  return <Badge color="gray" size="xs">{status || 'Unknown'}</Badge>;
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  );
}

function buildMonthlyData(expenses) {
  const months = {};
  expenses.forEach(e => {
    if (!e.date || !e.amount) return;
    const d = new Date(e.date);
    if (isNaN(d)) return;
    const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    months[key] = (months[key] || 0) + Number(e.amount);
  });
  return Object.entries(months)
    .sort(([a], [b]) => new Date('1 ' + a) - new Date('1 ' + b))
    .slice(-6)
    .map(([month, Cost]) => ({ month, Cost }));
}

function buildCategoryData(expenses) {
  const cats = {};
  expenses.forEach(e => {
    if (!e.amount) return;
    const cat = e.category || 'Other';
    cats[cat] = (cats[cat] || 0) + Number(e.amount);
  });
  return Object.entries(cats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([category, amount]) => ({ category, amount }));
}
