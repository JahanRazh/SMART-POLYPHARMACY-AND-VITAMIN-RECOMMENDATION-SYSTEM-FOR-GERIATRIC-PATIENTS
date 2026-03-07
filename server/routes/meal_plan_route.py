from flask import Blueprint, jsonify
from datetime import datetime

from controllers.meal_plan_controller import (
    create_meal_plan,
    get_latest_assessment,
    track_meal_consumption
)

meal_plan_bp = Blueprint(
    "meal_plan_bp",
    __name__,
    url_prefix="/api/meal-plans"
)

meal_plan_bp.add_url_rule(
    "",
    view_func=create_meal_plan,
    methods=["POST"]
)

meal_plan_bp.add_url_rule(
    "/",
    view_func=create_meal_plan,
    methods=["POST"]
)

@meal_plan_bp.route("/latest", methods=["GET"])
def get_latest():
    return get_latest_assessment()

@meal_plan_bp.route("/track", methods=["POST"])
def track_consumption():
    return track_meal_consumption()

@meal_plan_bp.route("/test", methods=["GET"])
def test_endpoint():
    return jsonify({
        "status": "success",
        "message": "Meal plan API is working",
        "timestamp": datetime.utcnow().isoformat()
    }), 200
