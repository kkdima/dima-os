import { useState, useEffect, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import type { TabId } from './components/BottomNav';
import { loadAppData, saveAppData, seedIfEmpty } from './lib/appData';

const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const HabitsPage = lazy(() => import('./pages/HabitsPage').then((m) => ({ default: m.HabitsPage })));
const StatsPage = lazy(() => import('./pages/StatsPage').then((m) => ({ default: m.StatsPage })));
const TeamPage = lazy(() => import('./pages/TeamPage').then((m) => ({ default: m.TeamPage })));
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

  const [tab, setTab] = useState<TabId>('home');
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
    saveAppData(data);
  }, [data]);

  return (
    <div className="min-h-screen pb-28">
      <Header darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} />

      <Suspense fallback={<div className="px-4 pt-6 text-sm text-gray-500">Loading…</div>}>
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

        <DailyCheckinModal
          open={checkinOpen}
          onClose={() => setCheckinOpen(false)}
          data={data}
          onChange={setData}
        />
      </Suspense>

      <BottomNav tab={tab} onChange={setTab} />
    </div>
  );
}

export default App;
