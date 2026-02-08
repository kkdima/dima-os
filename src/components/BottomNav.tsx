export type TabId = 'home' | 'habits' | 'stats';

interface BottomNavProps {
  tab: TabId;
  onChange: (tab: TabId) => void;
}

const tabs: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'habits', label: 'Habits', icon: '✅' },
  { id: 'stats', label: 'Stats', icon: '📊' },
];

export function BottomNav({ tab, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-4">
      <div className="mx-auto max-w-xl rounded-3xl bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-black/5 dark:border-white/10">
        <div className="grid grid-cols-3">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className="py-3"
                aria-current={active ? 'page' : undefined}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className={
                    active
                      ? 'w-10 h-10 rounded-2xl flex items-center justify-center bg-coral-500/15 text-coral-600 dark:text-coral-300'
                      : 'w-10 h-10 rounded-2xl flex items-center justify-center text-gray-500 dark:text-gray-400'
                  }>
                    <span className="text-lg">{t.icon}</span>
                  </div>
                  <span className={active ? 'text-xs font-semibold text-coral-700 dark:text-coral-200' : 'text-xs text-gray-500 dark:text-gray-400'}>
                    {t.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
