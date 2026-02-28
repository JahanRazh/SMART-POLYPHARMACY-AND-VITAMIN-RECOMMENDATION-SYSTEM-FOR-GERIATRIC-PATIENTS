import pandas as pd
import numpy as np
from collections import defaultdict
import pickle
import os

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Go up two levels to project root, then into Data folder
DATA_FILE = os.path.join(SCRIPT_DIR, "..","..", "Data", "Drug_interaction.csv")
DATA_FILE = os.path.normpath(DATA_FILE)  # Normalize the path

def train_drug_interaction_model():
    """
    Build a comprehensive drug interaction knowledge base from real data.
    Creates efficient lookup structures for 100% accurate retrieval of known interactions.
    """
    print("Loading drug interaction data...")
    df = pd.read_csv(DATA_FILE, encoding='utf-8-sig')
    
    # Clean the data
    df = df.dropna(subset=['Drug_A', 'Drug_B', 'SeverityLevel'])
    df['Drug_A'] = df['Drug_A'].str.strip().str.lower()
    df['Drug_B'] = df['Drug_B'].str.strip().str.lower()
    df['SeverityLevel'] = df['SeverityLevel'].str.strip().str.capitalize()
    
    # Clean interaction descriptions and IDs
    if 'Interaction Description' in df.columns:
        df['Interaction Description'] = df['Interaction Description'].fillna('').str.strip()
    # Ensure IDs exist even if columns are missing
    df['DDInterID_A'] = df.get('DDInterID_A', '').fillna('').astype(str).str.strip()
    df['DDInterID_B'] = df.get('DDInterID_B', '').fillna('').astype(str).str.strip()
    
    print(f"Loaded {len(df)} drug interaction records")
    
    # Build interaction lookup dictionary
    # Key: tuple of sorted drug names, Value: interaction details
    interaction_db = {}
    
    # Build drug-to-interactions index for faster lookup
    drug_interactions = defaultdict(set)
    
    # Track severity levels
    severity_levels = set()
    
    for _, row in df.iterrows():
        drug_a = row['Drug_A']
        drug_b = row['Drug_B']
        severity = row['SeverityLevel']
        description = row.get('Interaction Description', '')
        id_a = row.get('DDInterID_A', '')
        id_b = row.get('DDInterID_B', '')
        
        # Create normalized drug pair (sorted to handle A-B same as B-A)
        drug_pair = tuple(sorted([drug_a, drug_b]))
        
        severity_levels.add(severity)
        
        # Store interaction details
        if drug_pair not in interaction_db:
            interaction_db[drug_pair] = {
                'severity': severity,
                'description': description,
                'drug_a': drug_a,
                'drug_b': drug_b,
                'ddinterIdA': id_a,
                'ddinterIdB': id_b
            }
        else:
            # If duplicate pair exists, keep the higher severity
            existing_severity = interaction_db[drug_pair]['severity']
            if severity == 'Major' or (severity == 'Moderate' and existing_severity == 'Minor'):
                interaction_db[drug_pair] = {
                    'severity': severity,
                    'description': description,
                    'drug_a': drug_a,
                    'drug_b': drug_b,
                    'ddinterIdA': id_a,
                    'ddinterIdB': id_b
                }
        
        # Index both drugs
        drug_interactions[drug_a].add(drug_b)
        drug_interactions[drug_b].add(drug_a)
    
    # Get all unique drugs
    all_drugs = set(drug_interactions.keys())
    print(f"Found {len(all_drugs)} unique drugs")
    print(f"Total unique drug pairs with interactions: {len(interaction_db)}")
    
    # Calculate statistics
    severity_counts = defaultdict(int)
    for interaction in interaction_db.values():
        severity_counts[interaction['severity']] += 1
    
    print("\nInteraction Severity Distribution:")
    for severity, count in sorted(severity_counts.items()):
        print(f"  {severity}: {count} ({count/len(interaction_db)*100:.1f}%)")
    
    # Create sorted drug list for autocomplete/search
    drug_list = sorted(list(all_drugs))
    
    # Build drug name variations for fuzzy matching (optional)
    drug_name_map = {}
    for drug in all_drugs:
        # Store lowercase version
        drug_name_map[drug] = drug
        # Store version without spaces
        drug_name_map[drug.replace(' ', '')] = drug
        # Store version without hyphens
        drug_name_map[drug.replace('-', '')] = drug
    
    # Save all data structures
    model_dir = os.path.join(SCRIPT_DIR,"..", "drug_interaction_ml")
    os.makedirs(model_dir, exist_ok=True)
    
    print(f"\nSaving interaction database to {model_dir}...")
    
    # Save main interaction database
    with open(os.path.join(model_dir, "interaction_db.pkl"), 'wb') as f:
        pickle.dump(interaction_db, f)
    
    # Save drug interactions index
    with open(os.path.join(model_dir, "drug_interactions_index.pkl"), 'wb') as f:
        pickle.dump(dict(drug_interactions), f)
    
    # Save drug list
    with open(os.path.join(model_dir, "drug_list.pkl"), 'wb') as f:
        pickle.dump(drug_list, f)
    
    # Save drug name mapping for fuzzy matching
    with open(os.path.join(model_dir, "drug_name_map.pkl"), 'wb') as f:
        pickle.dump(drug_name_map, f)
    
    # Save severity levels
    with open(os.path.join(model_dir, "severity_levels.pkl"), 'wb') as f:
        pickle.dump(sorted(list(severity_levels)), f)
    
    # Create metadata file
    metadata = {
        'total_drugs': len(all_drugs),
        'total_interactions': len(interaction_db),
        'severity_distribution': dict(severity_counts),
        'data_source': 'Drug_interaction.csv',
        'model_type': 'Knowledge Base Lookup',
        'accuracy': '100% for known interactions'
    }
    
    with open(os.path.join(model_dir, "metadata.pkl"), 'wb') as f:
        pickle.dump(metadata, f)
    
    print("\n✓ Interaction database saved successfully!")
    print(f"✓ Total drugs: {len(all_drugs)}")
    print(f"✓ Total interactions: {len(interaction_db)}")
    print(f"✓ Accuracy: 100% for known drug pairs")
    print(f"\nFiles saved:")
    print(f"  - interaction_db.pkl (main database)")
    print(f"  - drug_interactions_index.pkl (fast lookup)")
    print(f"  - drug_list.pkl (drug names)")
    print(f"  - drug_name_map.pkl (fuzzy matching)")
    print(f"  - severity_levels.pkl (severity categories)")
    print(f"  - metadata.pkl (statistics)")
    
    return interaction_db, drug_interactions, drug_list, drug_name_map

if __name__ == "__main__":
    train_drug_interaction_model()