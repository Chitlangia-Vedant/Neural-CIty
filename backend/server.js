const express = require('express');
const cors = require('cors');
const { loadAndProcessData } = require('./data-loader');
const { router: citiesRouter, setCitiesData } = require('./routes/cities');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

let dataLoaded = false;

async function initializeServer() {
  try {
    console.log('Starting server initialization...');
    const { cities, nationalAverages } = await loadAndProcessData();

    // Log sample city to see what data structure we have
    const sampleCity = cities[0];
    console.log('[DEBUG] Sample city keys:', Object.keys(sampleCity).sort());
    console.log('[DEBUG] Has aqiDetails:', !!sampleCity.aqiDetails);
    console.log('[DEBUG] Has crimeDetails:', !!sampleCity.crimeDetails);

    setCitiesData(cities, nationalAverages);
    dataLoaded = true;
    console.log('✓ Data loaded successfully');
  } catch (error) {
    console.error('Failed to load data:', error);
    process.exit(1);
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', dataLoaded });
});

app.use('/api/cities', citiesRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

async function start() {
  await initializeServer();
  app.listen(PORT, () => {
    console.log(`\n✓ Server running on http://localhost:${PORT}`);
    console.log(`\nAvailable endpoints:`);
    console.log(`  GET /api/cities - List all cities`);
    console.log(`  GET /api/cities/:cityName - Get city details`);
    console.log(`  GET /api/cities/stats/states - Get list of states`);
  });
}

start();

module.exports = app;
