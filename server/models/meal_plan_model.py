from datetime import datetime
from typing import Dict
from db import get_db

MEAL_PLAN_COLLECTION = "meal_plans"


def save_meal_plan(
    meal_data: Dict,
) -> Dict:
    """
    Persist meal plan assessment in Firestore
    """
    db = get_db()
    doc_ref = db.collection(MEAL_PLAN_COLLECTION).document()
    timestamp = datetime.utcnow().isoformat()

    payload = {
        # ---------- FORM SECTIONS ----------
        "basicProfile": meal_data.get("basicProfile", {}),
        "medicalConditions": meal_data.get("medicalConditions", {}),
        "vitaminDeficiencies": meal_data.get("vitaminDeficiencies", []),
        "dietaryRestrictions": meal_data.get("dietaryRestrictions", {}),
        "mealTimings": meal_data.get("mealTimings", {}),
        "preferences": meal_data.get("preferences", {}),

        # ---------- META ----------
        "createdAt": timestamp,
        "updatedAt": timestamp,
        "status": "active",
        "source": "meal_details_form",
    }

    doc_ref.set(payload)
    payload["id"] = doc_ref.id
    return payload


def fetch_meal_plan(meal_plan_id: str) -> Dict:
    db = get_db()
    doc = db.collection(MEAL_PLAN_COLLECTION).document(meal_plan_id).get()

    if not doc.exists:
        return None

    data = doc.to_dict()
    data["id"] = doc.id
    return data


def update_meal_plan_data(meal_plan_id: str, updates: Dict) -> Dict:
    db = get_db()
    doc_ref = db.collection(MEAL_PLAN_COLLECTION).document(meal_plan_id)

    if not doc_ref.get().exists:
        return None

    updates["updatedAt"] = datetime.utcnow().isoformat()
    doc_ref.update(updates)

    data = doc_ref.get().to_dict()
    data["id"] = meal_plan_id
    return data


def delete_meal_plan_data(meal_plan_id: str) -> bool:
    db = get_db()
    doc_ref = db.collection(MEAL_PLAN_COLLECTION).document(meal_plan_id)

    if not doc_ref.get().exists:
        return False

    doc_ref.delete()
    return True