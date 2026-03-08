from flask import jsonify, request
from db import get_db
from datetime import datetime
import uuid

def save_advice_history():
    """
    Save a piece of advice to the patient's advice history.
    
    Request body:
    {
        "email": "patient@example.com",
        "week_1": [...],
        "week_2": [...],
        "summary": "...",
        "generated_date": "2026-03-08T10:30:00",
        "expires_date": "2026-03-15T10:30:00",
        "inputs": { "emotion": "...", ... }
    }
    """
    data = request.get_json()
    email = data.get("email")
    
    if not email:
        return jsonify({"message": "email is required"}), 400
    
    db = get_db()
    email_lower = email.lower().strip()
    
    # Create unique advice ID
    advice_id = str(uuid.uuid4())
    
    # Prepare advice document
    advice_doc = {
        "id": advice_id,
        "email": email_lower,
        "week_1": data.get("week_1", []),
        "week_2": data.get("week_2", []),
        "summary": data.get("summary", ""),
        "generated_date": data.get("generated_date"),
        "expires_date": data.get("expires_date"),
        "inputs": data.get("inputs", {}),
        "saved_at": datetime.now().strftime('%Y-%m-%dT%H:%M:%S'),
    }
    
    try:
        # Save to advice_history collection
        db.collection("advice_history").document(advice_id).set(advice_doc)
        
        print(f"✅ Saved advice {advice_id} for {email_lower}")
        return jsonify({
            "message": "Advice saved successfully",
            "advice_id": advice_id
        }), 201
    except Exception as e:
        print(f"❌ Error saving advice: {e}")
        return jsonify({"message": "Failed to save advice", "error": str(e)}), 500


def get_advice_history():
    """
    Fetch all advice history for a patient.
    
    Query params:
    - email or patientId: Patient identifier
    """
    email = request.args.get("email") or request.args.get("patientId")
    
    if not email:
        return jsonify({"message": "email or patientId query param is required"}), 400
    
    db = get_db()
    email_lower = email.lower().strip()
    
    try:
        # Query advice_history collection for this email
        # Note: order_by with where may require composite index, so we'll sort in Python
        query = db.collection("advice_history").where("email", "==", email_lower).get()
        
        advice_list = []
        for doc in query:
            advice_list.append(doc.to_dict())
        
        # Sort by saved_at in descending order (most recent first)
        advice_list.sort(key=lambda x: x.get("saved_at", ""), reverse=True)
        
        print(f"✅ Found {len(advice_list)} advice records for {email_lower}")
        return jsonify({"advice_history": advice_list}), 200
    except Exception as e:
        print(f"❌ Error fetching advice history: {e}")
        return jsonify({"message": "Failed to fetch advice history", "error": str(e)}), 500


def delete_advice_history(advice_id):
    """
    Delete a specific advice record.
    
    URL params:
    - advice_id: The ID of the advice to delete
    
    Query params:
    - email: Patient email (for verification)
    """
    email = request.args.get("email")
    
    if not advice_id or not email:
        return jsonify({"message": "advice_id and email query params are required"}), 400
    
    db = get_db()
    email_lower = email.lower().strip()
    
    try:
        # Verify the advice belongs to this user
        doc = db.collection("advice_history").document(advice_id).get()
        
        if not doc.exists:
            return jsonify({"message": "Advice not found"}), 404
        
        advice_data = doc.to_dict()
        if advice_data.get("email") != email_lower:
            return jsonify({"message": "Unauthorized"}), 403
        
        # Delete the advice
        db.collection("advice_history").document(advice_id).delete()
        
        print(f"✅ Deleted advice {advice_id} for {email_lower}")
        return jsonify({"message": "Advice deleted successfully"}), 200
    except Exception as e:
        print(f"❌ Error deleting advice: {e}")
        return jsonify({"message": "Failed to delete advice", "error": str(e)}), 500
