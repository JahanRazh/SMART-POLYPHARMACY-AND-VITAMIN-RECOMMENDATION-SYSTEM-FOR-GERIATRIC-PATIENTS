from flask import request, jsonify
from MealPlan.meal_logic import generate_full_meal_plan
from models.meal_plan_model import save_meal_plan

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

    # ---------------- CALL MEAL LOGIC ----------------
    try:
        result = generate_full_meal_plan(payload)
        return jsonify(result), 200

    except Exception as e:
        print("❌ Controller error:", e)
        return jsonify({"error": str(e)}), 500
    
def save_selected_meal_plan():
    payload = request.get_json(silent=True) or {}

    saved = save_meal_plan(payload)

    return jsonify({
        "success": True,
        "message": "Meal plan saved successfully",
        "data": saved
    }), 200
