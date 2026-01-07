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

def save_selected_meal_plan(selected_plan: Dict[str, Any]) -> Dict[str, Any]:
    """
    Save only the selected meal plan option
    """
    try:
        print("=" * 50)
        print("📝 DEBUG: In save_selected_meal_plan model function")
        print(f"📦 Input keys: {list(selected_plan.keys())}")
        
        db = get_db()
        doc_ref = db.collection("selected_meal_plans").document()
        
        timestamp = datetime.utcnow().isoformat()
        
        # Extract data safely
        selected_plan_data = selected_plan.get("selectedPlan", {})
        if not selected_plan_data:
            print("⚠️ WARNING: selectedPlan is empty")
        
        # Prepare the payload
        payload = {
            # Store the entire selectedPlan
            "selectedPlan": selected_plan_data,
            
            # Metadata
            "originalPlanId": selected_plan.get("originalPlanId", "unknown"),
            "formDataSaved": selected_plan.get("formDataSaved", False),
            
            # Timestamps
            "createdAt": timestamp,
            "updatedAt": timestamp,
            
            # Patient info (with defaults)
            "patientName": selected_plan_data.get("patientName", "Unknown"),
            "patientAge": selected_plan_data.get("patientAge", ""),
            "patientGender": selected_plan_data.get("patientGender", ""),
            "bmi": selected_plan_data.get("bmi", 0),
            "bmiCategory": selected_plan_data.get("bmiCategory", "Unknown"),
            
            # Plan info
            "planName": selected_plan_data.get("name", "Unnamed Plan"),
            "optionId": selected_plan_data.get("optionId", 0),
            "selectedDay": selected_plan_data.get("selectedDay", "Day 1"),
            "totalCalories": selected_plan_data.get("totalCalories", 0),
            "numberOfMeals": selected_plan_data.get("numberOfMeals", 0),
            
            # Status
            "status": "active",
            "source": "meal_plan_selection"
        }
        
        print(f"📄 Prepared payload with {len(payload)} fields")
        
        # Save to Firestore
        doc_ref.set(payload)
        
        # Add ID to return data
        payload["id"] = doc_ref.id
        
        print(f"✅ Selected meal plan saved with ID: {doc_ref.id}")
        print(f"📁 Collection: selected_meal_plans")
        print("=" * 50)
        
        return payload
        
    except Exception as e:
        print(f"❌ Error in save_selected_meal_plan model function: {e}")
        import traceback
        traceback.print_exc()
        raise

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