from flask import request, jsonify
from datetime import datetime
import uuid
import json

from db import get_db
from models.MealPlan.meal_logic import generate_full_meal_plan
from models.meal_plan_model import (
    save_meal_plan_assessment, 
    save_generated_meal_plan,
    fetch_latest_meal_plan_assessment,
    fetch_saved_meal_plan,
    save_meal_tracking,
    delete_meal_plan_for_user
)
from models.polyphamacy_risk_model import get_user_profile, get_polypharmacy_assessment


# ==================================================
# CREATE MEAL PLAN
# ==================================================
def create_meal_plan():
    payload = request.get_json(silent=True) or {}

    # ✅ Extract userId early to ensure it's available throughout
    user_id = payload.get("userId") or payload.get("email")
    if user_id:
        payload["userId"] = user_id  # Ensure it's set in payload

    # ---------------- BASIC VALIDATION ----------------
    if "basicProfile" not in payload:
        return jsonify({"error": "basicProfile is required"}), 400

    basic = payload.get("basicProfile", {})
    bmi = basic.get("bmi")

    if bmi is None:
        return jsonify({"error": "BMI is required"}), 400

    try:
        float(bmi)
    except (TypeError, ValueError):
        return jsonify({"error": "BMI must be a number"}), 400

    # ---------------- USER PROFILE & RISK INTEGRATION ----------------
    user_id = payload.get("userId")
    user_profile = None
    if user_id:
        user_profile = get_user_profile(user_id)
        if user_profile:
            # Add the 'user' object to match requested structure
            payload["user"] = {
                "userId": user_id,
                "displayName": user_profile.get("displayName", ""),
                "email": user_profile.get("email", ""),
                "firstName": user_profile.get("firstName", ""),
                "lastName": user_profile.get("lastName", ""),
                "photoURL": user_profile.get("photoURL", ""),
            }
        
        # Fetch Polypharmacy risk level
        poly_assessment = get_polypharmacy_assessment(user_id)
        if poly_assessment and "riskCalculation" in poly_assessment:
            payload["polypharmacyRisk"] = poly_assessment["riskCalculation"].get("riskLevel", "N/A")
        else:
            payload["polypharmacyRisk"] = "N/A"

    # ---------------- SAVE FORM DATA ----------------
    saved_form_id = None
    db_error_msg = None
    try:
        saved_data = save_meal_plan_assessment(payload)
        saved_form_id = saved_data["id"]
        print(f"✅ Saved form data with ID: {saved_form_id}")
    except Exception as db_error:
        db_error_msg = str(db_error)
        print(f"⚠️ Form save failed: {db_error}")

    # ---------------- GENERATE MEAL PLAN ----------------
    try:
        result = generate_full_meal_plan(payload)

        print(f"DEBUG: Mapping saved_form_id ({saved_form_id}) to result")
        result["databaseId"] = saved_form_id
        result["id"] = saved_form_id
        result["originalPlanId"] = saved_form_id
        result["formDataSaved"] = bool(saved_form_id)
        result["db_error"] = db_error_msg
        
        # Map back user and polypharmacy risk from payload
        if "user" in payload:
            result["user"] = payload["user"]
        if "polypharmacyRisk" in payload:
            result["polypharmacyRisk"] = payload["polypharmacyRisk"]

        # Echo back health assessment details for UI restoration
        result["basicProfile"] = payload.get("basicProfile", {})
        
        med_conditions = payload.get("medicalConditions", {})
        result["conditions"] = [k for k, v in med_conditions.items() if v and k != "other"]
        if med_conditions.get("other"):
            result["conditions"].append(med_conditions["other"])
            
        diet_restrictions = payload.get("dietaryRestrictions", {})
        result["dietary_restrictions"] = [k for k, v in diet_restrictions.items() if v and k != "other"]
        if diet_restrictions.get("other"):
            result["dietary_restrictions"].append(diet_restrictions["other"])
            
        result["vitamin_deficiencies"] = payload.get("vitaminDeficiencies", [])
        # Ensure userId is present for saving
        result["userId"] = payload.get("userId") or payload.get("email")
        
        print(f"DEBUG: Result keys now include: {list(result.keys())}")

        # Add to options for additional redundancy
        for option in result.get("mealPlanOptions", []):
            option["databaseId"] = saved_form_id
            option["id"] = saved_form_id
            option["originalPlanId"] = saved_form_id
        
        # ---------------- SAVE GENERATED MEAL PLAN NATIVELY ----------------
        try:
           save_generated_meal_plan(result, saved_form_id)
        except Exception as save_err:
           print("⚠️ Result save failed:", save_err)

        return jsonify(result), 200

    except Exception as e:
        print("❌ Controller error:", e)
        return jsonify({"error": str(e)}), 500

def get_latest_assessment():
    user_id = request.args.get("userId")
    if not user_id:
        return jsonify({"error": "userId is required"}), 400
    
    try:
        assessment = fetch_latest_meal_plan_assessment(user_id)
        if not assessment:
            return jsonify({"message": "No previous assessment found"}), 404
        
        return jsonify(assessment), 200
    except Exception as e:
        print(f"❌ Error fetching latest assessment: {e}")
        return jsonify({"error": str(e)}), 500

def get_active_meal_plan():
    user_id = request.args.get("userId")
    if not user_id:
        return jsonify({"error": "userId is required"}), 400
    
    try:
        plan = fetch_saved_meal_plan(user_id)
        if not plan:
            return jsonify({"message": "No active meal plan found"}), 404
        
        return jsonify(plan), 200
    except Exception as e:
        print(f"❌ Error fetching active plan: {e}")
        return jsonify({"error": str(e)}), 500

def track_meal_consumption():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Required fields check
        required = ["userId", "planId", "day", "consumedMeals"]
        for field in required:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        result = save_meal_tracking(data)
        return jsonify({
            "status": "success",
            "message": "Meal tracking progress saved",
            "id": result.get("id")
        }), 201
        
    except Exception as e:
        print(f"❌ Error in track_meal_consumption: {e}")
        return jsonify({"error": str(e)}), 500
def delete_meal_plan():
    """
    DELETE /api/meal-plans/delete?userId=<uid>
    Removes the meal plan from both Firestore collections for the given user.
    """
    user_id = request.args.get("userId")
    if not user_id:
        return jsonify({"error": "userId is required"}), 400

    try:
        result = delete_meal_plan_for_user(user_id)
        return jsonify({
            "status": "success",
            "message": "Meal plan deleted successfully",
            "details": result
        }), 200
    except Exception as e:
        print(f"❌ Error in delete_meal_plan: {e}")
        return jsonify({"error": str(e)}), 500

def get_meal_tracking_for_plan():
    user_id = request.args.get("userId")
    plan_id = request.args.get("planId")
    
    if not user_id or not plan_id:
        return jsonify({"error": "userId and planId are required"}), 400
        
    try:
        from models.meal_plan_model import fetch_meal_tracking
        logs = fetch_meal_tracking(user_id, plan_id)
        return jsonify(logs), 200
    except Exception as e:
        print(f"❌ Error in get_meal_tracking_for_plan: {e}")
        return jsonify({"error": str(e)}), 500
