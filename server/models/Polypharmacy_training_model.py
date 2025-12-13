# training_model.py
# train and save polypharmacy_risk_model.pkl
# Now uses real drug interaction logic from Drug_interaction.csv to generate accurate severity summaries

import pandas as pd
import numpy as np
import os
import csv
from typing import List, Dict, Tuple
from functools import lru_cache
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib

# ----------------------------- CONFIG -----------------------------
DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "Data", "Drug_interaction.csv")
# ------------------------------------------------------------------

# Exact copies of your original sub-score functions
def calculate_s1_score(drug_count: int) -> float:
    if drug_count < 5:
        return 0.0
    elif drug_count <= 7:
        return 0.7
    elif drug_count <= 10:
        return 1.0
    else:
        return 1.0 + (drug_count - 10) * 0.1

def calculate_s2_score(age: int) -> float:
    if age < 65:
        return 0.0
    elif age < 75:
        return 0.5
    elif age < 85:
        return 0.7
    else:
        return 1.0

def calculate_s3_score(severity_summary: dict) -> float:
    major = severity_summary.get('Major', 0) + severity_summary.get('major', 0)
    moderate = severity_summary.get('Moderate', 0) + severity_summary.get('moderate', 0)
    minor = severity_summary.get('Minor', 0) + severity_summary.get('minor', 0)
    return (1.0 * major) + (0.6 * moderate) + (0.3 * minor)

def calculate_s4_score(liver_function: str) -> float:
    lf = liver_function.lower().strip()
    if "severe" in lf or ">150" in lf or "above 150" in lf:
        return 1.0
    elif "moderate" in lf or ("80" in lf and "150" in lf):
        return 0.6
    elif "mild" in lf or ("40" in lf and "80" in lf):
        return 0.3
    return 0.0

def calculate_s5_score(kidney_function: str) -> float:
    kf = kidney_function.lower().strip()
    if "stage 5" in kf or "egfr <15" in kf or "below 15" in kf:
        return 1.0
    elif "stage 4" in kf or ("egfr 15" in kf and "29" in kf):
        return 0.9
    elif "stage 3b" in kf or ("egfr 30" in kf and "44" in kf):
        return 0.7
    elif "stage 3a" in kf or ("egfr 45" in kf and "59" in kf):
        return 0.5
    elif "stage 2" in kf or ("egfr 60" in kf and "89" in kf):
        return 0.3
    elif "stage 1" in kf or "egfr 90" in kf:
        return 0.0
    return 0.0

# Fixed weights
DRUG_WEIGHT = 25.0
AGE_WEIGHT = 25.0
DDI_WEIGHT = 30.0
LIVER_WEIGHT = 10.0
KIDNEY_WEIGHT = 10.0

# Frontend dropdown options
LIVER_OPTIONS = [
    "Normal (<40 IU/L)",
    "Mild risk (40-80 IU/L)",
    "Moderate risk (80-150 IU/L)",
    "Severe risk (>150 IU/L)"
]
KIDNEY_OPTIONS = [
    "Stage 1: eGFR of 90",
    "Stage 2: eGFR of 60-89",
    "Stage 3a: eGFR of 45-59",
    "Stage 3b: eGFR of 30-44",
    "Stage 4: eGFR of 15-29",
    "Stage 5: eGFR below 15"
]

# --------------------- DRUG INTERACTION LOADING ---------------------
def _normalize_drug_name(value: str) -> str:
    return value.strip().lower()

@lru_cache(maxsize=1)
def _load_interaction_map() -> Dict[Tuple[str, str], List[Dict]]:
    interaction_map: Dict[Tuple[str, str], List[Dict]] = {}
    drug_name_set = set()

    if not os.path.exists(DATA_FILE):
        raise FileNotFoundError(f"Drug interaction dataset not found at {DATA_FILE}")

    with open(DATA_FILE, encoding="utf-8-sig") as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            drug_a = row.get("Drug_A", "").strip()
            drug_b = row.get("Drug_B", "").strip()
            if not drug_a or not drug_b:
                continue
            normalized_key = tuple(sorted((_normalize_drug_name(drug_a), _normalize_drug_name(drug_b))))
            severity = (row.get("SeverityLevel") or "Unknown").strip().capitalize()
            interaction = {
                "drugA": drug_a,
                "drugB": drug_b,
                "ddinterIdA": row.get("DDInterID_A"),
                "ddinterIdB": row.get("DDInterID_B"),
                "severity": severity or "Unknown",
            }
            interaction_map.setdefault(normalized_key, []).append(interaction)
            drug_name_set.add(drug_a)
            drug_name_set.add(drug_b)

    # Build drug name index for fast lookup
    global _DRUG_NAME_INDEX
    _DRUG_NAME_INDEX = [
        {"label": name, "normalized": _normalize_drug_name(name)}
        for name in sorted(drug_name_set)
        if name
    ]
    return interaction_map

