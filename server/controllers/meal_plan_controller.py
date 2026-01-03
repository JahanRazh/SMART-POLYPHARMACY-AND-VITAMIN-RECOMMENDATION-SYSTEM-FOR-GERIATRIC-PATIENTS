from flask import request, jsonify
from models.meal_plan_model import save_meal_plan

REQUIRED_KEYS = [
    "basicProfile",
    "medicalConditions",
    "vitaminDeficiencies",
    "dietaryRestrictions",
    "mealTimings",
    "preferences",
]


def create_meal_plan():
    payload = request.get_json(silent=True) or {}

    # Validate required sections
    for key in REQUIRED_KEYS:
        if key not in payload:
            return jsonify({"message": f"{key} is required"}), 400

    # Validate name exists in basicProfile
    basic_profile = payload.get("basicProfile", {})
    if not basic_profile.get("name"):
        return jsonify({"message": "name is required in basicProfile"}), 400

    # Type safety
    if not isinstance(payload.get("medicalConditions"), dict):
        return jsonify({"message": "medicalConditions must be an object"}), 400

    if not isinstance(payload.get("vitaminDeficiencies"), list):
        return jsonify({"message": "vitaminDeficiencies must be a list"}), 400

    if not isinstance(payload.get("dietaryRestrictions"), dict):
        return jsonify({"message": "dietaryRestrictions must be an object"}), 400

    try:
        meal_plan = save_meal_plan(payload)
    except Exception as e:
        return jsonify({"message": f"Unable to save meal plan: {str(e)}"}), 500

    return jsonify({
        "mealPlanId": meal_plan.get("id"),
        "basicProfile": meal_plan.get("basicProfile"),
        "medicalConditions": meal_plan.get("medicalConditions"),
        "vitaminDeficiencies": meal_plan.get("vitaminDeficiencies"),
        "dietaryRestrictions": meal_plan.get("dietaryRestrictions"),
        "mealTimings": meal_plan.get("mealTimings"),
        "preferences": meal_plan.get("preferences"),
        "createdAt": meal_plan.get("createdAt"),
        "updatedAt": meal_plan.get("updatedAt"),
        "status": meal_plan.get("status"),
        "source": meal_plan.get("source"),
    }), 201