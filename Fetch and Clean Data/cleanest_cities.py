import pandas as pd
import sys
import os

parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(parent_dir)

from config import TARGET_CITIES

def clean_kaggle_data(input_path, output_path):
    try:
        df_clean = pd.read_csv(input_path)
        
        # 1. Create regex pattern with word boundaries (\b) so 'Patna' doesn't match 'Visakhapatnam'
        pattern = '|'.join([f"\\b{city}\\b" for city in TARGET_CITIES])
        
        # 2. Filter using the correct column 'City Name' and allow partial matches (e.g., 'GREATER HYDERABAD')
        df_filtered = df_clean[df_clean['City Name'].str.contains(pattern, case=False, na=False)].copy()
        
        # 3. Create a clean, standard 'City' column for the dashboard to join on
        def get_standard_city(city_name):
            for target in TARGET_CITIES:
                if pd.Series(city_name).str.contains(f"\\b{target}\\b", case=False).iloc[0]:
                    return target
            return city_name
            
        df_filtered['City'] = df_filtered['City Name'].apply(get_standard_city)
        
        # 4. Handle duplicate zones (e.g., 4 Delhi rows) by keeping the zone with the highest 2023 score
        if '2023_Score_Max10000' in df_filtered.columns:
            df_filtered = df_filtered.sort_values(by='2023_Score_Max10000', ascending=False)
        df_filtered = df_filtered.drop_duplicates(subset='City', keep='first')
        
        # 5. Reorder columns so our clean 'City' column is the very first one
        cols = ['City'] + [col for col in df_filtered.columns if col != 'City']
        df_filtered = df_filtered[cols]
        
        df_filtered.to_csv(output_path, index=False)
        print(f"Cleanest cities data cleaned and saved to {output_path}")
        print(f"Total unique cities extracted: {len(df_filtered)}")
        
    except FileNotFoundError:
        print(f"Error: {input_path} not found. Please download from Kaggle first.")

if __name__ == "__main__":
    # --- BULLETPROOF PATHS ---
    input_path = os.path.join(parent_dir, 'Datasets', 'Cleanest_Cities_India.csv')
    
    output_folder = os.path.join(parent_dir, 'Clean Dataset')
    os.makedirs(output_folder, exist_ok=True)
    
    output_path = os.path.join(output_folder, 'cleanest_cities.csv')
    
    clean_kaggle_data(input_path, output_path)