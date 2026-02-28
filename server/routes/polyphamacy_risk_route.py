from flask import Blueprint

from controllers.polyphamacy_risk_contoller import (
    analyze_polypharmacy,
    search_drugs,
    search_diseases,
    get_latest_assessment,
    clear_assessment,
    update_profile,
)

polypharmacy_bp = Blueprint("polypharmacy_bp", __name__, url_prefix="/api/polypharmacy")

polypharmacy_bp.add_url_rule("/analyze", view_func=analyze_polypharmacy, methods=["POST"])
polypharmacy_bp.add_url_rule("/drugs/search", view_func=search_drugs, methods=["GET"])
polypharmacy_bp.add_url_rule("/diseases/search", view_func=search_diseases, methods=["GET"])
polypharmacy_bp.add_url_rule("/assessment", view_func=get_latest_assessment, methods=["GET"])
polypharmacy_bp.add_url_rule("/assessment", view_func=clear_assessment, methods=["DELETE"])
polypharmacy_bp.add_url_rule("/profile", view_func=update_profile, methods=["PATCH"])
