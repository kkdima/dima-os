import { useMemo } from 'react';
import { Card } from '../components/ui/Card';
import type { AppData } from '../lib/appData';
import { computeUpcomingBills, sumUpcoming } from '../lib/bills';
import { habitStats } from '../lib/appData';

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

function ActivityCard({
  title,
  value,
  unit,
  hint,
  series,
}: {
  title: string;
  value: string;
  unit?: string;
  hint?: string;
  series: number[];
}) {
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

export function HomePage({
  data,
  onOpenBills,
  onOpenCheckin,
}: {
  data: AppData;
  onOpenBills: () => void;
  onOpenCheckin: () => void;
}) {
  const last7 = data.metrics.slice(-7);
  const sleepSeries = last7.map((m) => m.sleepHours ?? 0);
  const weightSeries = last7.map((m, i) => (m.weightKg ?? 72) + i * 0.01);

  const sleepToday = data.metrics.at(-1)?.sleepHours;

  // placeholders for now
  const caloriesToday = 3100;
  const trainingMin = 60;
  const tradingOk = true;

  const upcoming = computeUpcomingBills(data.bills);
  const nextBills = upcoming.slice(0, 3);
  const due7 = sumUpcoming(upcoming, 7);
  const due30 = sumUpcoming(upcoming, 30);

  const habitsDoneToday = data.habits.filter((h) => {
    const s = habitStats(data, h.id);
    const todayKey = s.days30.at(-1)!;
    return !!s.map[todayKey];
  }).length;

  return (
    <div className="px-4 pt-3 pb-28 max-w-xl mx-auto">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-3xl font-semibold tracking-tight">Your Activity</h2>
        <button
          onClick={onOpenCheckin}
          className="rounded-2xl bg-coral-500 text-white px-3 py-2 text-sm font-semibold"
        >
          Check‑in
        </button>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3">
        <ActivityCard
          title="Sleep"
          value={sleepToday ? String(sleepToday) : '--'}
          unit="h"
          hint="7-day trend"
          series={sleepSeries.length ? sleepSeries : [6.5, 7.2, 6.9, 7.4, 7.1, 7.8, 7.0]}
        />

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Habits</div>
              <div className="mt-1 text-3xl font-semibold tracking-tight">
                {habitsDoneToday}/{data.habits.length}
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Done today</div>
            </div>
            <div className="text-coral-600 dark:text-coral-300 font-semibold text-sm">✓</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.habits.slice(0, 5).map((h) => {
              const s = habitStats(data, h.id);
              const todayKey = s.days30.at(-1)!;
              const done = !!s.map[todayKey];
              return (
                <span
                  key={h.id}
                  className={
                    'text-xs px-2 py-1 rounded-2xl border ' +
                    (done
                      ? 'bg-coral-500/15 text-coral-700 dark:text-coral-200 border-black/5 dark:border-white/10'
                      : 'bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300 border-black/5 dark:border-white/10')
                  }
                >
                  {(h.emoji ?? '✅') + ' ' + h.title}
                </span>
              );
            })}
          </div>
        </Card>

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

        <button onClick={onOpenBills} className="text-left">
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Upcoming bills</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Due (unpaid): 7d ${due7.toFixed(0)} · 30d ${due30.toFixed(0)}
                </div>
              </div>
              <div className="text-coral-600 dark:text-coral-300 font-semibold text-sm">$</div>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {nextBills.map((b) => (
                <div key={b.id + b.dueDate} className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{b.title}</div>
                  <div className={b.paid ? 'text-xs text-gray-400' : 'text-sm font-semibold'}>
                    ${b.amountUsd.toFixed(0)} <span className="text-xs text-gray-500">· {b.dueDate}</span>
                  </div>
                </div>
              ))}
              {nextBills.length === 0 && <div className="text-sm text-gray-500 dark:text-gray-400">No bills yet. Add them in Stats.</div>}
            </div>
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">Tap to manage bills</div>
          </Card>
        </button>
      </div>
    </div>
  );
}
