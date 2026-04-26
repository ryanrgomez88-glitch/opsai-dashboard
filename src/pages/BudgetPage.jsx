import { useData } from '../lib/DataContext';
import { fmt$, fmtHrs } from '../lib/fmt';
import {
  Card, Grid, Col, Metric, Text, Title, BarChart, ProgressBar, Flex, Badge, BadgeDelta
} from '@tremor/react';

function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

const BUDGET_2026 = {
  total: 4000000,
  hours: 325,
  cph: 12308,
  byCategory: {
    Fuel: 900000,
    Crew: 800000,
    Maintenance: 600000,
    Hangar: 300000,
    Insurance: 200000,
    Charter: 400000,
    Other: 800000,
  }
};

export default function BudgetPage() {
  const { data, loading, getStats, filterByTail } = useData();
  const stats = getStats();
  const expenses = filterByTail(data?.expenses || []);

  const spent = stats.totalCost;
  const hours = stats.flightHours;
  const cph = hours > 0 ? spent / hours : 0;
  const budgetPct = Math.min(100, Math.round((spent / BUDGET_2026.total) * 100));
  const hoursPct = Math.min(100, Math.round((hours / BUDGET_2026.hours) * 100));

  // Category actuals
  const catActuals = {};
  expenses.forEach(e => {
    const cat = e.category || 'Other';
    catActuals[cat] = (catActuals[cat] || 0) + Number(e.amount || 0);
  });

  const chartData = Object.entries(BUDGET_2026.byCategory).map(([cat, budget]) => ({
    category: cat,
    Budget: budget,
    Actual: catActuals[cat] || 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Budget Tracker</h1>
        <p className="text-slate-500 text-sm mt-0.5">2026 Annual Plan · All Fleet</p>
      </div>

      {/* KPI Cards */}
      <Grid numItemsSm={3} className="gap-4">
        <Card className="ring-0 shadow-sm">
          {loading ? <Skeleton className="h-20 w-full" /> : (
            <>
              <Text className="text-slate-500 text-sm">Total Spend</Text>
              <Metric className="text-[#1E3A5F] font-mono mt-1">{fmt$(spent)}</Metric>
              <Flex className="mt-2">
                <Text className="text-xs text-slate-400">of {fmt$(BUDGET_2026.total)} budget</Text>
                <BadgeDelta deltaType={budgetPct < 30 ? 'moderateIncrease' : 'moderateDecrease'} size="xs">
                  {budgetPct}%
                </BadgeDelta>
              </Flex>
              <ProgressBar value={budgetPct} color="blue" className="mt-2" />
            </>
          )}
        </Card>
        <Card className="ring-0 shadow-sm">
          {loading ? <Skeleton className="h-20 w-full" /> : (
            <>
              <Text className="text-slate-500 text-sm">Flight Hours</Text>
              <Metric className="text-[#1E3A5F] font-mono mt-1">{fmtHrs(hours)}</Metric>
              <Flex className="mt-2">
                <Text className="text-xs text-slate-400">of {BUDGET_2026.hours} hr target</Text>
                <BadgeDelta deltaType="unchanged" size="xs">{hoursPct}%</BadgeDelta>
              </Flex>
              <ProgressBar value={hoursPct} color="amber" className="mt-2" />
            </>
          )}
        </Card>
        <Card className="ring-0 shadow-sm">
          {loading ? <Skeleton className="h-20 w-full" /> : (
            <>
              <Text className="text-slate-500 text-sm">Cost / Hour</Text>
              <Metric className={`font-mono mt-1 ${cph > BUDGET_2026.cph ? 'text-[#F44336]' : 'text-[#4CAF50]'}`}>
                {fmt$(cph)}
              </Metric>
              <Flex className="mt-2">
                <Text className="text-xs text-slate-400">Target {fmt$(BUDGET_2026.cph)}/hr</Text>
                <Badge color={cph <= BUDGET_2026.cph ? 'emerald' : 'red'} size="xs">
                  {cph <= BUDGET_2026.cph ? 'On target' : 'Over target'}
                </Badge>
              </Flex>
            </>
          )}
        </Card>
      </Grid>

      {/* Budget vs Actual Chart */}
      <Card className="ring-0 shadow-sm">
        <Title className="text-[#1E3A5F]">Budget vs. Actual by Category</Title>
        <Text className="text-slate-400 text-xs mt-0.5 mb-4">2026 YTD · Blue = Budget · Orange = Actual</Text>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <BarChart
            data={chartData}
            index="category"
            categories={["Budget", "Actual"]}
            colors={["blue", "amber"]}
            valueFormatter={(v) => fmt$(v)}
            showLegend
            showAnimation
            className="h-64"
          />
        )}
      </Card>

      {/* Category breakdown table */}
      <Card className="ring-0 shadow-sm">
        <Title className="text-[#1E3A5F] mb-4">Category Detail</Title>
        {loading ? (
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            <div className="grid grid-cols-4 gap-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <span>Category</span>
              <span className="text-right">Budget</span>
              <span className="text-right">Actual</span>
              <span className="text-right">Remaining</span>
            </div>
            {chartData.map(row => {
              const remaining = row.Budget - row.Actual;
              const over = remaining < 0;
              return (
                <div key={row.category} className="grid grid-cols-4 gap-4 py-3 items-center">
                  <span className="text-sm font-medium text-slate-700">{row.category}</span>
                  <span className="text-right text-sm font-mono text-slate-600">{fmt$(row.Budget)}</span>
                  <span className="text-right text-sm font-mono text-slate-800">{fmt$(row.Actual)}</span>
                  <span className={`text-right text-sm font-mono font-semibold ${over ? 'text-[#F44336]' : 'text-[#4CAF50]'}`}>
                    {over ? '-' : ''}{fmt$(Math.abs(remaining))}
                  </span>
                </div>
              );
            })}
            <div className="grid grid-cols-4 gap-4 pt-3 border-t border-slate-200">
              <span className="text-sm font-bold text-slate-800">Total</span>
              <span className="text-right text-sm font-mono font-bold text-slate-800">{fmt$(BUDGET_2026.total)}</span>
              <span className="text-right text-sm font-mono font-bold text-slate-800">{fmt$(spent)}</span>
              <span className={`text-right text-sm font-mono font-bold ${spent > BUDGET_2026.total ? 'text-[#F44336]' : 'text-[#4CAF50]'}`}>
                {fmt$(BUDGET_2026.total - spent)}
              </span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
