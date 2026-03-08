from flask import Blueprint
from controllers.advice_history_controller import save_advice_history, get_advice_history, delete_advice_history

advice_history_bp = Blueprint('advice_history', __name__, url_prefix='/api')

@advice_history_bp.route('/save-advice', methods=['POST'])
def save_advice():
    """Save a piece of advice to history"""
    return save_advice_history()

@advice_history_bp.route('/patient-advice-history', methods=['GET'])
def get_history():
    """Get all advice history for a patient"""
    return get_advice_history()

@advice_history_bp.route('/patient-advice-history/<advice_id>', methods=['DELETE'])
def delete_advice(advice_id):
    """Delete a specific advice record"""
    return delete_advice_history(advice_id)
