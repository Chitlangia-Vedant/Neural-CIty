import pandas as pd
from ckanapi import RemoteCKAN
import sys
import os

parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(parent_dir)

from config import TARGET_CITIES

def fetch_swachh_survekshan():
    rc = RemoteCKAN("https://data.opencity.in/")
    
    resource_ids = [
        "0e6e43e6-439d-4b07-b304-b718624c2abc",
        "fc57bb8b-8f53-48af-a909-4d5cfe461b46"
    ]
    
    all_records = []
    print("Fetching Swachh Survekshan data via CKAN API...")
    
    for resource_id in resource_ids:
        print(f"\n--- Querying Resource: {resource_id} ---")
        
        for city in TARGET_CITIES:
            try:
                result = rc.action.datastore_search(
                    resource_id=resource_id,
                    q=city,
                    limit=100
                )
                
                records = result.get("records", [])
                all_records.extend(records)
                
                if records:
                    print(f" - Fetched {len(records)} records for {city}")
                
            except Exception as e:
                print(f"Error fetching Swachh data for {city} in resource {resource_id}: {e}")
                
    if all_records:
        df_ss = pd.DataFrame(all_records)
        
        if '_id' in df_ss.columns:
            df_ss = df_ss.drop(columns=['_id'])
            
        df_ss = df_ss.drop_duplicates()
        
        # --- BULLETPROOF PATHS ADDED HERE ---
        output_folder = os.path.join(parent_dir, 'Clean Dataset')
        os.makedirs(output_folder, exist_ok=True)
        
        output_path = os.path.join(output_folder, 'swachh_survekshan.csv')
        df_ss.to_csv(output_path, index=False)
        
        print(f"\nSuccess! Combined Swachh Survekshan data saved to {output_path}")
        print(f"Total unique records saved: {len(df_ss)}")
    else:
        print("No Swachh Survekshan data was fetched.")

if __name__ == "__main__":
    fetch_swachh_survekshan()