import os
import csv
import pickle
import numpy as np
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from functools import lru_cache

from db import get_db

# Path to the knowledge base directory (same directory as this file)
MODEL_DIR = os.path.join(os.path.dirname(__file__), "drug_interaction_ml")
ADE_MODEL_DIR = os.path.join(os.path.dirname(__file__), "ade_model")
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "Data")
POLYPHARMACY_COLLECTION = "polypharmacy_assessments"
USERS_COLLECTION = "users"

# Global variables for knowledge base
_INTERACTION_DB = None
_DRUG_LIST = None
_DRUG_NAME_MAP = None
_SEVERITY_LEVELS = None

# ADE model globals
_ADE_MODEL = None
_ADE_DRUG_ENCODER = None
_ADE_DISEASE_ENCODER = None
_ADE_TARGET_ENCODER = None


def _normalize_drug_name(value: str) -> str:
    return value.strip().lower()


@lru_cache(maxsize=1)
def _load_knowledge_base():
    """Load the drug interaction knowledge base once and cache it."""
    global _INTERACTION_DB, _DRUG_LIST, _DRUG_NAME_MAP, _SEVERITY_LEVELS
    
    if not os.path.exists(MODEL_DIR):
        raise FileNotFoundError(f"Knowledge base directory not found at {MODEL_DIR}. Please train the model first.")
    
    try:
        with open(os.path.join(MODEL_DIR, "interaction_db.pkl"), 'rb') as f:
            _INTERACTION_DB = pickle.load(f)
        
        with open(os.path.join(MODEL_DIR, "drug_list.pkl"), 'rb') as f:
            _DRUG_LIST = pickle.load(f)
        
        with open(os.path.join(MODEL_DIR, "drug_name_map.pkl"), 'rb') as f:
            _DRUG_NAME_MAP = pickle.load(f)
        
        with open(os.path.join(MODEL_DIR, "severity_levels.pkl"), 'rb') as f:
            _SEVERITY_LEVELS = pickle.load(f)
        
        return _INTERACTION_DB, _DRUG_LIST, _DRUG_NAME_MAP, _SEVERITY_LEVELS
    except Exception as e:
        raise FileNotFoundError(f"Failed to load knowledge base: {str(e)}")


def search_drug_names(query: str, limit: int = 15) -> List[str]:
    """
    Fuzzy search over drug names from the knowledge base.
    
    - Case-insensitive
    - Scores prefix matches highest, then substring matches
    - Returns up to `limit` unique labels
    """
    if not query or not isinstance(query, str):
        return []
    
    # Load drug list from knowledge base
    _, drug_list, _, _ = _load_knowledge_base()
    
    normalized_query = _normalize_drug_name(query)
    if not normalized_query:
        return []
    
    # Lightweight scoring: prefix > substring
    prefix_matches = []
    substring_matches = []
    
    for drug in drug_list:
        normalized_drug = _normalize_drug_name(drug)
        if normalized_drug.startswith(normalized_query):
            prefix_matches.append((len(drug), drug))
        elif normalized_query in normalized_drug:
            substring_matches.append((len(drug), drug))
    
    # Sort by length (shorter first)
    prefix_matches.sort(key=lambda x: x[0])
    substring_matches.sort(key=lambda x: x[0])
    
    ordered = [label for _, label in prefix_matches] + [label for _, label in substring_matches]
    
    # Remove duplicates and limit
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


@lru_cache(maxsize=1)
def _load_disease_list() -> List[str]:
    """Load unique disease names from the Adverse Drug Event CSV."""
    csv_path = os.path.join(DATA_DIR, "Adverse Drug Event.csv")
    if not os.path.exists(csv_path):
        return []
    
    diseases = set()
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            disease = row.get("Existing Diseases", "").strip()
            if disease:
                diseases.add(disease)
    
    return sorted(diseases)


