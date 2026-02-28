from flask import Blueprint

from controllers.patient_advice_controller import patient_advice

# Expose under /api to match frontend client baseURL
advice_bp = Blueprint("advice_bp", __name__, url_prefix="/api")

advice_bp.add_url_rule("/patient-advice", view_func=patient_advice, methods=["GET"])
