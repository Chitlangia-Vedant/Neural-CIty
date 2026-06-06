import { useEffect, useMemo, useState } from 'react';
import { getCities } from '../api.js';
import CityTable from '../components/CityTable.jsx';
import ErrorState from '../components/ErrorState.jsx';
import FilterBar from '../components/FilterBar.jsx';
import Header from '../components/Header.jsx';
import LoadingState from '../components/LoadingState.jsx';
import { formatNumber, formatScore } from '../utils.js';

export default function RankingsPage({ theme, onToggleTheme }) {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('compositeScore');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedState, setSelectedState] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    getCities()
      .then((data) => {
        if (active) {
          setCities(data);
          setError('');
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const states = useMemo(() => [...new Set(cities.map((city) => city.state).filter(Boolean))].sort(), [cities]);

  const filteredCities = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...cities]
      .filter((city) => !selectedState || city.state === selectedState)
      .filter((city) => Number(city.compositeScore) >= minScore)
      .filter((city) => !query || city.city.toLowerCase().includes(query) || city.state.toLowerCase().includes(query))
      .sort((a, b) => {
        const first = a[sortBy];
        const second = b[sortBy];
        const direction = sortOrder === 'asc' ? 1 : -1;

        if (typeof first === 'string' || typeof second === 'string') {
          return String(first).localeCompare(String(second)) * direction;
        }
        return (Number(first) - Number(second)) * direction;
      });
  }, [cities, minScore, search, selectedState, sortBy, sortOrder]);

  const topCity = cities[0];
  const averageScore = cities.length
    ? cities.reduce((sum, city) => sum + Number(city.compositeScore || 0), 0) / cities.length
    : 0;

  function handleSort(column) {
    if (sortBy === column) {
      setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder(column === 'city' || column === 'state' ? 'asc' : 'desc');
    }
  }

  function resetFilters() {
    setSelectedState('');
    setMinScore(0);
    setSearch('');
  }

  return (
    <main>
      <Header theme={theme} onToggleTheme={onToggleTheme} />
      <section className="page-hero">
        <div>
          <p className="eyebrow">Composite city rankings</p>
          <h1>Rank Indian cities by air, safety, cleanliness, and traffic outcomes.</h1>
        </div>
        <div className="hero-stats" aria-label="Ranking summary">
          <span>
            <strong>{cities.length || '--'}</strong>
            cities
          </span>
          <span>
            <strong>{topCity?.city || '--'}</strong>
            leading city
          </span>
          <span>
            <strong>{formatScore(averageScore)}</strong>
            avg score
          </span>
        </div>
      </section>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!loading && !error && (
        <>
          <FilterBar
            states={states}
            selectedState={selectedState}
            onStateChange={setSelectedState}
            minScore={minScore}
            onMinScoreChange={setMinScore}
            search={search}
            onSearchChange={setSearch}
            onReset={resetFilters}
          />

          <section className="results-summary">
            <strong>{formatNumber(filteredCities.length, { maximumFractionDigits: 0 })}</strong>
            <span>cities match the current filters.</span>
          </section>

          {filteredCities.length ? (
            <CityTable cities={filteredCities} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
          ) : (
            <div className="state-panel">No cities match those filters.</div>
          )}
        </>
      )}
    </main>
  );
}