def search_disease_names(query: str, limit: int = 15) -> List[str]:
    """
    Fuzzy search over disease names from the Adverse Drug Event CSV.
    
    - Case-insensitive
    - Scores prefix matches highest, then substring matches
    - Returns up to `limit` unique labels
    """
    if not query or not isinstance(query, str):
        return []
    
    disease_list = _load_disease_list()
    normalized_query = query.strip().lower()
    if not normalized_query:
        return []
    
    prefix_matches = []
    substring_matches = []
    
    for disease in disease_list:
        normalized_disease = disease.lower()
        if normalized_disease.startswith(normalized_query):
            prefix_matches.append(disease)
        elif normalized_query in normalized_disease:
            substring_matches.append(disease)
    
    results = prefix_matches + substring_matches
    return results[:limit]


def _load_ade_model():
    """Load the trained ADE prediction model and encoders (cached)."""
    global _ADE_MODEL, _ADE_DRUG_ENCODER, _ADE_DISEASE_ENCODER, _ADE_TARGET_ENCODER

    if _ADE_MODEL is not None:
        return _ADE_MODEL, _ADE_DRUG_ENCODER, _ADE_DISEASE_ENCODER, _ADE_TARGET_ENCODER

    model_path = os.path.join(ADE_MODEL_DIR, "rf_ade_model.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"ADE model not found at {model_path}. Run train_ade_model.py first."
        )

    with open(model_path, "rb") as f:
        _ADE_MODEL = pickle.load(f)
    with open(os.path.join(ADE_MODEL_DIR, "drug_encoder.pkl"), "rb") as f:
        _ADE_DRUG_ENCODER = pickle.load(f)
    with open(os.path.join(ADE_MODEL_DIR, "disease_encoder.pkl"), "rb") as f:
        _ADE_DISEASE_ENCODER = pickle.load(f)
    with open(os.path.join(ADE_MODEL_DIR, "target_encoder.pkl"), "rb") as f:
        _ADE_TARGET_ENCODER = pickle.load(f)

    return _ADE_MODEL, _ADE_DRUG_ENCODER, _ADE_DISEASE_ENCODER, _ADE_TARGET_ENCODER


def predict_adverse_events(
    drugs: List[str], age: int, diseases: List[str]
) -> List[Dict]:
    """
    Predict adverse drug events for combinations of drugs and existing diseases.

    Returns a list of dicts:
        { drug, disease, predictedADE, confidence }
    """
    model, drug_enc, disease_enc, target_enc = _load_ade_model()

    known_drugs = set(drug_enc.classes_)
    known_diseases = set(disease_enc.classes_)

    predictions: List[Dict] = []

    for drug in drugs:
        drug_clean = drug.strip()
        # Find closest known drug (case-insensitive)
        drug_match = None
        for kd in known_drugs:
            if kd.lower() == drug_clean.lower():
                drug_match = kd
                break
        if drug_match is None:
            continue  # skip unknown drugs

        drug_encoded = drug_enc.transform([drug_match])[0]

        disease_list = diseases if diseases else [""]
        for disease in disease_list:
            disease_clean = disease.strip()
            if not disease_clean:
                continue
            # Find closest known disease
            disease_match = None
            for kds in known_diseases:
                if kds.lower() == disease_clean.lower():
                    disease_match = kds
                    break
            if disease_match is None:
                continue  # skip unknown diseases

            disease_encoded = disease_enc.transform([disease_match])[0]
            features = np.array([[drug_encoded, age, disease_encoded]])

            proba = model.predict_proba(features)[0]
            pred_idx = int(np.argmax(proba))
            predicted_ade = target_enc.inverse_transform([pred_idx])[0]
            confidence = round(float(proba[pred_idx]) * 100, 1)

            predictions.append({
                "drug": drug_match,
                "disease": disease_match,
                "predictedADE": predicted_ade,
                "confidence": confidence,
            })

    return predictions

