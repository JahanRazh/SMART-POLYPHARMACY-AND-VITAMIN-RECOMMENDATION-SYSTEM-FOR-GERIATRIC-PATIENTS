from flask import Blueprint
from controllers.advice_controller import create_advice

advice_bp = Blueprint("advice_bp", __name__)


@advice_bp.route("/api/advice", methods=["POST"])
def advice_route():
    return create_advice()
