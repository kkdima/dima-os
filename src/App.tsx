import { useState, useEffect, lazy, Suspense, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DesktopSidebar } from './components/ui/DesktopSidebar';
import type { TabId } from './components/BottomNav';
import { loadAppData, saveAppData, seedIfEmpty } from './lib/appData';

const TAB_STORAGE_KEY = 'ui.tab';
const TAB_IDS: TabId[] = ['home', 'mission', 'habits', 'stats', 'team', 'knowledge'];

function readStoredTab(): TabId | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TAB_STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (TAB_IDS.includes(parsed as TabId)) return parsed as TabId;
    } catch {
      if (TAB_IDS.includes(raw as TabId)) return raw as TabId;
    }
  } catch {
    return null;
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useDebouncedCallback<T extends (...args: any[]) => void>(callback: T, delay: number) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const MissionControlPage = lazy(() =>
  import('./pages/MissionControlPage').then((m) => ({ default: m.MissionControlPage })),
);
const HabitsPage = lazy(() => import('./pages/HabitsPage').then((m) => ({ default: m.HabitsPage })));
const StatsPage = lazy(() => import('./pages/StatsPage').then((m) => ({ default: m.StatsPage })));
const TeamPage = lazy(() => import('./pages/TeamPage').then((m) => ({ default: m.TeamPage })));
const KnowledgePage = lazy(() => import('./pages/KnowledgePage').then((m) => ({ default: m.KnowledgePage })));
const DailyCheckinModal = lazy(() =>
  import('./components/DailyCheckinModal').then((m) => ({ default: m.DailyCheckinModal })),
);

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) return JSON.parse(saved);
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [tab, setTab] = useState<TabId>(() => readStoredTab() ?? 'home');
  const [data, setData] = useState(() => seedIfEmpty(loadAppData()));
  const [statsFocus, setStatsFocus] = useState<null | 'bills'>(null);
  const [checkinOpen, setCheckinOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.body.classList.toggle('dark', darkMode);
    document.body.classList.toggle('light', !darkMode);
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(tab));
    } catch {
      // Ignore storage failures (e.g. quota, disabled storage).
    }
  }, [tab]);

  const debouncedSave = useDebouncedCallback((d: typeof data) => {
    saveAppData(d);
  }, 300);

  useEffect(() => {
    debouncedSave(data);
  }, [data, debouncedSave]);

  return (
    <div className="min-h-screen md:flex">
      {/* Desktop Sidebar - hidden on mobile */}
      <DesktopSidebar 
        darkMode={darkMode} 
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        tab={tab}
        onTabChange={setTab}
      />

      {/* Main Content Area */}
      <main className="md:ml-64 flex-1">
        {/* Mobile Header - hidden on desktop */}
        <div className="md:hidden">
          <Header darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} />
        </div>

        <Suspense fallback={<div className="px-4 pt-6 text-sm text-color-text-tertiary">Loading…</div>}>
          <div className="px-4 pt-4 pb-20 md:pb-6 md:pt-6 max-w-7xl mx-auto">
            {tab === 'home' && (
              <HomePage
                data={data}
                onChange={setData}
                onOpenBills={() => {
                  setTab('stats');
                  setStatsFocus('bills');
                }}
                onOpenCheckin={() => setCheckinOpen(true)}
              />
            )}
            {tab === 'mission' && <MissionControlPage data={data} onChange={setData} />}
            {tab === 'habits' && <HabitsPage data={data} onChange={setData} />}
            {tab === 'stats' && (
              <StatsPage
                data={data}
                onChange={setData}
                focus={statsFocus}
                onFocusHandled={() => setStatsFocus(null)}
              />
            )}

            {tab === 'team' && <TeamPage data={data} onChange={setData} />}
            {tab === 'knowledge' && <KnowledgePage />}

            <DailyCheckinModal
              open={checkinOpen}
              onClose={() => setCheckinOpen(false)}
              data={data}
              onChange={setData}
            />
          </div>
        </Suspense>

        {/* Mobile Bottom Navigation - hidden on desktop */}
        <div className="md:hidden">
          <BottomNav tab={tab} onChange={setTab} />
        </div>
      </main>
    </div>
  );
}

export default App;