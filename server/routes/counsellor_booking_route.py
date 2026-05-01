from flask import Blueprint
from controllers.counsellor_booking_controller import book_counsellor

counsellor_booking_bp = Blueprint('counsellor_booking', __name__, url_prefix='/api')

@counsellor_booking_bp.route('/book-counsellor', methods=['POST'])
def book():
    """Book a counsellor and save the questionnaire"""
    return book_counsellor()
