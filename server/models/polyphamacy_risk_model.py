import csv
import os
from datetime import datetime
from functools import lru_cache
from typing import Dict, List, Tuple, Optional

from db import get_db

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "Data", "Drug_interaction.csv")
POLYPHARMACY_COLLECTION = "polypharmacy_assessments"
USERS_COLLECTION = "users"


def _normalize_drug_name(value: str) -> str:
    return value.strip().lower()


@lru_cache(maxsize=1)
def _load_interaction_map() -> Dict[Tuple[str, str], List[Dict]]:
    """Load the CSV once and keep it cached for subsequent lookups."""
    interaction_map: Dict[Tuple[str, str], List[Dict]] = {}
    # We also collect a unique set of all drug names for fuzzy search.
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

            # Collect raw labels for the drug-name index
            drug_name_set.add(drug_a)
            drug_name_set.add(drug_b)

    # Build a cached list of unique drug names (label + normalized) for search
    _DRUG_NAME_INDEX = [
        {"label": name, "normalized": _normalize_drug_name(name)}
        for name in sorted(drug_name_set)
        if name
    ]

    return interaction_map


# Will be populated when _load_interaction_map() runs
_DRUG_NAME_INDEX: List[Dict[str, str]] = []


def search_drug_names(query: str, limit: int = 15) -> List[str]:
    """
    Simple fuzzy search over drug names from the Drug_interaction.csv file.

    - Case-insensitive
    - Scores prefix matches highest, then substring matches
    - Returns up to `limit` unique labels
    """
    if not query or not isinstance(query, str):
        return []

    interaction_map = _load_interaction_map()  # ensures _DRUG_NAME_INDEX is populated
    _ = interaction_map  # silence unused variable warning

    normalized_query = _normalize_drug_name(query)
    if not normalized_query:
        return []

    # Very lightweight scoring: prefix > substring > others
    prefix_matches: List[Tuple[int, str]] = []
    substring_matches: List[Tuple[int, str]] = []

    for entry in _DRUG_NAME_INDEX:
        label = entry["label"]
        norm = entry["normalized"]
        if norm.startswith(normalized_query):
            prefix_matches.append((len(label), label))
        elif normalized_query in norm:
            substring_matches.append((len(label), label))

    # Sort shorter labels first within each group
    prefix_matches.sort(key=lambda x: x[0])
    substring_matches.sort(key=lambda x: x[0])

    ordered = [label for _, label in prefix_matches] + [label for _, label in substring_matches]

    # Preserve uniqueness and limit
    seen = set()
    results: List[str] = []
    for label in ordered:
        if label in seen:
            continue
        seen.add(label)
        results.append(label)
        if len(results) >= limit:
            break

    return results


def find_drug_interactions(drugs: List[str]) -> Tuple[List[Dict], Dict[str, int]]:
    """Return interaction rows and severity counts for the provided drugs."""
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
                severity_summary.setdefault(severity, 0)
                severity_summary[severity] += 1

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
    """Persist the assessment in Firestore."""
    db = get_db()
    doc_ref = db.collection(POLYPHARMACY_COLLECTION).document()
    timestamp = datetime.utcnow().isoformat()

    payload = {
        "userId": user_id,
        "user": {
            "firstName": user_profile.get("firstName"),
            "lastName": user_profile.get("lastName"),
            "displayName": user_profile.get("displayName"),
            "age": age,
            "gender": user_profile.get("gender"),
            "email": user_profile.get("email"),
            "photoURL": user_profile.get("photoURL"),
        },
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
    """Fetch user profile stored in Firestore."""
    db = get_db()
    doc = db.collection(USERS_COLLECTION).document(user_id).get()
    if not doc.exists:
        return {}
    return doc.to_dict()


def calculate_s1_score(drug_count: int) -> float:
    """
    Calculate S1 score based on medication count.
    < 5: 0.0
    5-7: 0.7
    8-10: 1.0
    > 10: 1.0 + 0.1 for each additional drug
    """
    if drug_count < 5:
        return 0.0
    elif drug_count <= 7:
        return 0.7
    elif drug_count <= 10:
        return 1.0
    else:
        # For > 10, add 0.1 for each drug above 10
        return 1.0 + (drug_count - 10) * 0.1


def calculate_s2_score(age: int) -> float:
    """
    Calculate S2 score based on age.
    65 < 75: 0.5
    75 < 85: 0.7
    85+: 1.0
    """
    if age < 65:
        return 0.0
    elif age < 75:
        return 0.5
    elif age < 85:
        return 0.7
    else:
        return 1.0


def calculate_s3_score(severity_summary: Dict[str, int]) -> Tuple[float, int]:
    """
    Calculate S3 score based on drug interactions.
    S3 = (Major DDI count × 1.0) + (Moderate DDI count × 0.6) + (Minor DDI count × 0.3)
    No DDI → S3 = 0.0
    Returns: (S3 score, total DDI count)
    """
    # Handle case-insensitive matching for severity keys
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

    # Calculate S3 by summing all severities with their respective weights
    s3_score = (1.0 * major_count) + (0.6 * moderate_count) + (0.3 * minor_count)

    return s3_score, total_ddi_count


def calculate_s4_score(liver_function: str) -> float:
    """
    Calculate S4 score based on liver function (ALT/AST level).
    Normal (<40 IU/L): 0.0
    Mild risk (40-80 IU/L): 0.3
    Moderate risk (80-150 IU/L): 0.6
    Severe risk (>150 IU/L): 1.0
    """
    liver_function_lower = liver_function.lower().strip()
    
    # Check for severe first (most specific)
    if "severe" in liver_function_lower or ">150" in liver_function_lower or "above 150" in liver_function_lower:
        return 1.0
    # Check for moderate
    elif "moderate" in liver_function_lower or ("80" in liver_function_lower and "150" in liver_function_lower):
        return 0.6
    # Check for mild
    elif "mild" in liver_function_lower or ("40" in liver_function_lower and "80" in liver_function_lower):
        return 0.3
    # Check for normal
    elif "normal" in liver_function_lower or "<40" in liver_function_lower:
        return 0.0
    else:
        return 0.0


def calculate_s5_score(kidney_function: str) -> float:
    """
    Calculate S5 score based on kidney function (CKD stage).
    Stage 1 (eGFR 90): 0.0
    Stage 2 (eGFR 60-89): 0.3
    Stage 3a (eGFR 45-59): 0.5
    Stage 3b (eGFR 30-44): 0.7
    Stage 4 (eGFR 15-29): 0.9
    Stage 5 (eGFR <15): 1.0
    """
    kidney_function_lower = kidney_function.lower().strip()
    
    # Check stages in order (most specific first)
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
    """
    Calculate the final polypharmacy risk score.
    
    Formula:
    Polypharmacy Risk = (Drug Weight * S1) + (Age Weight * S2) + 
                       (DDI Weight * S3 ) + 
                       (Liver Weight * S4) + (Kidney Weight * S5)
    
    Risk categories:
    Low: 0-29
    Moderate: 30-59
    High: 60-79
    Very High: ≥80
    """
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
    
    # Calculate S3 explanation - recalculate to show breakdown
    # Handle case-insensitive matching for severity keys
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
            # Use the actual s3 value that was calculated (should match the formula)
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

    # Calculate weighted score
    # Formula: DDI Weight * S3 score calculate by severity DDI Count
    # S3 already includes weighted counts for all severities
    risk_score = (
        (drug_weight * s1) +
        (age_weight * s2) +
        (ddi_weight * s3) +
        (liver_weight * s4) +
        (kidney_weight * s5)
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
