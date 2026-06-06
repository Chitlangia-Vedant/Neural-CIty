import sys
import os
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Bulletproof path setup
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(parent_dir)

from config import TARGET_CITIES

# Hardcoded Coordinates for bulletproof radius searching 
CITY_COORDS = {
    "Ahmedabad": ("23.0225", "72.5714"),
    "Bengaluru": ("12.9716", "77.5946"),
    "Chennai": ("13.0827", "80.2707"),
    "Coimbatore": ("11.0168", "76.9558"),
    "Delhi": ("28.6139", "77.2090"),
    "Ghaziabad": ("28.6692", "77.4538"),
    "Hyderabad": ("17.3850", "78.4867"),
    "Indore": ("22.7196", "75.8577"),
    "Jaipur": ("26.9124", "75.7873"),
    "Kanpur": ("26.4499", "80.3319"),
    "Kochi": ("9.9312", "76.2673"),
    "Kolkata": ("22.5726", "88.3639"),
    "Kozhikode": ("11.2588", "75.7804"),
    "Lucknow": ("26.8467", "80.9462"),
    "Mumbai": ("19.0760", "72.8777"),
    "Nagpur": ("21.1458", "79.0882"),
    "Patna": ("25.5941", "85.1376"),
    "Pune": ("18.5204", "73.8567"),
    "Surat": ("21.1702", "72.8311")
}

# Continuous NAQI Breakpoints (Added NH3 and Pb, closed boundary gaps)
NAQI_BREAKPOINTS = {
    'pm25': [(0, 30, 0, 50), (30, 60, 51, 100), (60, 90, 101, 200), (90, 120, 201, 300), (120, 250, 301, 400), (250, 1000, 401, 500)],
    'pm10': [(0, 50, 0, 50), (50, 100, 51, 100), (100, 250, 101, 200), (250, 350, 201, 300), (350, 430, 301, 400), (430, 2000, 401, 500)],
    'no2':  [(0, 40, 0, 50), (40, 80, 51, 100), (80, 180, 101, 200), (180, 280, 201, 300), (280, 400, 301, 400), (400, 1000, 401, 500)],
    'so2':  [(0, 40, 0, 50), (40, 80, 51, 100), (80, 380, 101, 200), (380, 800, 201, 300), (800, 1600, 301, 400), (1600, 3000, 401, 500)],
    'co':   [(0, 1.0, 0, 50), (1.0, 2.0, 51, 100), (2.0, 10.0, 101, 200), (10.0, 17.0, 201, 300), (17.0, 34.0, 301, 400), (34.0, 100.0, 401, 500)],
    'o3':   [(0, 50, 0, 50), (50, 100, 51, 100), (100, 168, 101, 200), (168, 208, 201, 300), (208, 748, 301, 400), (748, 2000, 401, 500)],
    'nh3':  [(0, 400, 0, 50), (400, 800, 51, 100), (800, 1200, 101, 200), (1200, 1800, 201, 300), (1800, 2800, 301, 400), (2800, 4000, 401, 500)],
    'pb':   [(0, 0.5, 0, 50), (0.5, 1.0, 51, 100), (1.0, 2.0, 101, 200), (2.0, 3.0, 201, 300), (3.0, 3.5, 301, 400), (3.5, 4.0, 401, 500)]
}

def normalize_concentration(value, unit, param):
    """Converts volume fractions (ppm/ppb) to mass concentrations based on standard MW at 25C."""
    if value is None or value < 0:
        return None
        
    unit = unit.lower().strip()
    param = param.lower().strip()
    
    # Molecular weights for conversion
    mw = {'no2': 46.01, 'so2': 64.07, 'o3': 48.00, 'nh3': 17.03, 'co': 28.01, 'pb': 207.2}
    
    if unit in ['µg/m³', 'ug/m3', 'µg/m3', 'micrograms/m3']: unit = 'ug/m3'
    elif unit in ['mg/m³', 'mg/m3', 'milligrams/m3']: unit = 'mg/m3'

    if param in ['pm25', 'pm10', 'pb']:
        if unit == 'ug/m3': return value
        return None

    if param == 'co':
        if unit == 'mg/m3': return value
        if unit == 'ug/m3': return value / 1000.0
        if unit == 'ppm': return value * (28.01 / 24.45)
        if unit == 'ppb': return (value / 1000.0) * (28.01 / 24.45)
        return None

    if param in mw:
        if unit == 'ug/m3': return value
        if unit == 'mg/m3': return value * 1000.0
        if unit == 'ppb': return value * (mw[param] / 24.45)
        if unit == 'ppm': return value * 1000.0 * (mw[param] / 24.45)
        return None

    return None

def calculate_sub_index(concentration, param):
    if param not in NAQI_BREAKPOINTS or concentration is None or concentration < 0:
        return None
        
    breakpoints = NAQI_BREAKPOINTS[param]
    
    if concentration >= breakpoints[-1][1]:
        return 500
        
    for B_LO, B_HI, I_LO, I_HI in breakpoints:
        if B_LO <= concentration <= B_HI:
            return round(((I_HI - I_LO) / (B_HI - B_LO)) * (concentration - B_LO) + I_LO)
            
    return None