def lookup_drug_interaction(drug_a: str, drug_b: str) -> Optional[Dict]:
    """
    Look up if two drugs interact in the knowledge base.
    Returns interaction details with severity and description, or None if no interaction found.
    100% accurate for known interactions.
    """
    interaction_db, _, _, _ = _load_knowledge_base()
    
    drug_a_norm = _normalize_drug_name(drug_a)
    drug_b_norm = _normalize_drug_name(drug_b)
    
    # Create sorted drug pair (order doesn't matter)
    drug_pair = tuple(sorted([drug_a_norm, drug_b_norm]))
    
    # Look up in knowledge base
    if drug_pair in interaction_db:
        interaction = interaction_db[drug_pair]
        return {
            'severity': interaction['severity'],
            'description': interaction.get('description', ''),
            'drug_a': interaction.get('drug_a', drug_a_norm),
            'drug_b': interaction.get('drug_b', drug_b_norm),
            'ddinterIdA': interaction.get('ddinterIdA', ''),
            'ddinterIdB': interaction.get('ddinterIdB', ''),
        }
    
    # No interaction found
    return None


def find_drug_interactions(drugs: List[str]) -> Tuple[List[Dict], Dict[str, int]]:
    """
    Find all interactions between drug pairs using the knowledge base.
    Returns interaction rows and severity counts.
    100% accurate for known interactions.
    """
    interactions = []
    severity_summary = {"Minor": 0, "Moderate": 0, "Major": 0}
    
    # Clean and deduplicate drugs
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
    
    # Check all pairs using knowledge base
    for i in range(len(cleaned_drugs)):
        for j in range(i + 1, len(cleaned_drugs)):
            drug_a = cleaned_drugs[i]["label"]
            drug_b = cleaned_drugs[j]["label"]
            
            # Look up interaction
            interaction_data = lookup_drug_interaction(drug_a, drug_b)
            
            if interaction_data:
                severity = interaction_data['severity']
                interaction_row = {
                    'drugA': drug_a,
                    'drugB': drug_b,
                    'severity': severity,
                    'description': interaction_data.get('description', ''),
                    'ddinterIdA': interaction_data.get('ddinterIdA', ''),
                    'ddinterIdB': interaction_data.get('ddinterIdB', ''),
                }
                interactions.append(interaction_row)
                
                # Update severity summary
                if severity in severity_summary:
                    severity_summary[severity] += 1
    
    return interactions, severity_summary


def save_polypharmacy_assessment(
    user_id: str,
    user_profile: Dict,
    drugs: List[str],
    interactions: List[Dict],
    severity_summary: Dict[str, int],
    age: int,
    gender: str = "",
    liver_function: str = "",
    kidney_function: str = "",
    risk_calculation: Dict = None,
    existing_diseases: Optional[List[str]] = None,
    ade_predictions: Optional[List[Dict]] = None,
) -> Dict:
    """Persist the latest assessment for the user (upsert single record)."""
    db = get_db()
    timestamp = datetime.utcnow().isoformat()
    
    patient_data = {
        "firstName": user_profile.get("firstName"),
        "lastName": user_profile.get("lastName"),
        "displayName": user_profile.get("displayName"),
        "age": age,
        "gender": gender or user_profile.get("gender", ""),
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
        "existingDiseases": existing_diseases or [],
        "adePredictions": ade_predictions or [],
        "riskCalculation": risk_calculation,
        "updatedAt": timestamp,
        "source": "ML_Model",
    }
    
    # Upsert: keep a single assessment per user
    existing = (
        db.collection(POLYPHARMACY_COLLECTION)
        .where("userId", "==", user_id)
        .limit(1)
        .get()
    )
    
    if existing:
        doc_ref = existing[0].reference
        created_at = existing[0].to_dict().get("createdAt")
        payload["createdAt"] = created_at or timestamp
        doc_ref.set(payload)
    else:
        doc_ref = db.collection(POLYPHARMACY_COLLECTION).document()
        payload["createdAt"] = timestamp
        doc_ref.set(payload)
    
    payload["id"] = doc_ref.id
    return payload


