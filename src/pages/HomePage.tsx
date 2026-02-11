import { Card } from '../components/ui/Card';
import { MetricTile } from '../components/dashboard/MetricTile';
import type { AppData } from '../lib/appData';
import { computeUpcomingBills, sumUpcoming } from '../lib/bills';
import { habitStats, getTodayCheckin, upsertCheckinToday } from '../lib/appData';
import { evaluateTodayRules, aggregateDayStatus } from '../lib/rules';
import { parseISO, startOfDay } from 'date-fns';

export function HomePage({
  data,
  onChange,
  onOpenBills,
  onOpenCheckin,
}: {
  data: AppData;
  onChange: (next: AppData) => void;
  onOpenBills: () => void;
  onOpenCheckin: () => void;
}) {
  const last7 = data.metrics.slice(-7);
  const sleepSeries = last7.map((m) => m.sleepHours ?? 0);
  const weightSeries = last7.map((m, i) => (m.weightKg ?? 72) + i * 0.01);

  const sleepToday = data.metrics.at(-1)?.sleepHours;

  // Trading discipline: use real data from today's checkin
  const todayCheckin = getTodayCheckin(data);
  const tradesCount = todayCheckin?.tradesCount ?? 0;
  const tradeLogDone = todayCheckin?.tradeLogDone ?? false;
  const tradingOk = tradesCount <= 2 && tradeLogDone;

  // Calories and training from checkin or defaults
  const caloriesToday = todayCheckin?.caloriesKcal ?? 3100;
  const trainingMin = todayCheckin?.trainingMin ?? 60;

  const upcoming = computeUpcomingBills(data.bills);
  const nextBills = upcoming.slice(0, 3);
  const due7 = sumUpcoming(upcoming, 7);
  const due30 = sumUpcoming(upcoming, 30);
  const todayStart = startOfDay(new Date());
  const dueToday = upcoming.filter((b) => {
    const d = startOfDay(parseISO(b.dueDate));
    return d.getTime() === todayStart.getTime() && !b.paid;
  }).reduce((sum, b) => sum + b.amountUsd, 0);
  const dueTomorrow = upcoming.filter((b) => {
    const d = startOfDay(parseISO(b.dueDate));
    const diffDays = Math.round((d.getTime() - todayStart.getTime()) / 86400000);
    return diffDays === 1 && !b.paid;
  }).reduce((sum, b) => sum + b.amountUsd, 0);

  const habitsDoneToday = data.habits.filter((h) => {
    const s = habitStats(data, h.id);
    const todayKey = s.days30.at(-1)!;
    return !!s.map[todayKey];
  }).length;

  const ruleResults = evaluateTodayRules(data);
  const dayStatus = aggregateDayStatus(ruleResults);

  const toggleProtocol = (field: 'amPrepDone' | 'pmShutdownDone') => {
    const current = !!todayCheckin?.[field];
    onChange(upsertCheckinToday(data, { [field]: !current }));
  };

  // Calculate metrics missing today
  const metricsMissing = [
    !sleepToday && 'sleep',
    // Add other metrics here as needed
  ].filter(Boolean).length;

  return (
    <div className="px-4 pt-4 pb-safe-nav max-w-xl mx-auto">
      {/* Header - aligned with TeamPage style */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Today
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {metricsMissing > 0
              ? `${metricsMissing} metric${metricsMissing !== 1 ? 's' : ''} missing today`
              : 'All metrics logged'}
          </p>
        </div>
        <button
          onClick={onOpenCheckin}
          className="rounded-2xl bg-coral-500 text-white px-3 py-2 text-sm font-semibold"
        >
          Check‑in
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <Card variant="hero" className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Command Center</div>
              <div className="mt-1 text-3xl font-semibold tracking-tight">
                {dayStatus}
                <span className="text-base font-semibold text-gray-500 dark:text-gray-400"> day</span>
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Next best action: {ruleResults.find((r) => r.level !== 'ok')?.label ?? 'Execute plan'}</div>
            </div>
            <div className={
              dayStatus === 'RED'
                ? 'text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                : dayStatus === 'YELLOW'
                ? 'text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                : 'text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
            }>
              {dayStatus}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => toggleProtocol('amPrepDone')} className="rounded-2xl bg-black/5 dark:bg-white/10 px-3 py-2 text-left min-h-[48px]">
              <div className="text-xs text-gray-500">AM prep</div>
              <div className="text-sm font-semibold">{todayCheckin?.amPrepDone ? 'Done' : 'Pending'}</div>
            </button>
            <button onClick={() => toggleProtocol('pmShutdownDone')} className="rounded-2xl bg-black/5 dark:bg-white/10 px-3 py-2 text-left min-h-[48px]">
              <div className="text-xs text-gray-500">PM shutdown</div>
              <div className="text-sm font-semibold">{todayCheckin?.pmShutdownDone ? 'Done' : 'Pending'}</div>
            </button>
          </div>

          <div className="mt-3 space-y-1">
            {ruleResults.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-300">{r.label}</span>
                <span className={
                  r.level === 'block'
                    ? 'text-red-600 dark:text-red-300 font-semibold'
                    : r.level === 'warn'
                    ? 'text-yellow-600 dark:text-yellow-300 font-semibold'
                    : 'text-emerald-600 dark:text-emerald-300 font-semibold'
                }>
                  {r.details}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="hero" className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Daily score</div>
              <div className="mt-1 text-3xl font-semibold tracking-tight">
                {Math.round((((sleepToday ? 1 : 0) + habitsDoneToday / Math.max(1, data.habits.length) + (tradingOk ? 1 : 0)) / 3) * 100)}
                <span className="text-base font-semibold text-gray-500 dark:text-gray-400"> /100</span>
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Sleep · Habits · Trading discipline</div>
            </div>
            <div className="text-right text-xs text-gray-500 dark:text-gray-400">
              <div>Sleep: {sleepToday ? `${sleepToday}h` : '—'}</div>
              <div>Habits: {habitsDoneToday}/{data.habits.length}</div>
              <div>Trading: {tradingOk ? 'OK' : 'Hold'}</div>
            </div>
          </div>
        </Card>

        <div className="-mx-4 px-4 overflow-x-auto md:overflow-visible scrollbar-none">
          <div className="grid grid-flow-col auto-cols-[85%] sm:auto-cols-[75%] md:grid-flow-row md:auto-cols-auto md:grid-cols-2 gap-3 snap-x snap-mandatory md:snap-none">
            <div className="snap-start">
              <MetricTile
                title="Sleep"
                value={sleepToday ? String(sleepToday) : '--'}
                unit="h"
                hint="7-day trend"
                series={sleepSeries.length ? sleepSeries : [6.5, 7.2, 6.9, 7.4, 7.1, 7.8, 7.0]}
              />
            </div>
            <div className="snap-start">
              <MetricTile
                title="Calories"
                value={String(caloriesToday)}
                unit="kcal"
                hint="Target: 3100"
                series={[2800, 3100, 2950, 3200, 3050, 3100, 3150]}
              />
            </div>
            <div className="snap-start">
              <MetricTile
                title="Training"
                value={String(trainingMin)}
                unit="min"
                hint="Zone 2/3"
                series={[0, 40, 0, 60, 0, 30, 60]}
              />
            </div>
            <div className="snap-start">
              <MetricTile
                title="Trading Discipline"
                value={tradingOk ? 'OK' : 'Hold'}
                hint={`${tradesCount}/2 trades · ${tradeLogDone ? 'logged' : 'not logged'}`}
                series={weightSeries.length ? weightSeries : [1, 1, 1, 1, 1, 1, 1]}
              />
            </div>
          </div>
        </div>

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

        <button onClick={onOpenBills} className="text-left">
          <Card variant="interactive" className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Upcoming bills</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Due: today ${dueToday.toFixed(0)} · tomorrow ${dueTomorrow.toFixed(0)} · 7d ${due7.toFixed(0)} · 30d ${due30.toFixed(0)}
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
              {nextBills.length === 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400">No bills yet. Add them in Stats.</div>
              )}
            </div>
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">Tap to manage bills</div>
          </Card>
        </button>
      </div>
    </div>
  );
}