def fetch_aqi_data():
    API_KEY = os.getenv("OPENAQ_API_KEY")
    headers = {"X-API-Key": API_KEY} if API_KEY else {}
    
    session = requests.Session()
    retries = Retry(total=5, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
    session.mount("https://", HTTPAdapter(max_retries=retries))
    
    final_records = []
    print("Fetching and calculating true CPCB AQI using OpenAQ v3...\n")
    
    for city in TARGET_CITIES:
        if city not in CITY_COORDS: continue
        lat, lon = CITY_COORDS[city]
        
        loc_params = {
            "coordinates": f"{lat},{lon}",
            "radius": 25000,
            "limit": 50 
        }
        
        try:
            loc_resp = session.get("https://api.openaq.org/v3/locations", params=loc_params, headers=headers, timeout=30)
            if loc_resp.status_code != 200:
                print(f"Failed to fetch locations for {city} (HTTP {loc_resp.status_code})")
                continue
                
            locations = loc_resp.json().get('results', [])
            if not locations:
                continue
                
            city_station_aqis = []
            
            for loc in locations:
                loc_id = loc.get('id')
                loc_name = loc.get('name', 'Unknown Station')
                
                # --- STEP 1: Build the sensorsId mapping ---
                sensor_map = {}
                loc_sensors = loc.get('sensors', [])
                
                # Fallback if locations payload doesn't include sensors inline
                if not loc_sensors:
                    sensors_url = f"https://api.openaq.org/v3/locations/{loc_id}/sensors"
                    sensors_resp = session.get(sensors_url, headers=headers, timeout=30)
                    if sensors_resp.status_code == 200:
                        loc_sensors = sensors_resp.json().get('results', [])
                        
                for s in loc_sensors:
                    s_id = s.get('id')
                    param_info = s.get('parameter', {})
                    if s_id and isinstance(param_info, dict):
                        sensor_map[s_id] = {
                            'param_name': param_info.get('name', '').lower(),
                            'unit': param_info.get('units', '')
                        }
                
                if not sensor_map:
                    continue
                
                # --- STEP 2: Fetch /latest and map using sensorsId ---
                latest_url = f"https://api.openaq.org/v3/locations/{loc_id}/latest"
                latest_resp = session.get(latest_url, headers=headers, timeout=30)
                
                if latest_resp.status_code == 200:
                    measurements = latest_resp.json().get('results', [])
                    station_sub_indices = {}
                    station_raw_concs = {}
                    latest_timestamp = None
                    
                    for m in measurements:
                        s_id = m.get('sensorsId')
                        
                        # Only process if we successfully mapped this sensor
                        if s_id not in sensor_map:
                            continue
                            
                        param_name = sensor_map[s_id]['param_name']
                        unit = sensor_map[s_id]['unit']
                        raw_val = m.get('value')
                        
                        # Correct v3 /latest datetime path
                        dt_obj = m.get('datetime', {}).get('utc')
                        if dt_obj and not latest_timestamp:
                            latest_timestamp = dt_obj
                            
                        norm_val = normalize_concentration(raw_val, unit, param_name)
                        sub_idx = calculate_sub_index(norm_val, param_name)
                        
                        if sub_idx is not None:
                            station_sub_indices[param_name] = sub_idx
                            station_raw_concs[param_name] = round(norm_val, 2)
                    
                    if station_sub_indices:
                        station_aqi = max(station_sub_indices.values())
                        prom_pol = max(station_sub_indices, key=station_sub_indices.get)
                        
                        city_station_aqis.append({
                            "Station_Name": loc_name,
                            "Station_AQI": station_aqi,
                            "Prominent_Pollutant": prom_pol.upper(),
                            "Timestamp_UTC": latest_timestamp,
                            "Raw_Concs": station_raw_concs
                        })
            
            # --- STEP 3: Aggregate worst station to represent the city ---
            if city_station_aqis:
                worst_station = max(city_station_aqis, key=lambda x: x['Station_AQI'])
                concs = worst_station['Raw_Concs']
                
                ts = worst_station['Timestamp_UTC']
                date_str = ts.split("T")[0] if ts else datetime.now().strftime("%Y-%m-%d")
                
                record = {
                    "City": city,
                    "Date": date_str,
                    "Overall_AQI": worst_station['Station_AQI'],
                    "Prominent_Pollutant": worst_station['Prominent_Pollutant'],
                    "PM2.5_Conc": concs.get('pm25'),
                    "PM10_Conc": concs.get('pm10'),
                    "NO2_Conc": concs.get('no2'),
                    "SO2_Conc": concs.get('so2'),
                    "CO_Conc": concs.get('co'),
                    "O3_Conc": concs.get('o3'),
                    "NH3_Conc": concs.get('nh3'),
                    "Pb_Conc": concs.get('pb')
                }
                final_records.append(record)
                print(f" - {city}: AQI = {record['Overall_AQI']}")
            else:
                print(f" - {city}: Data unavailable or invalid.")
                
        except requests.exceptions.RequestException as e:
            print(f"Network error processing {city}: {e}")
            
    if final_records:
        df_aqi = pd.DataFrame(final_records)
        
        output_folder = os.path.join(parent_dir, 'Clean Dataset')
        os.makedirs(output_folder, exist_ok=True)
        
        output_file = os.path.join(output_folder, 'AQI.csv')
        df_aqi.to_csv(output_file, index=False)
        print(f"\nSuccess! Daily AQI data calculated and saved to {output_file}")

if __name__ == "__main__":
    fetch_aqi_data()