import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { MetricTile } from '../components/dashboard/MetricTile';
import type { AppData } from '../lib/appData';
import { computeUpcomingBills, sumUpcoming } from '../lib/bills';
import { habitStats, getTodayCheckin, upsertCheckinToday } from '../lib/appData';
import { evaluateTodayRules, aggregateDayStatus } from '../lib/rules';
import { isoDate } from '../lib/dates';
import { BottomSheet } from '../components/ui/BottomSheet';
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
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const last7 = data.metrics.slice(-7);
  const sleepSeries = last7.map((m) => m.sleepHours ?? 0);
  
  // Build sparkline data from checkins
  const last7Checkins = data.checkins.slice(-7);
  const caloriesSeries = last7Checkins.map((c) => c.caloriesKcal ?? 0);
  const trainingSeries = last7Checkins.map((c) => c.trainingMin ?? 0);

  const todayKey = isoDate(new Date());
  const todayMetric = data.metrics.find((m) => m.date === todayKey);
  const sleepToday = todayMetric?.sleepHours;
  const weightToday = todayMetric?.weightKg;

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

  const habitsTotal = Math.max(1, data.habits.length);
  const habitsRemaining = Math.max(0, data.habits.length - habitsDoneToday);
  const tradesRemaining = Math.max(0, 2 - tradesCount);

  const ruleResults = evaluateTodayRules(data);
  const dayStatus = aggregateDayStatus(ruleResults);
  const focusItems = ruleResults.filter((r) => r.level !== 'ok').slice(0, 3);
  const nextAction = focusItems[0]?.label ?? 'Execute plan';

  const toggleProtocol = (field: 'amPrepDone' | 'pmShutdownDone' | 'tradeLogDone') => {
    const current = !!todayCheckin?.[field];
    onChange(upsertCheckinToday(data, { [field]: !current }));
  };

  // Calculate metrics missing today
  const metricsMissing = [
    sleepToday === undefined && 'sleep',
    weightToday === undefined && 'weight',
  ].filter(Boolean).length;

  const checkinStatus = todayCheckin
    ? metricsMissing > 0
      ? `${metricsMissing} metric${metricsMissing !== 1 ? 's' : ''} missing`
      : 'Complete'
    : 'Start check‑in';

  const score = Math.round((((sleepToday ? 1 : 0) + habitsDoneToday / habitsTotal + (tradingOk ? 1 : 0)) / 3) * 100);

  const quickCaptureCommands = [
    { id: 'inbox', label: 'Inbox', command: 'inbox:' },
    { id: 'buy', label: 'Buy', command: 'buy:' },
    { id: 'trade', label: 'Trade', command: 'trade:' },
    { id: 'debrief', label: 'Debrief', command: 'debrief:' },
  ];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'k') return;
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) {
        return;
      }
      e.preventDefault();
      setQuickCaptureOpen(true);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const copyCommand = async (id: string, command: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(id);
      window.setTimeout(() => setCopiedCommand(null), 1200);
    } catch {
      setCopiedCommand(null);
    }
  };

  return (
    <div className="pb-safe-nav max-w-7xl mx-auto">
      {/* Header - aligned with TeamPage style */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-color-text-primary">
            Today
          </h1>
          <p className="text-xs text-color-text-tertiary mt-0.5">
            {metricsMissing > 0
              ? `${metricsMissing} metric${metricsMissing !== 1 ? 's' : ''} missing today`
              : 'All metrics logged'}
          </p>
        </div>
        <button
          onClick={onOpenCheckin}
          className="rounded-2xl bg-coral-500 text-white px-3 py-2 text-sm font-semibold hover:bg-coral-600 transition-colors"
        >
          Check‑in
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card variant="hero" className="p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-color-text-secondary">Command Center</div>
              <div className="mt-1 text-3xl font-semibold tracking-tight text-color-text-primary">
                {dayStatus}
                <span className="text-base font-semibold text-color-text-tertiary"> day</span>
              </div>
              <div className="mt-1 text-xs text-color-text-tertiary">Next best action: {nextAction}</div>
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

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => toggleProtocol('amPrepDone')}
              className="rounded-2xl bg-color-bg-secondary hover:bg-color-bg px-3 py-2 text-left min-h-[52px] transition-colors"
              aria-label={`AM prep: ${todayCheckin?.amPrepDone ? 'Done' : 'Pending'}. Click to toggle`}
              aria-pressed={todayCheckin?.amPrepDone}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-color-text-tertiary">AM prep</div>
                  <div className="text-sm font-semibold text-color-text-primary">{todayCheckin?.amPrepDone ? 'Done' : 'Pending'}</div>
                </div>
                <div className={todayCheckin?.amPrepDone ? 'text-xs font-semibold text-emerald-600 dark:text-emerald-300' : 'text-xs text-color-text-tertiary'}>
                  {todayCheckin?.amPrepDone ? '✓' : '—'}
                </div>
              </div>
            </button>
            <button
              onClick={() => toggleProtocol('tradeLogDone')}
              className="rounded-2xl bg-color-bg-secondary hover:bg-color-bg px-3 py-2 text-left min-h-[52px] transition-colors"
              aria-label={`Trade log: ${tradeLogDone ? 'Logged' : 'Pending'}. Click to toggle`}
              aria-pressed={tradeLogDone}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-color-text-tertiary">Trade log</div>
                  <div className="text-sm font-semibold text-color-text-primary">{tradeLogDone ? 'Logged' : 'Pending'}</div>
                </div>
                <div className="text-xs text-color-text-tertiary">{tradesCount}/2</div>
              </div>
            </button>
            <button
              onClick={onOpenCheckin}
              className="rounded-2xl bg-color-bg-secondary hover:bg-color-bg px-3 py-2 text-left min-h-[52px] transition-colors"
              aria-label="Open daily check-in"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-color-text-tertiary">Check‑in</div>
                  <div className="text-sm font-semibold text-color-text-primary">{checkinStatus}</div>
                </div>
                <div className="text-xs font-semibold text-coral-600 dark:text-coral-300">Open</div>
              </div>
            </button>
            <button
              onClick={() => toggleProtocol('pmShutdownDone')}
              className="rounded-2xl bg-color-bg-secondary hover:bg-color-bg px-3 py-2 text-left min-h-[52px] transition-colors"
              aria-label={`PM shutdown: ${todayCheckin?.pmShutdownDone ? 'Done' : 'Pending'}. Click to toggle`}
              aria-pressed={todayCheckin?.pmShutdownDone}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-color-text-tertiary">PM shutdown</div>
                  <div className="text-sm font-semibold text-color-text-primary">{todayCheckin?.pmShutdownDone ? 'Done' : 'Pending'}</div>
                </div>
                <div className={todayCheckin?.pmShutdownDone ? 'text-xs font-semibold text-emerald-600 dark:text-emerald-300' : 'text-xs text-color-text-tertiary'}>
                  {todayCheckin?.pmShutdownDone ? '✓' : '—'}
                </div>
              </div>
            </button>
          </div>

          <div className="mt-4 border-t border-color-border pt-3 space-y-1">
            <div className="text-xs font-semibold text-color-text-secondary">Focus checks</div>
            {focusItems.length > 0 ? (
              focusItems.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-xs">
                  <span className="text-color-text-secondary">{r.label}</span>
                  <span className={
                    r.level === 'block'
                      ? 'text-red-600 dark:text-red-300 font-semibold'
                      : 'text-yellow-600 dark:text-yellow-300 font-semibold'
                  }>
                    {r.details}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-color-text-tertiary">All clear. Execute plan.</div>
            )}
          </div>
        </Card>

        <Card variant="hero" className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-color-text-secondary">Daily score</div>
              <div className="mt-1 text-3xl font-semibold tracking-tight text-color-text-primary">
                {score}
                <span className="text-base font-semibold text-color-text-tertiary"> /100</span>
              </div>
              <div className="mt-1 text-xs text-color-text-tertiary">Sleep · Habits · Trading discipline</div>
              <div className="mt-2 text-xs text-color-text-tertiary">
                {habitsRemaining} habit{habitsRemaining !== 1 ? 's' : ''} left · {tradesRemaining} trade slot{tradesRemaining !== 1 ? 's' : ''} left
              </div>
            </div>
            <div className="text-right text-xs text-color-text-tertiary">
              <div>Sleep: {sleepToday ? `${sleepToday}h` : '—'}</div>
              <div>Habits: {habitsDoneToday}/{data.habits.length}</div>
              <div>Trading: {tradingOk ? 'OK' : 'Hold'}</div>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-color-bg-secondary">
            <div
              className="h-2 rounded-full bg-coral-500 transition-all"
              style={{ width: `${score}%` }}
            />
          </div>
        </Card>

        <button
          onClick={() => setQuickCaptureOpen(true)}
          className="text-left lg:col-span-2"
          aria-label="Open quick capture"
        >
          <Card variant="interactive" className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-color-text-secondary">Quick capture</div>
                <div className="mt-1 text-xs text-color-text-tertiary">Copy a command for Telegram and move</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="px-2 py-0.5 rounded-full border border-color-border text-[10px] font-semibold text-color-text-tertiary">Cmd+K</span>
                <span className="px-2 py-0.5 rounded-full border border-color-border text-[10px] font-semibold text-color-text-tertiary">Ctrl+K</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {quickCaptureCommands.map((item) => (
                <span
                  key={item.id}
                  className="px-2 py-1 rounded-2xl bg-color-bg-secondary text-xs font-semibold text-color-text-secondary"
                >
                  <span className="font-mono">{item.command}</span>
                </span>
              ))}
            </div>
            <div className="mt-3 text-xs text-color-text-tertiary">Tap to open command sheet</div>
          </Card>
        </button>

        <Card className="p-4 lg:col-span-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-color-text-secondary">Habits</div>
              <div className="mt-1 text-3xl font-semibold tracking-tight text-color-text-primary">
                {habitsDoneToday}/{data.habits.length}
              </div>
              <div className="mt-1 text-xs text-color-text-tertiary">Done today</div>
            </div>
            <div className="text-coral-600 dark:text-coral-300 font-semibold text-sm">✓</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.habits.slice(0, 6).map((h) => {
              const s = habitStats(data, h.id);
              const todayKey = s.days30.at(-1)!;
              const done = !!s.map[todayKey];
              return (
                <span
                  key={h.id}
                  className={
                    'text-xs px-2 py-1 rounded-2xl border transition-colors ' +
                    (done
                      ? 'bg-coral-500/15 text-coral-700 dark:text-coral-200 border-coral-500/20'
                      : 'bg-color-bg-secondary text-color-text-secondary border-color-border')
                  }
                >
                  {(h.emoji ?? '✅') + ' ' + h.title}
                </span>
              );
            })}
          </div>
        </Card>

        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-color-text-secondary">Today metrics</div>
            <div className="text-xs text-color-text-tertiary">Last 7 days</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                series={caloriesSeries.length ? caloriesSeries : [2800, 3100, 2950, 3200, 3050, 3100, 3150]}
              />
            </div>
            <div className="snap-start">
              <MetricTile
                title="Training"
                value={String(trainingMin)}
                unit="min"
                hint="Zone 2/3"
                series={trainingSeries.length ? trainingSeries : [0, 40, 0, 60, 0, 30, 60]}
              />
            </div>
            <div className="snap-start">
              <MetricTile
                title="Trading Discipline"
                value={tradingOk ? 'OK' : 'Hold'}
                hint={`${tradesCount}/2 trades · ${tradeLogDone ? 'logged' : 'not logged'}`}
                series={[]}
              />
            </div>
          </div>
        </div>

        <button
          onClick={onOpenBills}
          className="text-left lg:col-span-3"
          aria-label="View and manage upcoming bills"
        >
          <Card variant="interactive" className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-color-text-secondary">Upcoming bills</div>
                <div className="mt-1 text-xs text-color-text-tertiary">
                  Today ${dueToday.toFixed(0)} · Tomorrow ${dueTomorrow.toFixed(0)} · 7d ${due7.toFixed(0)} · 30d ${due30.toFixed(0)}
                </div>
              </div>
              <div className="text-xs font-semibold text-color-text-tertiary">Open</div>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {nextBills.map((b) => (
                <div key={b.id + b.dueDate} className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-color-text-primary">{b.title}</div>
                  <div className={b.paid ? 'text-xs text-color-text-tertiary' : 'text-sm font-semibold text-color-text-primary'}>
                    ${b.amountUsd.toFixed(0)} <span className="text-xs text-color-text-tertiary">· {b.dueDate}</span>
                  </div>
                </div>
              ))}
              {nextBills.length === 0 && (
                <div className="text-sm text-color-text-tertiary">No bills yet. Add them in Stats.</div>
              )}
            </div>
            <div className="mt-3 text-xs text-color-text-tertiary">Tap to manage bills</div>
          </Card>
        </button>
      </div>

      <BottomSheet
        open={quickCaptureOpen}
        onClose={() => setQuickCaptureOpen(false)}
        title="Quick capture"
        description="Copy a command and paste into Telegram"
      >
        <div className="space-y-2">
          {quickCaptureCommands.map((item) => (
            <button
              key={item.id}
              onClick={() => copyCommand(item.id, item.command)}
              className="w-full rounded-2xl bg-color-bg-secondary hover:bg-color-bg px-3 py-2 text-left transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-color-text-primary">{item.label}</div>
                  <div className="text-xs font-mono text-color-text-tertiary">{item.command}</div>
                </div>
                <div className="text-xs font-semibold text-color-text-tertiary">
                  {copiedCommand === item.id ? 'Copied' : 'Copy'}
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-3 text-xs text-color-text-tertiary">Shortcut: Cmd+K / Ctrl+K</div>
      </BottomSheet>
    </div>
  );
}
