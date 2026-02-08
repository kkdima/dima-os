import { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { QuickStats } from './components/QuickStats';
import { SearchBar } from './components/SearchBar';
import { LinkSection } from './components/LinkSection';
import { QuickAddSheet } from './components/QuickAddSheet';
import { sections } from './data/links';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) return JSON.parse(saved);
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.body.classList.toggle('dark', darkMode);
    document.body.classList.toggle('light', !darkMode);
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;

    const query = searchQuery.toLowerCase();
    return sections
      .map((section) => ({
        ...section,
        links: section.links.filter((link) =>
          link.title.toLowerCase().includes(query)
        ),
      }))
      .filter((section) => section.links.length > 0);
  }, [searchQuery]);

  return (
    <div className="min-h-screen pb-24">
      <Header darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} />
      <QuickStats />
      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      <div className="flex flex-col gap-6 mt-4">
        {filteredSections.map((section) => (
          <LinkSection key={section.title} section={section} />
        ))}
        {filteredSections.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No links found for "{searchQuery}"
          </div>
        )}
      </div>
      <QuickAddSheet />
    </div>
  );
}

export default App;
