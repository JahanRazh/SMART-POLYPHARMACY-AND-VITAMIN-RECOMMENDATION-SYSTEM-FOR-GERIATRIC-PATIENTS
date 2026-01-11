import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
import pickle
import os

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Go up one level to server directory, then into Data folder
DATA_FILE = os.path.join(SCRIPT_DIR, "..", "Data", "Drug_interaction.csv")
DATA_FILE = os.path.normpath(DATA_FILE)  # Normalize the path

def train_drug_interaction_model():
    """
    Train a machine learning model to predict drug interactions and severity.
    Saves the trained model and encoders for later use.
    """
    print("Loading drug interaction data...")
    df = pd.read_csv(DATA_FILE, encoding='utf-8-sig')
    
    # Clean the data
    df = df.dropna(subset=['Drug_A', 'Drug_B', 'SeverityLevel'])
    df['Drug_A'] = df['Drug_A'].str.strip().str.lower()
    df['Drug_B'] = df['Drug_B'].str.strip().str.lower()
    df['SeverityLevel'] = df['SeverityLevel'].str.strip().str.capitalize()
    
    print(f"Loaded {len(df)} drug interaction records")
    
    # Create sorted drug pairs (so A-B is same as B-A)
    df['drug_pair'] = df.apply(
        lambda row: tuple(sorted([row['Drug_A'], row['Drug_B']])), 
        axis=1
    )
    
    # Get unique drug names for encoding
    all_drugs = set(df['Drug_A'].unique()) | set(df['Drug_B'].unique())
    print(f"Found {len(all_drugs)} unique drugs")
    
    # Create label encoders
    drug_encoder = LabelEncoder()
    drug_encoder.fit(list(all_drugs))
    
    severity_encoder = LabelEncoder()
    severity_encoder.fit(df['SeverityLevel'].unique())
    
    # Prepare features and labels
    X = []
    y = []
    
    for _, row in df.iterrows():
        drug_a_encoded = drug_encoder.transform([row['Drug_A']])[0]
        drug_b_encoded = drug_encoder.transform([row['Drug_B']])[0]
        severity_encoded = severity_encoder.transform([row['SeverityLevel']])[0]
        
        # Create feature vector: [drug_a_id, drug_b_id, min_id, max_id, interaction_exists]
        min_id = min(drug_a_encoded, drug_b_encoded)
        max_id = max(drug_a_encoded, drug_b_encoded)
        
        X.append([drug_a_encoded, drug_b_encoded, min_id, max_id, 1])
        y.append(severity_encoded)
    
    X = np.array(X)
    y = np.array(y)
    
    print(f"Prepared {len(X)} training samples")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Train Random Forest model
    print("Training Random Forest model...")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=20,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)
    
    # Evaluate
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    print(f"Training accuracy: {train_score:.4f}")
    print(f"Testing accuracy: {test_score:.4f}")
    
    # Save model and encoders
    model_dir = os.path.join("models", "drug_interaction_ml")
    os.makedirs(model_dir, exist_ok=True)
    
    with open(os.path.join(model_dir, "interaction_model.pkl"), 'wb') as f:
        pickle.dump(model, f)
    
    with open(os.path.join(model_dir, "drug_encoder.pkl"), 'wb') as f:
        pickle.dump(drug_encoder, f)
    
    with open(os.path.join(model_dir, "severity_encoder.pkl"), 'wb') as f:
        pickle.dump(severity_encoder, f)
    
    # Save drug list for search functionality
    drug_list = sorted(list(all_drugs))
    with open(os.path.join(model_dir, "drug_list.pkl"), 'wb') as f:
        pickle.dump(drug_list, f)
    
    print(f"\nModel and encoders saved to {model_dir}")
    print("\nModel training completed successfully!")
    
    return model, drug_encoder, severity_encoder, drug_list

if __name__ == "__main__":
    train_drug_interaction_model()