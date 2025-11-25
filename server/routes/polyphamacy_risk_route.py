from flask import Blueprint

from controllers.polyphamacy_risk_contoller import analyze_polypharmacy

polypharmacy_bp = Blueprint("polypharmacy_bp", __name__, url_prefix="/api/polypharmacy")

polypharmacy_bp.add_url_rule("/analyze", view_func=analyze_polypharmacy, methods=["POST"])
