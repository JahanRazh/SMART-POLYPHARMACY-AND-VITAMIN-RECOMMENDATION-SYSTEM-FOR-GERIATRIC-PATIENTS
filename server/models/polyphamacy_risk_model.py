# polyphamacy_risk_model.py
# Modified: Only ML model used for risk calculation

import csv
import os
from datetime import datetime
from functools import lru_cache
from typing import Dict, List, Tuple, Optional

import joblib
import pandas as pd

from db import get_db

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "Data", "Drug_interaction.csv")
POLYPHARMACY_COLLECTION = "polypharmacy_assessments"
USERS_COLLECTION = "users"
# Load the ML model
ML_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "polypharmacy_risk_train_model.pkl")
ml_model = joblib.load(ML_MODEL_PATH)               


# ------------------ All original functions (unchanged) ------------------
def _normalize_drug_name(value: str) -> str:
    return value.strip().lower()

@lru_cache(maxsize=1)
def _load_interaction_map() -> Dict[Tuple[str, str], List[Dict]]:
    interaction_map: Dict[Tuple[str, str], List[Dict]] = {}
    global _DRUG_NAME_INDEX
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

    _DRUG_NAME_INDEX = [
        {"label": name, "normalized": _normalize_drug_name(name)}
        for name in sorted(drug_name_set)
        if name
    ]
    return interaction_map

_DRUG_NAME_INDEX: List[Dict[str, str]] = []

def search_drug_names(query: str, limit: int = 15) -> List[str]:
    if not query or not isinstance(query, str):
        return []

    interaction_map = _load_interaction_map()
    normalized_query = _normalize_drug_name(query)
    if not normalized_query:
        return []

    prefix_matches = []
    substring_matches = []

    for entry in _DRUG_NAME_INDEX:
        label = entry["label"]
        norm = entry["normalized"]
        if norm.startswith(normalized_query):
            prefix_matches.append((len(label), label))
        elif normalized_query in norm:
            substring_matches.append((len(label), label))

    prefix_matches.sort(key=lambda x: x[0])
    substring_matches.sort(key=lambda x: x[0])

    ordered = [label for _, label in prefix_matches] + [label for _, label in substring_matches]

    seen = set()
    results = []
    for label in ordered:
        if label in seen:
            continue
        seen.add(label)
        results.append(label)
        if len(results) >= limit:
            break
    return results

def find_drug_interactions(drugs: List[str]) -> Tuple[List[Dict], Dict[str, int]]:
    interaction_map = _load_interaction_map()
    interactions: List[Dict] = []
    severity_summary: Dict[str, int] = {"Minor": 0, "Moderate": 0, "Major": 0}

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
            if not rows:
                continue
            for row in rows:
                severity = row.get("severity", "Unknown")
                interactions.append(row)
                severity_summary[severity] = severity_summary.get(severity, 0) + 1

    return interactions, severity_summary

def save_polypharmacy_assessment(
    user_id: str,
    user_profile: Dict,
    drugs: List[str],
    interactions: List[Dict],
    severity_summary: Dict[str, int],
    age: int,
    liver_function: str,
    kidney_function: str,
    risk_calculation: Dict,
) -> Dict:
    db = get_db()
    doc_ref = db.collection(POLYPHARMACY_COLLECTION).document()
    timestamp = datetime.utcnow().isoformat()

    patient_data = {
        "firstName": user_profile.get("firstName"),
        "lastName": user_profile.get("lastName"),
        "displayName": user_profile.get("displayName"),
        "age": age,
        "gender": user_profile.get("gender"),
        "email": user_profile.get("email"),
        "photoURL": user_profile.get("photoURL"),
    }

    payload = {
        "userId": user_id,
        "mode": "self",
        "user": patient_data,
        "drugs": drugs,
        "drugCount": len(drugs),
        "interactions": interactions,
        "interactionCount": len(interactions),
        "severitySummary": severity_summary,
        "age": age,
        "liverFunction": liver_function,
        "kidneyFunction": kidney_function,
        "riskCalculation": risk_calculation,
        "createdAt": timestamp,
        "updatedAt": timestamp,
        "source": "Drug_interaction.csv",
    }

    doc_ref.set(payload)
    payload["id"] = doc_ref.id
    return payload

def get_user_profile(user_id: str) -> Dict:
    db = get_db()
    doc = db.collection(USERS_COLLECTION).document(user_id).get()
    if not doc.exists:
        return {}
    return doc.to_dict()

# ------------------ ML-ONLY risk calculation ------------------
def calculate_polypharmacy_risk(
    drug_count: int,
    age: int,
    severity_summary: Dict[str, int],
    liver_function: str,
    kidney_function: str,
) -> Dict:
    """
    Calculate polypharmacy risk using ONLY the ML model.
    All sub-scores and components are removed.
    """
    # Prepare counts for ML model
    major_count = severity_summary.get('Major', 0) + severity_summary.get('major', 0)
    moderate_count = severity_summary.get('Moderate', 0) + severity_summary.get('moderate', 0)
    minor_count = severity_summary.get('Minor', 0) + severity_summary.get('minor', 0)
    total_ddi_count = major_count + moderate_count + minor_count

    # Prepare input for ML model
    input_df = pd.DataFrame([{
        'drug_count': drug_count,
        'age': age,
        'major_count': major_count,
        'moderate_count': moderate_count,
        'minor_count': minor_count,
        'liver_function': liver_function,
        'kidney_function': kidney_function
    }])

    # Get ML prediction
    risk_score = ml_model.predict(input_df)[0]

    # Determine risk level based on ML score
    if risk_score < 30:
        risk_level = "Low"
    elif risk_score < 60:
        risk_level = "Moderate"
    elif risk_score < 80:
        risk_level = "High"
    else:
        risk_level = "Very High"

    # Simple explanation of inputs
    explanation = (
        f"ML Model Input: {drug_count} drugs, age {age}, "
        f"{major_count} major + {moderate_count} moderate + {minor_count} minor interactions, "
        f"liver function: {liver_function}, kidney function: {kidney_function}"
    )

    return {
        "drugCount": drug_count,
        "ddiCount": total_ddi_count,
        "riskScore": round(risk_score, 2),
        "riskLevel": risk_level,
        "modelType": "Machine Learning",
        "explanation": explanation,
        "inputs": {
            "drug_count": drug_count,
            "age": age,
            "major_interactions": major_count,
            "moderate_interactions": moderate_count,
            "minor_interactions": minor_count,
            "liver_function": liver_function,
            "kidney_function": kidney_function
        }
    }