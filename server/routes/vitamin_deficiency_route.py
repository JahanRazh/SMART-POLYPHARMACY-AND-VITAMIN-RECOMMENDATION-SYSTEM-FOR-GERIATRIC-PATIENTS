from flask import Blueprint

from controllers.Vitamin_deficiency_Controller import (
    predict_deficiency,
    get_drugs,
    get_symptoms,
    get_assessment,
)

vitamin_deficiency_bp = Blueprint(
    "vitamin_deficiency_bp", __name__, url_prefix="/api/vitamin-deficiency"
)

vitamin_deficiency_bp.add_url_rule("/predict", view_func=predict_deficiency, methods=["POST"])
vitamin_deficiency_bp.add_url_rule("/drugs", view_func=get_drugs, methods=["GET"])
vitamin_deficiency_bp.add_url_rule("/symptoms", view_func=get_symptoms, methods=["GET"])
vitamin_deficiency_bp.add_url_rule("/assessment", view_func=get_assessment, methods=["GET"])
