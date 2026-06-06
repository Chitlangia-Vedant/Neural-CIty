const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const DATASET_PATH = path.join(__dirname, '../Clean Dataset');

function loadCSV(fileName) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(path.join(DATASET_PATH, fileName))
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

function normalizeCityName(city) {
  return city.replace(/\s*\([^)]*\)/g, '').trim();
}

function getLatestCleanlinessScore(row) {
  const ss2025 = parseFloat(row['SS2025(2500)']) || 0;
  if (ss2025 > 0) return ss2025;

  const ss2024 = parseFloat(row['SS2024(10000)']) || 0;
  if (ss2024 > 0) return ss2024;

  const score2023 = parseFloat(row['2023_Score_Max10000']) || 0;
  if (score2023 > 0) return score2023;

  const score2022 = parseFloat(row['2022_Score_Max7500']) || 0;
  if (score2022 > 0) return score2022;

  const score2020 = parseFloat(row['2020_Score_Max6000']) || 0;
  if (score2020 > 0) return score2020;

  return 0;
}

function parseOrNull(value) {
  const parsed = parseFloat(value);
  return isNaN(parsed) || value === '' || value === null ? null : parsed;
}

async function loadAndProcessData() {
  try {
    console.log('Loading CSV files...');
    const [aqiData, crimeData, cleanlinessData, trafficData] = await Promise.all([
      loadCSV('AQI.csv'),
      loadCSV('crime.csv'),
      loadCSV('merged_cleanliness_data.csv'),
      loadCSV('traffic_accidents.csv'),
    ]);

    console.log('Processing data...');

    const aqiMap = {};
    const crimeMap = {};
    const cleanlinessMap = {};
    const trafficMap = {};

    // Process AQI data - store all pollutant details
    aqiData.forEach(row => {
      const city = normalizeCityName(row.City);
      aqiMap[city] = {
        aqi: parseFloat(row.Overall_AQI) || 0,
        aqiDetails: {
          pm25: parseOrNull(row.PM2_5_Conc),
          pm10: parseOrNull(row.PM10_Conc),
          no2: parseOrNull(row.NO2_Conc),
          so2: parseOrNull(row.SO2_Conc),
          co: parseOrNull(row.CO_Conc),
          o3: parseOrNull(row.O3_Conc),
          nh3: parseOrNull(row.NH3_Conc),
          pb: parseOrNull(row.Pb_Conc),
          prominentPollutant: row.Prominent_Pollutant || 'Unknown',
        },
      };
    });

    // Process Crime data - store detailed crime information
    crimeData.forEach(row => {
      const city = normalizeCityName(row.City);
      const state = row.City.includes('(') ? row.City.match(/\(([^)]+)\)/)[1] : 'Unknown';
      crimeMap[city] = {
        chargesheettingRate: parseFloat(row['Chargesheeting Rate (2024)']) || 0,
        state: state,
        crimeDetails: {
          population2011: parseOrNull(row['Actual Population (in Lakhs) (2011)']),
          cases2024: parseOrNull(row['2024']),
          cases2023: parseOrNull(row['2023']),
          cases2022: parseOrNull(row['2022']),
          crimeRate: parseOrNull(row['Rate of Cognizable Crimes (IPC+SLL) (2024)']),
          chargesheettingRate: parseFloat(row['Chargesheeting Rate (2024)']) || 0,
        },
      };
    });

    // Process Cleanliness data - store historical scores
    cleanlinessData.forEach(row => {
      const city = normalizeCityName(row.City);
      cleanlinessMap[city] = {
        cleanliness: getLatestCleanlinessScore(row),
        cleanlinessHistory: {
          2023: parseOrNull(row['2023_Score_Max10000']),
          2022: parseOrNull(row['2022_Score_Max7500']),
          2020: parseOrNull(row['2020_Score_Max6000']),
          2019: parseOrNull(row['2019_Score_5000']),
          2018: parseOrNull(row['2018_Score']),
          2017: parseOrNull(row['2017_Score']),
          2016: parseOrNull(row['2016_Score']),
        },
      };
    });

    // Process Traffic data - store breakdown by type
    trafficData.forEach(row => {
      const city = normalizeCityName(row.City);
      trafficMap[city] = {
        traffic: parseOrNull(row.Total_Cases) || 0,
        trafficBreakdown: {
          road: {
            cases: parseOrNull(row.Road_Cases) || 0,
            injured: parseOrNull(row.Road_Injured) || 0,
            died: parseOrNull(row.Road_Died) || 0,
          },
          railway: {
            cases: parseOrNull(row.Railway_Cases) || 0,
            injured: parseOrNull(row.Railway_Injured) || 0,
            died: parseOrNull(row.Railway_Died) || 0,
          },
          railwayTrack: {
            cases: parseOrNull(row.Railway_Track_Cases) || 0,
            injured: parseOrNull(row.Railway_Track_Injured) || 0,
            died: parseOrNull(row.Railway_Track_Died) || 0,
          },
          railwayCrossing: {
            cases: parseOrNull(row.Railway_Crossing_Cases) || 0,
            injured: parseOrNull(row.Railway_Crossing_Injured) || 0,
            died: parseOrNull(row.Railway_Crossing_Died) || 0,
          },
          totals: {
            cases: parseOrNull(row.Total_Cases) || 0,
            injured: parseOrNull(row.Total_Injured) || 0,
            died: parseOrNull(row.Total_Died) || 0,
          },
        },
      };
    });

    const cities = [];
    const allCities = new Set([
      ...Object.keys(aqiMap),
      ...Object.keys(crimeMap),
      ...Object.keys(cleanlinessMap),
      ...Object.keys(trafficMap),
    ]);

    allCities.forEach(city => {
      if (aqiMap[city] && crimeMap[city] && cleanlinessMap[city] && trafficMap[city]) {
        cities.push({
          city,
          state: crimeMap[city].state,
          aqi: aqiMap[city].aqi,
          chargesheettingRate: crimeMap[city].chargesheettingRate,
          cleanliness: cleanlinessMap[city].cleanliness,
          traffic: trafficMap[city].traffic,
          // Detailed data for city detail page
          aqiDetails: aqiMap[city].aqiDetails,
          crimeDetails: crimeMap[city].crimeDetails,
          cleanlinessHistory: cleanlinessMap[city].cleanlinessHistory,
          trafficBreakdown: trafficMap[city].trafficBreakdown,
        });
      }
    });

    const maxAqi = Math.max(...cities.map(c => c.aqi));
    const maxChargesheettingRate = Math.max(...cities.map(c => c.chargesheettingRate));
    const maxCleanliness = Math.max(...cities.map(c => c.cleanliness));
    const maxTraffic = Math.max(...cities.map(c => c.traffic));

    cities.forEach(city => {
      const normalizedAqi = 100 - (city.aqi / maxAqi) * 100;
      const normalizedChargesheetting = (city.chargesheettingRate / maxChargesheettingRate) * 100;
      const normalizedCleanliness = (city.cleanliness / maxCleanliness) * 100;
      const normalizedTraffic = 100 - (city.traffic / maxTraffic) * 100;

      city.compositeScore = (
        normalizedAqi * 0.25 +
        normalizedChargesheetting * 0.25 +
        normalizedCleanliness * 0.25 +
        normalizedTraffic * 0.25
      );

      city.normalized = {
        aqi: normalizedAqi,
        chargesheetting: normalizedChargesheetting,
        cleanliness: normalizedCleanliness,
        traffic: normalizedTraffic,
      };
    });

    cities.sort((a, b) => b.compositeScore - a.compositeScore);
    cities.forEach((city, index) => {
      city.rank = index + 1;
    });

    const nationalAverages = {
      aqi: cities.reduce((sum, c) => sum + c.aqi, 0) / cities.length,
      chargesheettingRate: cities.reduce((sum, c) => sum + c.chargesheettingRate, 0) / cities.length,
      cleanliness: cities.reduce((sum, c) => sum + c.cleanliness, 0) / cities.length,
      traffic: cities.reduce((sum, c) => sum + c.traffic, 0) / cities.length,
      compositeScore: cities.reduce((sum, c) => sum + c.compositeScore, 0) / cities.length,
    };

    console.log(`✓ Loaded and processed ${cities.length} cities`);
    return { cities, nationalAverages };
  } catch (error) {
    console.error('Error loading data:', error);
    throw error;
  }
}

module.exports = { loadAndProcessData };
