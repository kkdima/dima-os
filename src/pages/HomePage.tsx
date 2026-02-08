import { useMemo } from 'react';
import { Card } from '../components/ui/Card';
import type { AppData } from '../lib/appData';

function Sparkline({ values }: { values: number[] }) {
  const points = useMemo(() => {
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    return values
      .map((v, i) => {
        const x = (i / (values.length - 1)) * 100;
        const y = 100 - ((v - min) / range) * 100;
        return `${x},${y}`;
      })
      .join(' ');
  }, [values]);

  return (
    <svg viewBox="0 0 100 100" className="w-full h-10">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        className="text-coral-500"
      />
    </svg>
  );
}

function ActivityCard({ title, value, unit, hint, series }: { title: string; value: string; unit?: string; hint?: string; series: number[] }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            {value}
            {unit && <span className="text-base font-semibold text-gray-500 dark:text-gray-400"> {unit}</span>}
          </div>
          {hint && <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</div>}
        </div>
        <div className="w-24 text-coral-500">
          <Sparkline values={series} />
        </div>
      </div>
    </Card>
  );
}

export function HomePage({ data }: { data: AppData }) {
  const last7 = data.metrics.slice(-7);
  const sleepSeries = last7.map((m) => m.sleepHours ?? 0);
  const weightSeries = last7.map((m, i) => (m.weightKg ?? 72) + i * 0.01);

  const sleepToday = data.metrics.at(-1)?.sleepHours;

  // placeholders for now
  const caloriesToday = 3100;
  const trainingMin = 60;
  const tradingOk = true;

  return (
    <div className="px-4 pt-3 pb-28 max-w-xl mx-auto">
      <h2 className="text-3xl font-semibold tracking-tight">Your Activity</h2>
      <div className="mt-4 grid grid-cols-1 gap-3">
        <ActivityCard
          title="Sleep"
          value={sleepToday ? String(sleepToday) : '--'}
          unit="h"
          hint="7-day trend"
          series={sleepSeries.length ? sleepSeries : [6.5, 7.2, 6.9, 7.4, 7.1, 7.8, 7.0]}
        />
        <div className="grid grid-cols-2 gap-3">
          <ActivityCard
            title="Calories"
            value={String(caloriesToday)}
            unit="kcal"
            hint="Target: 3100"
            series={[2800, 3100, 2950, 3200, 3050, 3100, 3150]}
          />
          <ActivityCard
            title="Training"
            value={String(trainingMin)}
            unit="min"
            hint="Zone 2/3"
            series={[0, 40, 0, 60, 0, 30, 60]}
          />
        </div>
        <ActivityCard
          title="Trading Discipline"
          value={tradingOk ? 'OK' : 'Hold'}
          hint="≤2 trades + logged"
          series={weightSeries.length ? weightSeries : [1, 1, 1, 1, 1, 1, 1]}
        />
      </div>
    </div>
  );
}
