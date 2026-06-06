import pandas as pd
import sys
import os

# Assuming you are running this from your scripts folder
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(parent_dir)

from config import TARGET_CITIES

def merge_swachh_survekshan_data(clean_cities_path, ss_path, output_path):
    print("Loading datasets...")
    try:
        df_clean = pd.read_csv(clean_cities_path)
        df_ss = pd.read_csv(ss_path)
    except FileNotFoundError as e:
        print(f"Error loading files: {e}")
        return

    # 1. Standardize the 'ULB Name' in the SS dataset to match our exact Target Cities
    def get_standard_city(city_name):
        if pd.isna(city_name):
            return None
        for target in TARGET_CITIES:
            # \b ensures exact word boundary match
            if pd.Series(city_name).str.contains(f"\\b{target}\\b", case=False).iloc[0]:
                return target
        return None
        
    df_ss['City'] = df_ss['ULB Name'].apply(get_standard_city)
    df_ss = df_ss.dropna(subset=['City'])
    
    # 2. Handle duplicate zones in the SS dataset (e.g., Jaipur Heritage vs Jaipur Greater)
    # We sort by SS2024 score descending and keep the highest scoring zone
    if 'SS2024(10000)' in df_ss.columns:
        df_ss = df_ss.sort_values(by='SS2024(10000)', ascending=False)
    df_ss = df_ss.drop_duplicates(subset='City', keep='first')

    # 3. Merge the datasets
    # We use 'outer' to ensure we don't lose cities that exist in only one dataset
    df_merged = pd.merge(df_ss, df_clean, on='City', how='outer')

    # 4. Guarantee all 19 TARGET_CITIES are in the final CSV (Even Kolkata)
    df_targets = pd.DataFrame({'City': TARGET_CITIES})
    df_final = pd.merge(df_targets, df_merged, on='City', how='left')

    # 5. Select and order the exact columns requested
    ordered_cols = [
        'City',
        'SS2024(10000)',
        'SS2025(2500)',
        '2023_Score_Max10000',
        '2022_Score_Max7500',
        '2020_Score_Max6000',
        '2019_Score_5000',
        '2018_Score',
        '2017_Score',
        '2016_Score'
    ]
    
    # Safety check: ensure columns exist even if one of the CSVs was empty
    for col in ordered_cols:
        if col not in df_final.columns:
            df_final[col] = None

    df_final = df_final[ordered_cols]

    # 6. Save the final merged CSV
    df_final.to_csv(output_path, index=False)
    print(f"\nSuccess! Merged dataset saved to: {output_path}")
    print(f"Total rows: {len(df_final)} (Should be exactly 19)")

if __name__ == "__main__":
    # --- BULLETPROOF PATHS ---
    input_clean_cities = os.path.join(parent_dir, 'Clean Dataset', 'cleanest_cities.csv')
    input_ss = os.path.join(parent_dir, 'Clean Dataset', 'swachh_survekshan.csv')
    
    output_folder = os.path.join(parent_dir, 'Clean Dataset')
    os.makedirs(output_folder, exist_ok=True)
    
    output_merged = os.path.join(output_folder, 'merged_cleanliness_data.csv')
    
    merge_swachh_survekshan_data(input_clean_cities, input_ss, output_merged)