def get_polypharmacy_assessment(user_id: str) -> Optional[Dict]:
    """Retrieve the latest assessment for a user."""
    db = get_db()
    docs = (
        db.collection(POLYPHARMACY_COLLECTION)
        .where("userId", "==", user_id)
        .limit(1)
        .get()
    )
    
    if not docs:
        return None
    
    data = docs[0].to_dict()
    data["id"] = docs[0].id
    return data


def delete_polypharmacy_assessment(user_id: str) -> bool:
    """Delete the assessment for a user."""
    db = get_db()
    docs = (
        db.collection(POLYPHARMACY_COLLECTION)
        .where("userId", "==", user_id)
        .limit(1)
        .get()
    )
    
    if not docs:
        return False
    
    docs[0].reference.delete()
    return True


def get_user_profile(user_id: str) -> Dict:
    """Fetch user profile stored in Firestore."""
    db = get_db()
    doc = db.collection(USERS_COLLECTION).document(user_id).get()
    if not doc.exists:
        return {}
    return doc.to_dict()


def update_user_profile_fields(user_id: str, fields: Dict) -> None:
    """Update specified fields in the user's main profile."""
    if not fields:
        return
    db = get_db()
    doc_ref = db.collection(USERS_COLLECTION).document(user_id)
    if doc_ref.get().exists:
        doc_ref.update(fields)


def calculate_s1_score(drug_count: int) -> float:
    """Calculate S1 score based on medication count."""
    if drug_count < 5:
        return 0.0
    elif drug_count <= 7:
        return 0.7
    elif drug_count <= 10:
        return 1.0
    else:
        return 1.0 + (drug_count - 10) * 0.1


def calculate_s2_score(age: int) -> float:
    """Calculate S2 score based on age."""
    if age < 65:
        return 0.0
    elif age < 75:
        return 0.5
    elif age < 85:
        return 0.7
    else:
        return 1.0


def calculate_s3_score(severity_summary: Dict[str, int]) -> Tuple[float, int]:
    """Calculate S3 score based on drug interactions."""
    major_count = 0
    moderate_count = 0
    minor_count = 0
    
    for key, value in severity_summary.items():
        key_lower = key.lower() if isinstance(key, str) else str(key).lower()
        if key_lower == "major":
            major_count += value
        elif key_lower == "moderate":
            moderate_count += value
        elif key_lower == "minor":
            minor_count += value
    
    total_ddi_count = major_count + moderate_count + minor_count
    s3_score = (1.0 * major_count) + (0.6 * moderate_count) + (0.3 * minor_count)
    
    return s3_score, total_ddi_count


def calculate_s4_score(liver_function: str) -> float:
    """Calculate S4 score based on liver function."""
    liver_function_lower = liver_function.lower().strip()
    
    if "severe" in liver_function_lower or ">150" in liver_function_lower or "above 150" in liver_function_lower:
        return 1.0
    elif "moderate" in liver_function_lower or ("80" in liver_function_lower and "150" in liver_function_lower):
        return 0.6
    elif "mild" in liver_function_lower or ("40" in liver_function_lower and "80" in liver_function_lower):
        return 0.3
    elif "normal" in liver_function_lower or "<40" in liver_function_lower:
        return 0.0
    else:
        return 0.0


