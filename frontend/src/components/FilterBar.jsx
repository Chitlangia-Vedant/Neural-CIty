export default function FilterBar({
  states,
  selectedState,
  onStateChange,
  minScore,
  onMinScoreChange,
  search,
  onSearchChange,
  onReset,
}) {
  return (
    <section className="filter-bar" aria-label="Filter city rankings">
      <label>
        <span>Search</span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Find a city"
        />
      </label>

      <label>
        <span>State</span>
        <select value={selectedState} onChange={(event) => onStateChange(event.target.value)}>
          <option value="">All states</option>
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </label>

      <label className="range-label">
        <span>Minimum score: {minScore}</span>
        <input
          type="range"
          min="0"
          max="100"
          value={minScore}
          onChange={(event) => onMinScoreChange(Number(event.target.value))}
        />
      </label>

      <button className="secondary-button" type="button" onClick={onReset}>
        Reset
      </button>
    </section>
  );
}
