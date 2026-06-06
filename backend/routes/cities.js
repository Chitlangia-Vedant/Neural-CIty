const express = require('express');
const router = express.Router();

let citiesData = null;
let nationalAverages = null;

function setCitiesData(data, averages) {
  citiesData = data;
  nationalAverages = averages;
}

router.get('/', (req, res) => {
  if (!citiesData) {
    return res.status(500).json({ error: 'Data not loaded yet' });
  }

  let filtered = [...citiesData];

  if (req.query.state) {
    filtered = filtered.filter(c => c.state === req.query.state);
  }

  if (req.query.scoreMin) {
    const min = parseFloat(req.query.scoreMin);
    filtered = filtered.filter(c => c.compositeScore >= min);
  }

  if (req.query.scoreMax) {
    const max = parseFloat(req.query.scoreMax);
    filtered = filtered.filter(c => c.compositeScore <= max);
  }

  const sortBy = req.query.sortBy || 'compositeScore';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  filtered.sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (aVal < bVal) return -1 * sortOrder;
    if (aVal > bVal) return 1 * sortOrder;
    return 0;
  });

  filtered = filtered.map((city, index) => ({
    ...city,
    displayRank: index + 1,
  }));

  res.json(filtered);
});

router.get('/:cityName', (req, res) => {
  if (!citiesData) {
    return res.status(500).json({ error: 'Data not loaded yet' });
  }

  const city = citiesData.find(c => c.city.toLowerCase() === req.params.cityName.toLowerCase());

  if (!city) {
    return res.status(404).json({ error: 'City not found' });
  }

  res.json({
    rank: city.rank,
    city: city.city,
    state: city.state,
    compositeScore: Math.round(city.compositeScore * 100) / 100,
    aqi: city.aqi,
    chargesheettingRate: city.chargesheettingRate,
    cleanliness: city.cleanliness,
    traffic: city.traffic,
    normalized: city.normalized,
    aqiDetails: city.aqiDetails,
    crimeDetails: city.crimeDetails,
    cleanlinessHistory: city.cleanlinessHistory,
    trafficBreakdown: city.trafficBreakdown,
  });
});

router.get('/stats/states', (req, res) => {
  if (!citiesData) {
    return res.status(500).json({ error: 'Data not loaded yet' });
  }

  const states = [...new Set(citiesData.map(c => c.state))].sort();
  res.json({ states });
});

module.exports = { router, setCitiesData };