def calculate_s5_score(kidney_function: str) -> float:
    """Calculate S5 score based on kidney function."""
    kidney_function_lower = kidney_function.lower().strip()
    
    if "stage 5" in kidney_function_lower or "egfr <15" in kidney_function_lower or "below 15" in kidney_function_lower or "egfr of below 15" in kidney_function_lower:
        return 1.0
    elif "stage 4" in kidney_function_lower or ("egfr 15" in kidney_function_lower and "29" in kidney_function_lower) or "egfr of 15-29" in kidney_function_lower:
        return 0.9
    elif "stage 3b" in kidney_function_lower or ("egfr 30" in kidney_function_lower and "44" in kidney_function_lower) or "egfr of 30-44" in kidney_function_lower:
        return 0.7
    elif "stage 3a" in kidney_function_lower or ("egfr 45" in kidney_function_lower and "59" in kidney_function_lower) or "egfr of 45-59" in kidney_function_lower:
        return 0.5
    elif "stage 2" in kidney_function_lower or ("egfr 60" in kidney_function_lower and "89" in kidney_function_lower) or "egfr of 60-89" in kidney_function_lower:
        return 0.3
    elif "stage 1" in kidney_function_lower or "egfr 90" in kidney_function_lower or "egfr of 90" in kidney_function_lower:
        return 0.0
    else:
        return 0.0


