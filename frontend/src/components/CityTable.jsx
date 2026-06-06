import { useNavigate } from 'react-router-dom';
import { formatNumber, formatScore, metricLabels, scoreBand } from '../utils.js';

const columns = [
  { key: 'rank', numeric: true },
  { key: 'city' },
  { key: 'state' },
  { key: 'compositeScore', numeric: true },
  { key: 'aqi', numeric: true },
  { key: 'chargesheettingRate', numeric: true },
  { key: 'cleanliness', numeric: true },
  { key: 'traffic', numeric: true },
];

export default function CityTable({ cities, sortBy, sortOrder, onSort }) {
  const navigate = useNavigate();

  function renderValue(city, key) {
    if (key === 'compositeScore') return formatScore(city[key]);
    if (key === 'chargesheettingRate') return `${formatScore(city[key])}%`;
    if (key === 'cleanliness' || key === 'traffic') return formatNumber(city[key], { maximumFractionDigits: 0 });
    return city[key];
  }

  return (
    <div className="table-wrap">
      <table className="city-table">
        <caption>{cities.length} ranked cities</caption>
        <thead>
          <tr>
            {columns.map((column) => {
              const active = sortBy === column.key;
              return (
                <th key={column.key} scope="col">
                  <button
                    className={active ? 'active-sort' : ''}
                    type="button"
                    onClick={() => onSort(column.key)}
                    aria-sort={active ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    {metricLabels[column.key]}
                    <span aria-hidden="true">{active ? (sortOrder === 'asc' ? 'UP' : 'DN') : ''}</span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {cities.map((city) => (
            <tr
              key={city.city}
              className={`rank-${scoreBand(city.compositeScore)}`}
              onClick={() => navigate(`/city/${encodeURIComponent(city.city)}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate(`/city/${encodeURIComponent(city.city)}`);
                }
              }}
              tabIndex="0"
            >
              {columns.map((column) => (
                <td key={column.key} data-label={metricLabels[column.key]} className={column.numeric ? 'numeric' : ''}>
                  {renderValue(city, column.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
