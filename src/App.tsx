import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import type { TabId } from './components/BottomNav';
import { HomePage } from './pages/HomePage';
import { HabitsPage } from './pages/HabitsPage';
import { StatsPage } from './pages/StatsPage';
import { loadAppData, saveAppData, seedIfEmpty } from './lib/appData';

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

      {tab === 'home' && <HomePage data={data} />}
      {tab === 'habits' && <HabitsPage data={data} onChange={setData} />}
      {tab === 'stats' && <StatsPage data={data} onChange={setData} />}

      <BottomNav tab={tab} onChange={setTab} />
    </div>
  );
}

export default App;
