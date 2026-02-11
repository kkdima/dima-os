import { useMemo, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Segmented } from '../components/ui/Segmented';
import { habitStats, toggleHabitToday } from '../lib/appData';
import type { AppData } from '../lib/appData';

function HeatRow({ days, map }: { days: string[]; map: Record<string, boolean> }) {
  return (
    <div className="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-1">
      {days.map((d) => (
        <div
          key={d}
          title={d}
          className={
            'h-3 w-full rounded-sm ' +
            (map[d]
              ? 'bg-coral-500'
              : 'bg-black/10 dark:bg-white/10')
          }
        />
      ))}
    </div>
  );
}

export function HabitsPage({ data, onChange }: { data: AppData; onChange: (next: AppData) => void }) {
  const [filter, setFilter] = useState<'all' | 'today' | 'missed'>('all');
  const totalHabits = data.habits.length;
  const doneToday = data.habits.filter((h) => {
    const s = habitStats(data, h.id);
    const todayKey = s.days30.at(-1)!;
    return !!s.map[todayKey];
  }).length;

  const visibleHabits = useMemo(() => {
    return data.habits.filter((h) => {
      const s = habitStats(data, h.id);
      const isDone = !!s.map[s.days30.at(-1)!];
      if (filter === 'today') return isDone;
      if (filter === 'missed') return !isDone;
      return true;
    });
  }, [data, filter]);

  return (
    <div className="px-4 pt-4 pb-safe-nav max-w-xl mx-auto">
      {/* Header - aligned with TeamPage style */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Habits
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {doneToday}/{totalHabits} completed today · Tap to toggle
          </p>
        </div>
      </div>

      <div className="mb-4">
        <Segmented
          value={filter}
          onChange={(v) => setFilter(v as 'all' | 'today' | 'missed')}
          options={[
            { value: 'all', label: 'All' },
            { value: 'today', label: 'Done' },
            { value: 'missed', label: 'Missed' },
          ]}
        />
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {visibleHabits.map((h) => {
          const s = habitStats(data, h.id);
          const doneToday = !!s.map[s.days30.at(-1)!];
          return (
            <button key={h.id} onClick={() => onChange(toggleHabitToday(data, h.id))} className="text-left">
              <Card className={"p-4 transition " + (doneToday ? 'ring-2 ring-coral-500/40' : '')}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{h.emoji ?? '✅'}</span>
                    <div>
                      <div className="font-semibold">{h.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Streak: <span className="font-semibold text-gray-700 dark:text-gray-200">{s.streak}</span> · 7d: {s.pct7}% · 30d: {s.pct30}%
                      </div>
                    </div>
                  </div>
                  <div className={doneToday
                    ? 'text-coral-700 dark:text-coral-200 font-semibold text-xs px-2 py-1 rounded-full bg-coral-500/15'
                    : 'text-gray-500 dark:text-gray-300 font-semibold text-xs px-2 py-1 rounded-full bg-black/5 dark:bg-white/10'}>
                    {doneToday ? 'Done' : 'Not yet'}
                  </div>
                </div>
                <div className="mt-3">
                  <HeatRow days={s.days30} map={s.map} />
                </div>
              </Card>
            </button>
          );
        })}
        {visibleHabits.length === 0 && (
          <Card className="p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">No habits in this filter.</div>
          </Card>
        )}
      </div>

      <div className="mt-6">
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Backup</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Use Stats tab for export/import JSON.</div>
        </Card>
      </div>
    </div>
  );
}
