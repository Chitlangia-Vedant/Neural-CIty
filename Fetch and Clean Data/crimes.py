import pandas as pd
from ckanapi import RemoteCKAN
import sys
import os

parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(parent_dir)

from config import TARGET_CITIES

def fetch_crime_data():
    rc = RemoteCKAN("https://data.opencity.in/")
    resource_id = "d5b81375-7f97-4a66-bbcc-e7aadb89140e"
    
    all_records = []
    print("Fetching Crime data via CKAN API...")
    
    for city in TARGET_CITIES:
        try:
            result = rc.action.datastore_search(
                resource_id=resource_id,
                q=city,
                limit=100
            )
            
            records = result.get("records", [])
            all_records.extend(records)
            print(f" - Fetched {len(records)} records for {city}")
            
        except Exception as e:
            print(f"Error fetching crime data for {city}: {e}")
            
    if all_records:
        df_crime = pd.DataFrame(all_records)
        
        if '_id' in df_crime.columns:
            df_crime = df_crime.drop(columns=['_id'])
        df_crime = df_crime.drop_duplicates()
        
        # --- BULLETPROOF PATHS ADDED HERE ---
        output_folder = os.path.join(parent_dir, 'Clean Dataset')
        os.makedirs(output_folder, exist_ok=True)
        
        output_path = os.path.join(output_folder, 'crime.csv')
        df_crime.to_csv(output_path, index=False)
        print(f"\nSuccess! Crime data saved to {output_path}")
    else:
        print("No crime data was fetched.")

if __name__ == "__main__":
    fetch_crime_data()