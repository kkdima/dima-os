export type TabId = 'home' | 'habits' | 'stats' | 'team';

interface BottomNavProps {
  tab: TabId;
  onChange: (tab: TabId) => void;
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}

function BarChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

const tabs: Array<{ id: TabId; label: string; Icon: typeof HomeIcon }> = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'habits', label: 'Habits', Icon: CheckCircleIcon },
  { id: 'stats', label: 'Stats', Icon: BarChartIcon },
  { id: 'team', label: 'Team', Icon: GridIcon },
];

export function BottomNav({ tab, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 px-4" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
      <div className="mx-auto max-w-xl rounded-3xl bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-black/5 dark:border-white/10">
        <div className="grid grid-cols-4">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className="py-3 min-h-[52px] transition-transform active:scale-[0.98]"
                aria-current={active ? 'page' : undefined}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className={
                    active
                      ? 'w-10 h-10 rounded-2xl flex items-center justify-center bg-coral-500/15 text-coral-600 dark:text-coral-300 transition-all duration-200'
                      : 'w-10 h-10 rounded-2xl flex items-center justify-center text-gray-500 dark:text-gray-400 transition-all duration-200'
                  }>
                    <t.Icon className="w-5 h-5" />
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
