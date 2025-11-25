import csv
import os
from datetime import datetime
from functools import lru_cache
from typing import Dict, List, Tuple

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
    return interaction_map


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


def save_polypharmacy_assessment(user_id: str, user_profile: Dict, drugs: List[str], interactions: List[Dict],
                                 severity_summary: Dict[str, int]) -> Dict:
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
            "age": user_profile.get("age"),
            "gender": user_profile.get("gender"),
            "email": user_profile.get("email"),
            "photoURL": user_profile.get("photoURL"),
        },
        "drugs": drugs,
        "drugCount": len(drugs),
        "interactions": interactions,
        "interactionCount": len(interactions),
        "severitySummary": severity_summary,
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