_DRUG_NAME_INDEX: List[Dict[str, str]] = []

def find_drug_interactions(drugs: List[str]) -> Tuple[List[Dict], Dict[str, int]]:
    interaction_map = _load_interaction_map()
    interactions: List[Dict] = []
    severity_summary: Dict[str, int] = {"Minor": 0, "Moderate": 0, "Major": 0, "Unknown": 0}

    cleaned_drugs = []
    seen = set()
    for drug in drugs:
        if not isinstance(drug, str):
            continue
        cleaned = drug.strip()
        if not cleaned:
            continue
        normalized = _normalize_drug_name(cleaned)
        if normalized in seen:
            continue
        seen.add(normalized)
        cleaned_drugs.append({"label": cleaned, "normalized": normalized})

    for i in range(len(cleaned_drugs)):
        for j in range(i + 1, len(cleaned_drugs)):
            key = tuple(sorted((cleaned_drugs[i]["normalized"], cleaned_drugs[j]["normalized"])))
            rows = interaction_map.get(key, [])
            for row in rows:
                severity = row.get("severity", "Unknown")
                interactions.append(row)
                severity_summary[severity] = severity_summary.get(severity, 0) + 1

    # Remove Unknown if you prefer only Minor/Moderate/Major
    severity_summary.pop("Unknown", None)
    for k in ["Minor", "Moderate", "Major"]:
        severity_summary.setdefault(k, 0)

    return interactions, severity_summary
# ------------------------------------------------------------------

# --------------------- SYNTHETIC DATA GENERATION ---------------------
np.random.seed(42)
NUM_SAMPLES = 100_00

# Load all available drug names from the CSV
_load_interaction_map()  # Ensures _DRUG_NAME_INDEX is populated
all_drugs = [entry["label"] for entry in _DRUG_NAME_INDEX]

if len(all_drugs) == 0:
    raise ValueError("No drugs found in Drug_interaction.csv – check file path and content.")

print(f"Loaded {len(all_drugs)} unique drugs from CSV.")

# Generate synthetic patient records
records = []
for _ in range(NUM_SAMPLES):
    # Random number of drugs (2 to 20)
    drug_count = np.random.randint(2, 21)
    patient_drugs = np.random.choice(all_drugs, size=drug_count, replace=False).tolist()

    age = np.random.randint(18, 121)
    liver_function = np.random.choice(LIVER_OPTIONS)
    kidney_function = np.random.choice(KIDNEY_OPTIONS)

    # Compute real interactions and severity counts using your actual logic
    _, severity_summary = find_drug_interactions(patient_drugs)

    records.append({
        'drugs': patient_drugs,
        'drug_count': drug_count,
        'age': age,
        'major_count': severity_summary.get('Major', 0),
        'moderate_count': severity_summary.get('Moderate', 0),
        'minor_count': severity_summary.get('Minor', 0),
        'liver_function': liver_function,
        'kidney_function': kidney_function
    })

df = pd.DataFrame(records)

# Compute sub-scores and final risk score using exact rule-based logic
df['s1'] = df['drug_count'].apply(calculate_s1_score)
df['s2'] = df['age'].apply(calculate_s2_score)
df['s3'] = df.apply(lambda r: calculate_s3_score({
    'Major': r['major_count'],
    'Moderate': r['moderate_count'],
    'Minor': r['minor_count']
}), axis=1)
df['s4'] = df['liver_function'].apply(calculate_s4_score)
df['s5'] = df['kidney_function'].apply(calculate_s5_score)

df['risk_score'] = (
    DRUG_WEIGHT * df['s1'] +
    AGE_WEIGHT * df['s2'] +
    DDI_WEIGHT * df['s3'] +
    LIVER_WEIGHT * df['s4'] +
    KIDNEY_WEIGHT * df['s5']
)

# Features for ML model (same as before)
X = df[['drug_count', 'age', 'major_count', 'moderate_count', 'minor_count',
        'liver_function', 'kidney_function']]
y = df['risk_score']

# Preprocessing pipeline
preprocessor = ColumnTransformer(
    transformers=[
        ('cat', OneHotEncoder(handle_unknown='ignore'), ['liver_function', 'kidney_function']),
        ('num', 'passthrough', ['drug_count', 'age', 'major_count', 'moderate_count', 'minor_count'])
    ]
)

# Model
model = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('regressor', RandomForestRegressor(n_estimators=200, random_state=42))
])

print("Training model on 100,00 synthetic samples with real interaction data...")
model.fit(X, y)

# Save model
joblib.dump(model, 'polypharmacy_risk_train_model.pkl')
print("ML model trained and saved as polypharmacy_risk_train_model.pkl")