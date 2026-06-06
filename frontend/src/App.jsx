import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import RankingsPage from './pages/RankingsPage.jsx';
import CityDetailPage from './pages/CityDetailPage.jsx';

export default function App() {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('neural-city-theme');
    if (stored) return stored;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('neural-city-theme', theme);
  }, [theme]);

  const themeProps = {
    theme,
    onToggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
  };

  return (
    <Routes>
      <Route path="/" element={<RankingsPage {...themeProps} />} />
      <Route path="/rankings" element={<RankingsPage {...themeProps} />} />
      <Route path="/city/:cityName" element={<CityDetailPage {...themeProps} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
