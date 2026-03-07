import os
import joblib
import pandas as pd
from itertools import combinations
import numpy as np
from functools import lru_cache
import ast
from datetime import datetime
from db import get_db

# ─── Paths ────────────────────────────────────────────────────────────────────
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_MODEL_DIR = os.path.join(_BASE_DIR, "Vitamin_difml")
_DATA_DIR = os.path.join(_BASE_DIR, "..", "Data")
_CSV_PATH = os.path.join(_DATA_DIR, "final_vitamin_dataset_cleaned.csv")
VITAMIN_COLLECTION = "vitamin_deficiency_assessments"
USERS_COLLECTION = "users"

# ─── Lazy-loaded globals ──────────────────────────────────────────────────────
_model = None
_tfidf = None
_mlb = None


def _load_artifacts():
    """Load the trained SVM model, TF-IDF vectorizer, and label encoder."""
    global _model, _tfidf, _mlb
    if _model is None:
        _model = joblib.load(os.path.join(_MODEL_DIR, "model.pkl"))
        _tfidf = joblib.load(os.path.join(_MODEL_DIR, "tfidf.pkl"))
        _mlb = joblib.load(os.path.join(_MODEL_DIR, "label_encoder.pkl"))


# ─── Vitamin metadata (descriptions & food sources) ──────────────────────────
VITAMIN_INFO = {
    "A": {
        "name": "Vitamin A",
        "description": "Essential for vision, immune function, and skin health.",
        "foods": ["Carrots", "Sweet potatoes", "Spinach", "Liver", "Eggs"],
        "icon": "🥕",
    },
    "B1": {
        "name": "Vitamin B1 (Thiamine)",
        "description": "Supports energy metabolism and nervous system function.",
        "foods": ["Whole grains", "Pork", "Legumes", "Nuts", "Seeds"],
        "icon": "🌾",
    },
    "B2": {
        "name": "Vitamin B2 (Riboflavin)",
        "description": "Important for energy production, skin, and eye health.",
        "foods": ["Dairy products", "Eggs", "Lean meats", "Green vegetables"],
        "icon": "🥛",
    },
    "B6": {
        "name": "Vitamin B6 (Pyridoxine)",
        "description": "Vital for brain development, nerve function, and mood regulation.",
        "foods": ["Poultry", "Fish", "Potatoes", "Bananas", "Chickpeas"],
        "icon": "🍌",
    },
    "B12": {
        "name": "Vitamin B12 (Cobalamin)",
        "description": "Critical for nerve function, red blood cell formation, and DNA synthesis.",
        "foods": ["Meat", "Fish", "Dairy", "Eggs", "Fortified cereals"],
        "icon": "🥩",
    },
    "C": {
        "name": "Vitamin C",
        "description": "Powerful antioxidant; supports immune system, wound healing, and collagen production.",
        "foods": ["Oranges", "Strawberries", "Bell peppers", "Broccoli", "Kiwi"],
        "icon": "🍊",
    },
    "D": {
        "name": "Vitamin D",
        "description": "Essential for calcium absorption, bone health, and immune function.",
        "foods": ["Fatty fish", "Fortified milk", "Egg yolks", "Sunlight exposure"],
        "icon": "☀️",
    },
    "E": {
        "name": "Vitamin E",
        "description": "Antioxidant that protects cells from damage; supports skin and immune health.",
        "foods": ["Nuts", "Seeds", "Spinach", "Vegetable oils", "Avocado"],
        "icon": "🥑",
    },
    "Folate": {
        "name": "Folate (Vitamin B9)",
        "description": "Essential for cell division, DNA synthesis, and preventing neural tube defects.",
        "foods": ["Leafy greens", "Legumes", "Fortified grains", "Citrus fruits"],
        "icon": "🥬",
    },
}



@lru_cache(maxsize=1)
def _get_dataset():
    """Lazily load the combined_text and vitamin_labels columns from the dataset."""
    df = pd.read_csv(_CSV_PATH)
    return df[["combined_text", "vitamin_labels"]].dropna()

def _predict_pair(drug1: str, drug2: str, symptoms_clean: list) -> list:
    """Predict vitamin deficiencies by checking the dataset for exact matches."""
    _load_artifacts()

    d1 = drug1.strip().lower().replace(" ", "")
    d2 = drug2.strip().lower().replace(" ", "")
    
    target_pair1 = f"{d1} {d2}"
    target_pair2 = f"{d2} {d1}"
    
    pair_vitamins = set()
    user_symptoms_set = set(symptoms_clean)
    
    df = _get_dataset()
    
    for _, row in df.iterrows():
        text = str(row["combined_text"])
        parts = text.split(" ")
        if len(parts) >= 3:
            row_pair = f"{parts[0].lower()} {parts[1].lower()}"
            if row_pair == target_pair1 or row_pair == target_pair2:
                row_symptoms = parts[2].lower().split(",")
                row_symptoms_set = set(s.strip() for s in row_symptoms if s.strip())
                
                matched_symptoms = user_symptoms_set.intersection(row_symptoms_set)
                
                # If there's an overlap in symptoms, we use the ML model to predict on the exact row text
                if matched_symptoms:
                    print(f"[DEBUG] Found overlap! Text: {text}")
                    X = _tfidf.transform([text])
                    y_pred = _model.predict(X)
                    predicted_labels = _mlb.inverse_transform(y_pred)
                    print(f"[DEBUG] Predicted labels: {predicted_labels}")
                    
                    if predicted_labels[0]:
                        pair_vitamins.update(predicted_labels[0])

    return list(pair_vitamins)


