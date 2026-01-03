from flask import Blueprint

from controllers.polyphamacy_risk_contoller import analyze_polypharmacy, search_drugs

polypharmacy_bp = Blueprint("polypharmacy_bp", __name__, url_prefix="/api/polypharmacy")

polypharmacy_bp.add_url_rule("/analyze", view_func=analyze_polypharmacy, methods=["POST"])
polypharmacy_bp.add_url_rule("/drugs/search", view_func=search_drugs, methods=["GET"])
