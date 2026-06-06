import os
import requests
from pprint import pprint
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENAQ_API_KEY")

headers = {
    "X-API-Key": API_KEY,
    "User-Agent": "AQI-Test/1.0"
}

LAT = 22.7196   # Indore
LON = 75.8577
RADIUS = 25000

session = requests.Session()

print("=" * 80)
print("STEP 1: FETCH LOCATIONS")
print("=" * 80)

locations_url = "https://api.openaq.org/v3/locations"

params = {
    "coordinates": f"{LAT},{LON}",
    "radius": RADIUS,
    "limit": 5
}

response = session.get(
    locations_url,
    headers=headers,
    params=params,
    timeout=30
)

print("Status Code:", response.status_code)

response.raise_for_status()

payload = response.json()

print("\nTop-level keys:")
print(payload.keys())

locations = payload.get("results", [])

print(f"\nLocations Found: {len(locations)}")

if not locations:
    print("No locations returned.")
    raise SystemExit()

print("\nFirst Location:")
pprint(locations[0])

print("\nChecking expected fields:")

for field in ["id", "name"]:
    print(f"{field}:",
          "✓" if field in locations[0] else "✗")

location_id = locations[0].get("id")

print(f"\nUsing location_id = {location_id}")

print("\n" + "=" * 80)
print("STEP 2: FETCH LATEST MEASUREMENTS")
print("=" * 80)

latest_url = (
    f"https://api.openaq.org/v3/locations/"
    f"{location_id}/latest"
)

latest_response = session.get(
    latest_url,
    headers=headers,
    timeout=30
)

print("Status Code:", latest_response.status_code)

latest_response.raise_for_status()

latest_payload = latest_response.json()

print("\nTop-level keys:")
print(latest_payload.keys())

measurements = latest_payload.get("results", [])

print(f"\nMeasurements Found: {len(measurements)}")

if not measurements:
    print("No measurements returned.")
    raise SystemExit()

print("\nFirst Measurement:")
pprint(measurements[0])

measurement = measurements[0]

print("\nChecking expected fields:")

checks = {
    "value": measurement.get("value"),
    "parameter": measurement.get("parameter")
}

for key, value in checks.items():
    print(
        f"{key}:",
        "✓" if value is not None else "✗"
    )

if isinstance(measurement.get("parameter"), dict):

    parameter = measurement["parameter"]

    print("\nParameter Object:")
    pprint(parameter)

    print(
        "\nparameter.name:",
        parameter.get("name")
    )

    print(
        "parameter.units:",
        parameter.get("units")
    )

print("\n" + "=" * 80)
print("TEST COMPLETE")
print("=" * 80)