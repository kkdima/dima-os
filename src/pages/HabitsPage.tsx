import { Card } from '../components/ui/Card';
import { habitStats, toggleHabitToday } from '../lib/appData';
import type { AppData } from '../lib/appData';

function HeatRow({ days, map }: { days: string[]; map: Record<string, boolean> }) {
  return (
    <div className="grid grid-cols-30 gap-1">
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
  return (
    <div className="px-4 pt-3 pb-28 max-w-xl mx-auto">
      <div className="flex items-end justify-between">
        <h2 className="text-3xl font-semibold tracking-tight">Habits</h2>
        <div className="text-xs text-gray-500 dark:text-gray-400">Tap a habit to toggle today</div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {data.habits.map((h) => {
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
                  <div className={doneToday ? 'text-coral-600 dark:text-coral-300 font-semibold' : 'text-gray-400'}>
                    {doneToday ? 'Done' : '—'}
                  </div>
                </div>
                <div className="mt-3">
                  <HeatRow days={s.days30} map={s.map} />
                </div>
              </Card>
            </button>
          );
        })}
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
