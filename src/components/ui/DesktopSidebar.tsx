import { format } from 'date-fns';
import type { TabId } from '../BottomNav';

interface DesktopSidebarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  tab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function DesktopSidebar({ darkMode, onToggleDarkMode, tab, onTabChange }: DesktopSidebarProps) {
  const tabs: Array<{ id: TabId; label: string; icon: string }> = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'mission', label: 'Mission', icon: '🎯' },
    { id: 'habits', label: 'Habits', icon: '✅' },
    { id: 'stats', label: 'Stats', icon: '📊' },
    { id: 'team', label: 'Team', icon: '👥' },
    { id: 'knowledge', label: 'Knowledge', icon: '📚' },
  ];

  return (
    <aside className="hidden md:flex md:flex-col w-64 h-screen fixed left-0 top-0 border-r border-color-border bg-color-card overflow-y-auto">
      {/* Logo and header */}
      <div className="p-6 border-b border-color-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-coral-500 flex items-center justify-center text-white font-bold">
            D
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Dima OS</h1>
            <p className="text-sm text-color-text-tertiary">{format(new Date(), 'EEE, MMM d')}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {tabs.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => onTabChange(t.id)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                  tab === t.id
                    ? 'bg-coral-500/10 text-coral-600 dark:text-coral-300 font-semibold'
                    : 'text-color-text-secondary hover:bg-color-bg-secondary'
                }`}
              >
                <span className="text-lg">{t.icon}</span>
                <span>{t.label}</span>
                {tab === t.id && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-coral-500"></span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Dark mode toggle and footer */}
      <div className="p-4 border-t border-color-border">
        <button
          onClick={onToggleDarkMode}
          className="w-full px-4 py-3 rounded-xl bg-color-bg-secondary text-color-text-secondary hover:bg-color-bg hover:text-color-text-primary transition-colors flex items-center justify-between"
          aria-label="Toggle dark mode"
        >
          <span className="flex items-center gap-3">
            {darkMode ? (
              <>
                <span className="text-lg">🌙</span>
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <span className="text-lg">☀️</span>
                <span>Light Mode</span>
              </>
            )}
          </span>
          <div className={`w-10 h-6 rounded-full transition-all duration-200 relative ${darkMode ? 'bg-coral-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 ${darkMode ? 'left-5' : 'left-1'}`}></div>
          </div>
        </button>
        
        <div className="mt-4 text-xs text-color-text-tertiary text-center">
          <p>Dashboard v1.0</p>
          <p className="mt-1">© {new Date().getFullYear()} Dima OS</p>
        </div>
      </div>
    </aside>
  );
}