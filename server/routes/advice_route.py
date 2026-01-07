from flask import Blueprint
from controllers.advice_controller import create_advice, get_patient_advice

advice_bp = Blueprint("advice_bp", __name__)


@advice_bp.route("/api/advice", methods=["POST"])
def advice_route():
    return create_advice()


@advice_bp.route("/api/patient-advice", methods=["GET"])
def patient_advice_route():
    return get_patient_advice()
