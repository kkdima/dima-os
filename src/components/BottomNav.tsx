export type TabId = 'home' | 'mission' | 'habits' | 'stats' | 'team' | 'knowledge';

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

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
    </svg>
  );
}

function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4h7a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" />
      <path d="M22 4h-7a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h8z" />
    </svg>
  );
}

const tabs: Array<{ id: TabId; label: string; Icon: typeof HomeIcon }> = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'mission', label: 'Mission', Icon: TargetIcon },
  { id: 'habits', label: 'Habits', Icon: CheckCircleIcon },
  { id: 'stats', label: 'Stats', Icon: BarChartIcon },
  { id: 'knowledge', label: 'Knowledge', Icon: BookOpenIcon },
  { id: 'team', label: 'Team', Icon: GridIcon },
];

export function BottomNav({ tab, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 px-4" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
      <div className="mx-auto max-w-2xl rounded-3xl bg-color-card backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-color-border">
        <div className="grid grid-cols-6">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className="py-2.5 min-h-[50px] transition-transform active:scale-[0.98]"
                aria-current={active ? 'page' : undefined}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className={
                    active
                      ? 'w-9 h-9 rounded-2xl flex items-center justify-center bg-coral-500/15 text-coral-600 dark:text-coral-300 transition-all duration-200'
                      : 'w-9 h-9 rounded-2xl flex items-center justify-center text-color-text-tertiary transition-all duration-200'
                  }>
                    <t.Icon className="w-5 h-5" />
                  </div>
                  <span className={active ? 'text-[11px] font-semibold text-coral-700 dark:text-coral-200' : 'text-[11px] text-color-text-tertiary'}>
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