def calculate_polypharmacy_risk(
    drug_count: int,
    age: int,
    severity_summary: Dict[str, int],
    liver_function: str,
    kidney_function: str,
    drug_weight: float = 25.0,
    age_weight: float = 25.0,
    ddi_weight: float = 30.0,
    liver_weight: float = 10.0,
    kidney_weight: float = 10.0,
) -> Dict:
    """Calculate the final polypharmacy risk score."""
    s1 = calculate_s1_score(drug_count)
    s2 = calculate_s2_score(age)
    s3, total_ddi_count = calculate_s3_score(severity_summary)
    s4 = calculate_s4_score(liver_function)
    s5 = calculate_s5_score(kidney_function)
    
    # Calculate S1 explanation
    if drug_count < 5:
        s1_explanation = f"S1 = 0.0 (Drug count < 5)"
    elif drug_count <= 7:
        s1_explanation = f"S1 = 0.7 (Drug count 5-7)"
    elif drug_count <= 10:
        s1_explanation = f"S1 = 1.0 (Drug count 8-10)"
    else:
        additional_drugs = drug_count - 10
        s1_explanation = f"S1 = 1.0 + ({additional_drugs} × 0.1) = 1.0 + {additional_drugs * 0.1} (Drug count > 10)"
    
    # Calculate S2 explanation
    if age < 65:
        s2_explanation = f"S2 = 0.0 (Age < 65)"
    elif age < 75:
        s2_explanation = f"S2 = 0.5 (Age 65-74)"
    elif age < 85:
        s2_explanation = f"S2 = 0.7 (Age 75-84)"
    else:
        s2_explanation = f"S2 = 1.0 (Age ≥ 85)"
    
    # Calculate S3 explanation
    major_count = 0
    moderate_count = 0
    minor_count = 0
    
    for key, value in severity_summary.items():
        key_lower = key.lower() if isinstance(key, str) else str(key).lower()
        if key_lower == "major":
            major_count += value
        elif key_lower == "moderate":
            moderate_count += value
        elif key_lower == "minor":
            minor_count += value
    
    if total_ddi_count > 0:
        parts = []
        if major_count > 0:
            parts.append(f"({major_count} × 1.0)")
        if moderate_count > 0:
            parts.append(f"({moderate_count} × 0.6)")
        if minor_count > 0:
            parts.append(f"({minor_count} × 0.3)")
        
        if parts:
            s3_explanation = f"S3 = {' + '.join(parts)} = {s3:.2f}"
            detail_parts = []
            if major_count > 0:
                detail_parts.append(f"Major: {major_count}")
            if moderate_count > 0:
                detail_parts.append(f"Moderate: {moderate_count}")
            if minor_count > 0:
                detail_parts.append(f"Minor: {minor_count}")
            if detail_parts:
                s3_explanation += f" ({', '.join(detail_parts)})"
        else:
            s3_explanation = f"S3 = 0.0 (No DDI found)"
    else:
        s3_explanation = f"S3 = 0.0 (No DDI found)"
    
    # Calculate S4 explanation
    liver_function_lower = liver_function.lower().strip()
    if "severe" in liver_function_lower or ">150" in liver_function_lower or "above 150" in liver_function_lower:
        s4_explanation = f"S4 = 1.0 (Severe risk: ALT/AST >150 IU/L)"
    elif "moderate" in liver_function_lower or ("80" in liver_function_lower and "150" in liver_function_lower):
        s4_explanation = f"S4 = 0.6 (Moderate risk: ALT/AST 80-150 IU/L)"
    elif "mild" in liver_function_lower or ("40" in liver_function_lower and "80" in liver_function_lower):
        s4_explanation = f"S4 = 0.3 (Mild risk: ALT/AST 40-80 IU/L)"
    elif "normal" in liver_function_lower or "<40" in liver_function_lower:
        s4_explanation = f"S4 = 0.0 (Normal: ALT/AST <40 IU/L)"
    else:
        s4_explanation = f"S4 = 0.0 (Normal: ALT/AST <40 IU/L)"
    
    # Calculate S5 explanation
    kidney_function_lower = kidney_function.lower().strip()
    if "stage 5" in kidney_function_lower or "egfr <15" in kidney_function_lower or "below 15" in kidney_function_lower:
        s5_explanation = f"S5 = 1.0 (Stage 5: eGFR <15)"
    elif "stage 4" in kidney_function_lower or ("egfr 15" in kidney_function_lower and "29" in kidney_function_lower):
        s5_explanation = f"S5 = 0.9 (Stage 4: eGFR 15-29)"
    elif "stage 3b" in kidney_function_lower or ("egfr 30" in kidney_function_lower and "44" in kidney_function_lower):
        s5_explanation = f"S5 = 0.7 (Stage 3b: eGFR 30-44)"
    elif "stage 3a" in kidney_function_lower or ("egfr 45" in kidney_function_lower and "59" in kidney_function_lower):
        s5_explanation = f"S5 = 0.5 (Stage 3a: eGFR 45-59)"
    elif "stage 2" in kidney_function_lower or ("egfr 60" in kidney_function_lower and "89" in kidney_function_lower):
        s5_explanation = f"S5 = 0.3 (Stage 2: eGFR 60-89)"
    elif "stage 1" in kidney_function_lower or "egfr 90" in kidney_function_lower:
        s5_explanation = f"S5 = 0.0 (Stage 1: eGFR 90)"
    else:
        s5_explanation = f"S5 = 0.0 (Stage 1: eGFR 90)"
    
    # Calculate weighted score (capped at 100)
    risk_score = min(
        (drug_weight * s1) +
        (age_weight * s2) +
        (ddi_weight * s3) +
        (liver_weight * s4) +
        (kidney_weight * s5),
        100.0
    )
    
    # Determine risk level
    if risk_score < 30:
        risk_level = "Low"
    elif risk_score < 60:
        risk_level = "Moderate"
    elif risk_score < 80:
        risk_level = "High"
    else:
        risk_level = "Very High"
    
    return {
        "scores": {
            "s1": round(s1, 2),
            "s2": round(s2, 2),
            "s3": round(s3, 2),
            "s4": round(s4, 2),
            "s5": round(s5, 2),
        },
        "weights": {
            "drugWeight": drug_weight,
            "ageWeight": age_weight,
            "ddiWeight": ddi_weight,
            "liverWeight": liver_weight,
            "kidneyWeight": kidney_weight,
        },
        "drugCount": drug_count,
        "ddiCount": total_ddi_count,
        "riskScore": round(risk_score, 2),
        "riskLevel": risk_level,
        "calculation": {
            "drugComponent": round(drug_weight * s1, 2),
            "ageComponent": round(age_weight * s2, 2),
            "ddiComponent": round(ddi_weight * s3, 2),
            "liverComponent": round(liver_weight * s4, 2),
            "kidneyComponent": round(kidney_weight * s5, 2),
            "s1Explanation": s1_explanation,
            "s2Explanation": s2_explanation,
            "s3Explanation": s3_explanation,
            "s4Explanation": s4_explanation,
            "s5Explanation": s5_explanation,
        },
    }