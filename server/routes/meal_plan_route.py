from flask import Blueprint
from controllers.meal_plan_controller import create_meal_plan
from controllers.meal_plan_controller import save_selected_meal_plan


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

meal_plan_bp.add_url_rule(
    "/save",
    view_func=save_selected_meal_plan,
    methods=["POST"]
)
