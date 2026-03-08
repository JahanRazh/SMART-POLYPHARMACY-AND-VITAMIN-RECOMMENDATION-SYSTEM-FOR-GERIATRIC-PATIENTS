from typing import Dict, Any
from datetime import datetime
import uuid

from db import get_db


MEAL_PLAN_COLLECTION = "meal_plans"

def delete_meal_plan_for_user(user_id: str) -> Dict:
    """
    Delete the meal plan and assessment for a user from BOTH Firestore collections.
    Returns a dict with status info.
    """
    db = get_db()
    results = {}

    # Delete from meal_plans (assessment/form data)
    try:
        ref = db.collection(MEAL_PLAN_COLLECTION).document(user_id)
        if ref.get().exists:
            ref.delete()
            results["meal_plans"] = "deleted"
            print(f"✅ Deleted meal_plans document for user {user_id}")
        else:
            results["meal_plans"] = "not_found"
    except Exception as e:
        results["meal_plans"] = f"error: {e}"
        print(f"❌ Error deleting meal_plans for {user_id}: {e}")

    # Delete from saved_meal_plans (generated plan)
    try:
        ref2 = db.collection("saved_meal_plans").document(user_id)
        if ref2.get().exists:
            ref2.delete()
            results["saved_meal_plans"] = "deleted"
            print(f"✅ Deleted saved_meal_plans document for user {user_id}")
        else:
            results["saved_meal_plans"] = "not_found"
    except Exception as e:
        results["saved_meal_plans"] = f"error: {e}"
        print(f"❌ Error deleting saved_meal_plans for {user_id}: {e}")

    return results


def save_meal_plan_assessment(meal_data: Dict) -> Dict:
    """
    Persist meal plan assessment in Firestore (full form data)
    Upserts a single assessment per user.
    """
    db = get_db()
    user_id = meal_data.get("userId")
    if not user_id:
        raise ValueError("userId is required to save assessment")

    doc_ref = db.collection(MEAL_PLAN_COLLECTION).document(user_id)
    timestamp = datetime.utcnow().isoformat()
    
    existing = doc_ref.get()
    created_at = existing.to_dict().get("createdAt") if existing.exists else timestamp

    payload = {
        "userId": user_id,
        "user": meal_data.get("user", {}),
        "polypharmacyRisk": meal_data.get("polypharmacyRisk", "N/A"),
        "basicProfile": meal_data.get("basicProfile", {}),
        "medicalConditions": meal_data.get("medicalConditions", {}),
        "vitaminDeficiencies": meal_data.get("vitaminDeficiencies", []),
        "dietaryRestrictions": meal_data.get("dietaryRestrictions", {}),
        "createdAt": created_at,
        "updatedAt": timestamp,
        "status": "active",
        "source": "meal_details_form",
    }

    doc_ref.set(payload)
    payload["id"] = doc_ref.id
    return payload

def fetch_meal_tracking(user_id: str, plan_id: str) -> list:
    """
    Retrieve all tracking logs for a specific plan and user.
    """
    db = get_db()
    try:
        docs = db.collection("meal_tracking_logs") \
                 .where("userId", "==", user_id) \
                 .where("planId", "==", plan_id) \
                 .stream()
        
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        print(f"❌ Error fetching meal tracking: {e}")
        return []

def save_generated_meal_plan(result: Dict[str, Any], form_id: str) -> bool:
    """
    Save the entire generated meal plan result directly.
    Upserts a single saved plan per user.
    """
    try:
        db = get_db()
        user_id = result.get("userId")
        if not user_id:
            print("❌ userId is missing for save_generated_meal_plan")
            return False

        doc_ref = db.collection("saved_meal_plans").document(user_id)
        timestamp = datetime.utcnow().isoformat()

        # Preserve original createdAt if the document already exists (upsert)
        existing_doc = doc_ref.get()
        created_at = existing_doc.to_dict().get("createdAt") if existing_doc.exists else timestamp
        
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
            "patientAge": str(result.get("patient_age") or result.get("basicProfile", {}).get("age", "N/A")),
            "patientGender": result.get("patient_gender") or result.get("basicProfile", {}).get("gender", "N/A"),
            "height": str(result.get("height") or result.get("basicProfile", {}).get("height", "N/A")),
            "weight": str(result.get("weight") or result.get("basicProfile", {}).get("weight", "N/A")),
            "activityLevel": result.get("activity_level") or result.get("basicProfile", {}).get("activityLevel", "N/A"),
            "plan_duration": result.get("plan_duration") or "1 Month",
            "bmi": result.get("bmi", 0),
            "bmiCategory": result.get("bmi_category", ""),
            "bmiAdvice": result.get("bmi_advice", ""),
            "dailyCalorieRange": result.get("daily_calorie_range", ""),
            "vitamin_deficiencies": result.get("vitamin_deficiencies", []),
            # Plan snapshot
            "selectedDay": "Full 7-Day Plan",
            "totalCalories": first_day_data.get("total_calories", 0),
            "numberOfMeals": len(first_day_data.get("meals", [])),
            "timestamp": timestamp,
        }
        
        # Prepare the full basicProfile for mirroring
        # We favor result['basicProfile'] but supplement with AI-calculated fields if available
        src_profile = result.get("basicProfile", {})
        
        basic_profile = {
            "name": src_profile.get("name") or result.get("patient_name") or "Unknown Patient",
            "age": str(src_profile.get("age") or result.get("patient_age") or "N/A"),
            "gender": src_profile.get("gender") or result.get("patient_gender") or "N/A",
            "height": str(src_profile.get("height") or result.get("height") or "N/A"),
            "weight": str(src_profile.get("weight") or result.get("weight") or "N/A"),
            "bmi": str(src_profile.get("bmi") or result.get("bmi") or "N/A"),
            "bmiLevel": result.get("bmi_category") or src_profile.get("bmiLevel") or "N/A",
            "activityLevel": src_profile.get("activityLevel") or result.get("activity_level") or "N/A"
        }

        payload = {
            "userId": user_id,
            "user": result.get("user", {}),
            "polypharmacyRisk": result.get("polypharmacyRisk", "N/A"),
            "basicProfile": basic_profile,
            "medicalConditions": result.get("medicalConditions", {}),
            "dietaryRestrictions": result.get("dietaryRestrictions", {}),
            "vitaminDeficiencies": result.get("vitaminDeficiencies", []),
            "conditions": result.get("conditions", []),
            "daily_calorie_range": result.get("daily_calorie_range", "N/A"),
            "plan_duration": result.get("plan_duration") or "1 Month",
            "selectedPlan": selected_plan,
            "mealPlanOptions": result.get("mealPlanOptions", []),
            "originalPlanId": form_id or "unknown",
            "formDataSaved": True if form_id else False,
            "createdAt": created_at,
            "updatedAt": timestamp,
            "status": "active",
            "source": "meal_details_form"
        }
        
        doc_ref.set(payload)
        print(f"✅ Generated meal plan natively saved (upserted) for user {user_id}")
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
    doc = db.collection(MEAL_PLAN_COLLECTION).document(user_id).get()

    if not doc.exists:
        return None

    data = doc.to_dict()
    data["id"] = doc.id
    return data

def fetch_saved_meal_plan(user_id: str) -> Dict:
    """
    Fetch the active saved meal plan for a given user.
    """
    db = get_db()
    doc = db.collection("saved_meal_plans").document(user_id).get()

    if not doc.exists:
        return None

    data = doc.to_dict()
    data["id"] = doc.id
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