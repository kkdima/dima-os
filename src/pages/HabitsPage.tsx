import { useMemo, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Segmented } from '../components/ui/Segmented';
import { habitStats, toggleHabitToday, addHabit, removeHabit } from '../lib/appData';
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
              : 'bg-color-bg-secondary bg-color-bg-secondary')
          }
        />
      ))}
    </div>
  );
}

export function HabitsPage({ data, onChange }: { data: AppData; onChange: (next: AppData) => void }) {
  const [filter, setFilter] = useState<'all' | 'today' | 'missed'>('all');
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitEmoji, setNewHabitEmoji] = useState('✅');
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

  const handleAddHabit = () => {
    if (!newHabitTitle.trim()) return;
    onChange(addHabit(data, newHabitTitle, newHabitEmoji));
    setNewHabitTitle('');
    setNewHabitEmoji('✅');
  };

  const handleDeleteHabit = (id: string) => {
    if (confirm('Delete this habit?')) {
      onChange(removeHabit(data, id));
    }
  };

  return (
    <div className="px-4 pt-4 pb-safe-nav max-w-xl mx-auto">
      {/* Header - aligned with TeamPage style */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-color-text-primary">
            Habits
          </h1>
          <p className="text-xs text-color-text-tertiary mt-0.5">
            {doneToday}/{totalHabits} completed today · Tap to toggle
          </p>
        </div>
      </div>

      {/* Add new habit form */}
      <Card className="p-3 mb-4">
        <div className="flex gap-2">
          <input
            value={newHabitEmoji}
            onChange={(e) => setNewHabitEmoji(e.target.value)}
            placeholder="✅"
            className="w-12 text-center rounded-2xl bg-color-bg-secondary px-2 py-2 outline-none text-lg"
            maxLength={2}
          />
          <input
            value={newHabitTitle}
            onChange={(e) => setNewHabitTitle(e.target.value)}
            placeholder="New habit name..."
            className="flex-1 rounded-2xl bg-color-bg-secondary px-3 py-2 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
          />
          <button
            onClick={handleAddHabit}
            disabled={!newHabitTitle.trim()}
            className="rounded-2xl bg-coral-500 text-white px-4 py-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </Card>

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
            <div key={h.id} className="relative group">
              <button onClick={() => onChange(toggleHabitToday(data, h.id))} className="text-left w-full">
                <Card className={"p-4 transition " + (doneToday ? 'ring-2 ring-coral-500/40' : '')}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{h.emoji ?? '✅'}</span>
                      <div>
                        <div className="font-semibold">{h.title}</div>
                        <div className="text-xs text-color-text-tertiary">
                          Streak: <span className="font-semibold text-color-text-secondary">{s.streak}</span> · 7d: {s.pct7}% · 30d: {s.pct30}%
                        </div>
                      </div>
                    </div>
                    <div className={doneToday
                      ? 'text-coral-700 dark:text-coral-200 font-semibold text-xs px-2 py-1 rounded-full bg-coral-500/15'
                      : 'text-color-text-tertiary dark:text-color-text-tertiary font-semibold text-xs px-2 py-1 rounded-full bg-color-bg-secondary'}>
                      {doneToday ? 'Done' : 'Not yet'}
                    </div>
                  </div>
                  <div className="mt-3">
                    <HeatRow days={s.days30} map={s.map} />
                  </div>
                </Card>
              </button>
              {/* Delete button - shown on hover/group-hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteHabit(h.id);
                }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-color-bg-secondary text-color-text-tertiary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                aria-label="Delete habit"
              >
                ✕
              </button>
            </div>
          );
        })}
        {visibleHabits.length === 0 && (
          <Card className="p-4">
            <div className="text-sm text-color-text-tertiary">No habits in this filter.</div>
          </Card>
        )}
      </div>

    </div>
  );
}
