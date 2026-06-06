export const metricLabels = {
  rank: 'Rank',
  city: 'City',
  state: 'State',
  compositeScore: 'Composite Score',
  aqi: 'AQI',
  chargesheettingRate: 'Chargesheeting',
  cleanliness: 'Cleanliness',
  traffic: 'Traffic',
};

export function formatNumber(value, options = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'Data not available';
  }
  return new Intl.NumberFormat('en-IN', options).format(Number(value));
}

export function formatScore(value) {
  return formatNumber(value, { maximumFractionDigits: 1 });
}

export function scoreBand(score) {
  if (score >= 66) return 'good';
  if (score >= 42) return 'medium';
  return 'poor';
}

export function trendFromValues(current, previous) {
  if (current === null || previous === null || current === undefined || previous === undefined) {
    return { label: 'Data not available', className: 'muted' };
  }
  const delta = Number(current) - Number(previous);
  if (Math.abs(delta) < 1) return { label: 'Stable', className: 'neutral', delta };
  return {
    label: delta > 0 ? `Up ${formatNumber(delta, { maximumFractionDigits: 0 })}` : `Down ${formatNumber(Math.abs(delta), { maximumFractionDigits: 0 })}`,
    className: delta > 0 ? 'positive' : 'negative',
    delta,
  };
}
