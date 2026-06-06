import pandas as pd
import sys
import os

parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(parent_dir)

from config import TARGET_CITIES

def clean_traffic_data(input_path, output_path):
    df_traffic = pd.read_csv(input_path)
    
    city_mapping = {city.upper(): city for city in TARGET_CITIES}
    city_mapping["DELHI (CITY)"] = "Delhi"
    
    df_filtered = df_traffic[df_traffic['City'].isin(city_mapping.keys())].copy()
    df_filtered['City'] = df_filtered['City'].map(city_mapping)
    
    df_filtered.to_csv(output_path, index=False)
    print(f"Traffic data cleaned and saved to {output_path}")

if __name__ == "__main__":
    # --- BULLETPROOF PATHS ADDED HERE ---
    input_path = os.path.join(parent_dir, 'Datasets', 'traffic_accidents_india_2024.csv')
    
    output_folder = os.path.join(parent_dir, 'Clean Dataset')
    os.makedirs(output_folder, exist_ok=True)
    
    output_path = os.path.join(output_folder, 'traffic_accidents.csv')
    
    clean_traffic_data(input_path, output_path)