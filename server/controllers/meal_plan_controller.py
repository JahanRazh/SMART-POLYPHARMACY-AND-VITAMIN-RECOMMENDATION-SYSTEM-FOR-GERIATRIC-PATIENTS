from flask import request, jsonify
from datetime import datetime
import uuid
import json

from db import get_db
from models.MealPlan.meal_logic import generate_full_meal_plan
from models.meal_plan_model import save_meal_plan_assessment


# ==================================================
# CREATE MEAL PLAN
# ==================================================
def create_meal_plan():
    payload = request.get_json(silent=True) or {}

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

    # ---------------- SAVE FORM DATA ----------------
    saved_form_id = None
    try:
        saved_data = save_meal_plan_assessment(payload)
        saved_form_id = saved_data["id"]
        print(f"✅ Saved form data with ID: {saved_form_id}")
    except Exception as db_error:
        print(f"⚠️ Form save failed: {db_error}")

    # ---------------- GENERATE MEAL PLAN ----------------
    try:
        result = generate_full_meal_plan(payload)

        result["databaseId"] = saved_form_id
        result["formDataSaved"] = bool(saved_form_id)

        return jsonify(result), 200

    except Exception as e:
        print("❌ Controller error:", e)
        return jsonify({"error": str(e)}), 500


# ==================================================
# SAVE SELECTED MEAL PLAN
# ==================================================
def save_selected_meal_plan_controller():
    try:
        payload = request.get_json(silent=True) or {}

        selected_plan = payload.get("selectedPlan")
        original_plan_id = payload.get("originalPlanId")
        form_data_saved = payload.get("formDataSaved", False)

        if not selected_plan:
            return jsonify({
                "success": False,
                "message": "selectedPlan is required"
            }), 400

        db = get_db()
        doc_id = str(uuid.uuid4())

        db.collection("saved_meal_plans").document(doc_id).set({
            "selectedPlan": selected_plan,
            "originalPlanId": original_plan_id,
            "formDataSaved": form_data_saved,
            "createdAt": datetime.utcnow().isoformat()
        })

        return jsonify({
            "success": True,
            "data": {"id": doc_id}
        }), 200

    except Exception as e:
        print("❌ SAVE SELECTED PLAN ERROR:", e)
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