def predict_vitamin_deficiency(drugs: list, symptoms: list) -> dict:
    """
    Predict vitamin deficiencies from multiple drugs and a list of symptoms.

    The ML model is trained on drug **pairs**, so this function generates all
    pairwise combinations from the drug list, predicts for each pair, and
    aggregates the unique vitamin deficiency results.

    Args:
        drugs: list of drug name strings (minimum 2)
        symptoms: list of symptom strings

    Returns:
        dict with 'predictions', 'pair_details', 'drugs', 'symptoms', etc.
    """
    _load_artifacts()

    symptoms_clean = [s.strip().lower().replace(" ", "") for s in symptoms if s.strip()]

    # Generate all pairwise combinations and predict
    all_vitamins = set()
    pair_details = []

    for d1, d2 in combinations(drugs, 2):
        pair_vitamins = _predict_pair(d1, d2, symptoms_clean)
        all_vitamins.update(pair_vitamins)
        if pair_vitamins:
            pair_details.append({
                "drug1": d1.strip(),
                "drug2": d2.strip(),
                "vitamins": [v.strip() for v in pair_vitamins],
            })

    # Build rich result with vitamin metadata
    results = []
    for v in sorted(all_vitamins):
        v_stripped = v.strip()
        info = VITAMIN_INFO.get(v_stripped, {
            "name": f"Vitamin {v_stripped}",
            "description": f"Potential deficiency in Vitamin {v_stripped} detected.",
            "foods": [],
            "icon": "💊",
        })
        # Find which drug pairs contributed this deficiency
        contributing_pairs = [
            f"{p['drug1']} + {p['drug2']}"
            for p in pair_details
            if v_stripped in p["vitamins"]
        ]
        results.append({
            "vitamin": v_stripped,
            **info,
            "contributing_pairs": contributing_pairs,
        })

    return {
        "predictions": results,
        "drugs": [d.strip() for d in drugs],
        "symptoms": symptoms_clean,
        "predicted_vitamins": sorted([v.strip() for v in all_vitamins]),
        "pair_details": pair_details,
        "total_pairs_analyzed": len(list(combinations(drugs, 2))),
    }


@lru_cache(maxsize=1)
def get_all_drug_names() -> list:
    """Return sorted unique drug names from the vitamin dataset."""
    df = pd.read_csv(_CSV_PATH)
    drugs = set(df["Drug1"].dropna().unique()) | set(df["Drug2"].dropna().unique())
    return sorted([d.strip() for d in drugs if d.strip()])


@lru_cache(maxsize=1)
def get_all_symptoms() -> list:
    """Return sorted unique symptoms from the vitamin dataset."""
    df = pd.read_csv(_CSV_PATH)
    all_symptoms = set()
    for raw in df["SYMPTOMS"].dropna():
        for s in raw.split(","):
            cleaned = s.strip().lower()
            if cleaned:
                all_symptoms.add(cleaned)
    return sorted(all_symptoms)


def search_drug_names(query: str, limit: int = 15) -> list:
    """Fuzzy search over drug names — prefix matches first, then substring."""
    all_drugs = get_all_drug_names()
    q = query.strip().lower()
    if not q:
        return []

    prefix = []
    contains = []
    for drug in all_drugs:
        dl = drug.lower()
        if dl.startswith(q):
            prefix.append(drug)
        elif q in dl:
            contains.append(drug)

    return (prefix + contains)[:limit]

def save_vitamin_assessment(
    user_id: str,
    drugs: list,
    symptoms: list,
    predictions: list,
    pair_details: list
) -> dict:
    """Persist the latest vitamin deficiency assessment for the user."""
    db = get_db()
    
    # Fetch user profile to maintain referential integrity
    user_profile = {}
    doc = db.collection(USERS_COLLECTION).document(user_id).get()
    if doc.exists:
        user_profile = doc.to_dict()
        
    timestamp = datetime.utcnow().isoformat()
    
    patient_data = {
        "firstName": user_profile.get("firstName"),
        "lastName": user_profile.get("lastName"),
        "displayName": user_profile.get("displayName"),
        "email": user_profile.get("email"),
        "photoURL": user_profile.get("photoURL"),
    }
    
    payload = {
        "userId": user_id,
        "user": patient_data,
        "inputDrugs": drugs,
        "inputSymptoms": symptoms,
        "predictions": predictions,
        "pairDetails": pair_details,
        "updatedAt": timestamp,
    }
    
    # Upsert: use user_id as the document ID to guarantee 1-to-1 mapping
    doc_ref = db.collection(VITAMIN_COLLECTION).document(user_id)
    doc = doc_ref.get()
    
    if doc.exists:
        created_at = doc.to_dict().get("createdAt")
        payload["createdAt"] = created_at or timestamp
    else:
        payload["createdAt"] = timestamp
        
    doc_ref.set(payload)
    
    payload["id"] = doc_ref.id
    return payload

def get_vitamin_assessment(user_id: str) -> dict:
    """Retrieve the latest vitamin deficiency assessment for a user."""
    db = get_db()
    doc = db.collection(VITAMIN_COLLECTION).document(user_id).get()
    
    if not doc.exists:
        return None
    
    data = doc.to_dict()
    data["id"] = doc.id
    return data
