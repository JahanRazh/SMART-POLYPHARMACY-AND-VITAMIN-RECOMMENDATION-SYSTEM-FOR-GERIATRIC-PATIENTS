from flask import request, jsonify
from db import get_db
import datetime

def book_counsellor():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        patient_id = data.get('patientId') or data.get('email')
        if not patient_id:
            return jsonify({"error": "patientId or email is required"}), 400
            
        counsellor_id = data.get('counsellor_id')
        questionnaire = data.get('questionnaire', {})
        
        db = get_db()
        booking_ref = db.collection('counsellor_bookings').document()
        
        booking_data = {
            "id": booking_ref.id,
            "patientId": patient_id,
            "counsellor_id": counsellor_id,
            "questionnaire": questionnaire,
            "status": "pending",
            "booked_at": datetime.datetime.now().isoformat()
        }
        
        booking_ref.set(booking_data)
        
        return jsonify({
            "message": "Booking successful",
            "booking": booking_data
        }), 201
        
    except Exception as e:
        print(f"Error booking counsellor: {e}")
        return jsonify({"error": str(e)}), 500
