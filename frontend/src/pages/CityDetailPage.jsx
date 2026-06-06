import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCity } from '../api.js';
import CleanlinessChart from '../components/CleanlinessChart.jsx';
import ErrorState from '../components/ErrorState.jsx';
import Header from '../components/Header.jsx';
import LoadingState from '../components/LoadingState.jsx';
import MetricCard from '../components/MetricCard.jsx';
import TrafficChart from '../components/TrafficChart.jsx';
import { formatNumber, formatScore, scoreBand, trendFromValues } from '../utils.js';

const pollutantLabels = [
  ['pm25', 'PM2.5'],
  ['pm10', 'PM10'],
  ['no2', 'NO2'],
  ['so2', 'SO2'],
  ['co', 'CO'],
  ['o3', 'O3'],
  ['nh3', 'NH3'],
  ['pb', 'Pb'],
];

export default function CityDetailPage({ theme, onToggleTheme }) {
  const { cityName } = useParams();
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    getCity(cityName)
      .then((data) => {
        if (active) {
          setCity(data);
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
  }, [cityName]);

  const crimeTrend = useMemo(() => {
    if (!city?.crimeDetails) return { label: 'Data not available', className: 'muted' };
    const { cases2024, cases2022 } = city.crimeDetails;
    const trend = trendFromValues(cases2024, cases2022);
    if (trend.delta < 0) return { label: 'Declining since 2022', className: 'positive' };
    if (trend.delta > 0) return { label: 'Increasing since 2022', className: 'negative' };
    return { label: 'Stable since 2022', className: 'neutral' };
  }, [city]);

  return (
    <main>
      <Header showBack theme={theme} onToggleTheme={onToggleTheme} />

      {loading && <LoadingState label="Loading city profile" />}
      {error && (
        <div className="detail-error">
          <ErrorState message={error} />
          <Link className="primary-button" to="/">
            Return to rankings
          </Link>
        </div>
      )}

      {!loading && !error && city && (
        <>
          <section className={`city-hero hero-${scoreBand(city.compositeScore)}`}>
            <div>
              <p className="eyebrow">{city.state}</p>
              <h1>{city.city}</h1>
              <span className="rank-badge">National rank #{city.rank} of 18</span>
            </div>
            <div className="score-display">
              <span>Composite score</span>
              <strong>{formatScore(city.compositeScore)}</strong>
            </div>
          </section>

          <section className="section-block">
            <div className="section-heading">
              <h2>Key Metrics</h2>
            </div>
            <div className="metric-grid">
              <MetricCard label="AQI" value={formatNumber(city.aqi, { maximumFractionDigits: 0 })} detail="Lower is better" tone="poor" />
              <MetricCard label="Chargesheeting Rate" value={`${formatScore(city.chargesheettingRate)}%`} detail="Higher is better" tone="good" />
              <MetricCard label="Cleanliness Score" value={formatNumber(city.cleanliness, { maximumFractionDigits: 0 })} detail="Latest available score" tone="good" />
              <MetricCard label="Traffic Accidents" value={formatNumber(city.traffic, { maximumFractionDigits: 0 })} detail="Total cases" tone="medium" />
            </div>
          </section>

          <section className="section-block">
            <div className="section-heading">
              <h2>Air Quality Details</h2>
              <span className="pill">Prominent pollutant: {city.aqiDetails?.prominentPollutant || 'Data not available'}</span>
            </div>
            <div className="pollutant-grid">
              {pollutantLabels.map(([key, label]) => {
                const isProminent = city.aqiDetails?.prominentPollutant?.toLowerCase() === label.toLowerCase();
                return (
                  <article key={key} className={isProminent ? 'pollutant-card prominent' : 'pollutant-card'}>
                    <span>{label}</span>
                    <strong>
                      {city.aqiDetails?.[key] === null || city.aqiDetails?.[key] === undefined
                        ? 'Data not available'
                        : `${formatNumber(city.aqiDetails[key], { maximumFractionDigits: 2 })} ug/m3`}
                    </strong>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="section-block">
            <div className="section-heading">
              <h2>Cleanliness Score Trend</h2>
            </div>
            <CleanlinessChart history={city.cleanlinessHistory} />
          </section>

          <section className="section-block">
            <div className="section-heading">
              <h2>Crime Information</h2>
              <span className={`pill ${crimeTrend.className}`}>{crimeTrend.label}</span>
            </div>
            <div className="metric-grid compact">
              <MetricCard label="Population 2011" value={`${formatScore(city.crimeDetails?.population2011)} L`} />
              <MetricCard label="Cases 2024" value={formatNumber(city.crimeDetails?.cases2024, { maximumFractionDigits: 0 })} />
              <MetricCard label="Cases 2023" value={formatNumber(city.crimeDetails?.cases2023, { maximumFractionDigits: 0 })} />
              <MetricCard label="Cases 2022" value={formatNumber(city.crimeDetails?.cases2022, { maximumFractionDigits: 0 })} />
              <MetricCard label="Crime Rate" value={formatScore(city.crimeDetails?.crimeRate)} detail="Per lakh population" />
              <MetricCard label="Chargesheeting" value={`${formatScore(city.crimeDetails?.chargesheettingRate)}%`} />
            </div>
          </section>

          <section className="section-block">
            <div className="section-heading">
              <h2>Traffic Accident Breakdown</h2>
            </div>
            <TrafficChart breakdown={city.trafficBreakdown} />
          </section>

          <section className="section-block">
            <div className="section-heading">
              <h2>Raw Data</h2>
            </div>
            <table className="detail-table raw-table">
              <tbody>
                <tr>
                  <th>Composite score</th>
                  <td>{formatScore(city.compositeScore)}</td>
                  <td>Equal-weight average of normalized metrics.</td>
                </tr>
                <tr>
                  <th>AQI</th>
                  <td>{formatNumber(city.aqi, { maximumFractionDigits: 0 })}</td>
                  <td>Air Quality Index, lower is better.</td>
                </tr>
                <tr>
                  <th>Chargesheeting rate</th>
                  <td>{formatScore(city.chargesheettingRate)}%</td>
                  <td>Police disposal rate from crime records.</td>
                </tr>
                <tr>
                  <th>Cleanliness</th>
                  <td>{formatNumber(city.cleanliness, { maximumFractionDigits: 0 })}</td>
                  <td>Latest available Swachh Survekshan score.</td>
                </tr>
                <tr>
                  <th>Traffic</th>
                  <td>{formatNumber(city.traffic, { maximumFractionDigits: 0 })}</td>
                  <td>Total accident cases in the traffic dataset.</td>
                </tr>
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  );
}
