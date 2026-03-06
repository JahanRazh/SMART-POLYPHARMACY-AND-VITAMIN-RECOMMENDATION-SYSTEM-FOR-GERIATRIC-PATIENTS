from typing import Dict, Any
from datetime import datetime
import uuid

from db import get_db


MEAL_PLAN_COLLECTION = "meal_plans"

def save_meal_plan_assessment(meal_data: Dict) -> Dict:
    """
    Persist meal plan assessment in Firestore (full form data)
    """
    db = get_db()
    doc_ref = db.collection(MEAL_PLAN_COLLECTION).document()
    timestamp = datetime.utcnow().isoformat()

    payload = {
        # ---------- FORM SECTIONS ----------
        "userId": meal_data.get("userId"),
        "basicProfile": meal_data.get("basicProfile", {}),
        "medicalConditions": meal_data.get("medicalConditions", {}),
        "vitaminDeficiencies": meal_data.get("vitaminDeficiencies", []),
        "dietaryRestrictions": meal_data.get("dietaryRestrictions", {}),

        # ---------- META ----------
        "createdAt": timestamp,
        "updatedAt": timestamp,
        "status": "active",
        "source": "meal_details_form",
    }

    doc_ref.set(payload)
    payload["id"] = doc_ref.id
    return payload

def save_generated_meal_plan(result: Dict[str, Any], form_id: str) -> bool:
    """
    Save the entire generated meal plan result directly, mimicking the legacy frontend structure.
    """
    try:
        db = get_db()
        doc_ref = db.collection("saved_meal_plans").document()
        timestamp = datetime.utcnow().isoformat()
        
        # Format payload precisely to match old structure
        options = result.get("mealPlanOptions", [])
        selected_option = options[0] if options else {}
        
        first_day_data = selected_option.get("weeklyPlan", {}).get("Day 1", {})
        
        selected_plan = {
            # Option details
            **selected_option,
            "name": selected_option.get("name", "Generated Plan"),
            # Patient details
            "patientName": result.get("patient_name", "Unknown Patient"),
            "patientAge": result.get("basicProfile", {}).get("age", "N/A"),
            "patientGender": result.get("basicProfile", {}).get("gender", "N/A"),
            "bmi": result.get("bmi", 0),
            "bmiCategory": result.get("bmi_category", ""),
            "bmiAdvice": result.get("bmi_advice", ""),
            "dailyCalorieRange": result.get("daily_calorie_range", ""),
            # Plan snapshot
            "selectedDay": "Full 7-Day Plan",
            "totalCalories": first_day_data.get("total_calories", 0),
            "numberOfMeals": len(first_day_data.get("meals", [])),
            "timestamp": timestamp,
        }
        
        payload = {
            "userId": result.get("userId"),
            "selectedPlan": selected_plan,
            "originalPlanId": form_id or "unknown",
            "formDataSaved": True if form_id else False,
            "createdAt": timestamp,
        }
        
        doc_ref.set(payload)
        print(f"✅ Generated meal plan natively saved with ID: {doc_ref.id} into saved_meal_plans")
        return True
        
    except Exception as e:
        print(f"❌ Error in save_generated_meal_plan: {e}")
        return False

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

def fetch_latest_meal_plan_assessment(user_id: str) -> Dict:
    """
    Fetch the most recent meal plan assessment for a given user.
    """
    db = get_db()
    docs = (
        db.collection(MEAL_PLAN_COLLECTION)
        .where("userId", "==", user_id)
        .order_by("createdAt", direction="DESCENDING")
        .limit(1)
        .get()
    )

    if not docs:
        return None

    data = docs[0].to_dict()
    data["id"] = docs[0].id
    return data

def save_meal_tracking(tracking_data: Dict) -> Dict:
    """
    Save daily meal tracking progress (consumed foods).
    """
    db = get_db()
    doc_ref = db.collection("meal_tracking_logs").document()
    timestamp = datetime.utcnow().isoformat()
    
    payload = {
        "userId": tracking_data.get("userId"),
        "planId": tracking_data.get("planId"),
        "day": tracking_data.get("day"),
        "consumedMeals": tracking_data.get("consumedMeals", []), 
        "timestamp": timestamp,
        "date": tracking_data.get("date", timestamp.split('T')[0])
    }
    
    doc_ref.set(payload)
    payload["id"] = doc_ref.id
    return payload