from flask import Blueprint, jsonify, request
from datetime import datetime

patients_details_bp = Blueprint(
    "patients_details",
    __name__,
    url_prefix="/api/patients_details"
)

def _db():
    """
    Lazy-import get_db from app.py to avoid circular imports.
    Must return a Firestore client.
    """
    from app import get_db
    return get_db()

def _serialize_doc(doc):
    """Convert Firestore document to dict with serialized timestamps"""
    data = doc.to_dict() or {}
    data["id"] = doc.id
    
    # Convert datetime and Firestore Timestamp objects to ISO format strings
    for key, value in data.items():
        if isinstance(value, datetime):
            data[key] = value.isoformat()
        elif hasattr(value, 'timestamp'):  # Firestore Timestamp
            try:
                # Convert Firestore Timestamp to datetime then to ISO string
                dt = value.to_datetime() if hasattr(value, 'to_datetime') else datetime.fromtimestamp(value.timestamp())
                data[key] = dt.isoformat()
            except:
                try:
                    data[key] = value.isoformat()
                except:
                    data[key] = str(value)
    
    return data

@patients_details_bp.route("", methods=["GET"])
def list_patients_details():
    try:
        db = _db()
        user_id = request.args.get('userId')
        
        if user_id:
            # Get patients for a specific user
            docs = db.collection("patients").where("userId", "==", user_id).stream()
        else:
            # Get all patients (admin use)
            docs = db.collection("patients").stream()
        
        items = []
        for doc in docs:
            items.append(_serialize_doc(doc))
        return jsonify({"data": items, "count": len(items), "storage": "firestore"}), 200
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@patients_details_bp.route("", methods=["POST"])
def create_patients_details():
    try:
        payload = request.get_json(silent=True) or {}
        required = ["firstName", "lastName", "userId"]
        missing = [f for f in required if f not in payload]
        if missing:
            return jsonify({"error": "Missing required fields", "fields": missing}), 400

        db = _db()
        # Add timestamp
        from datetime import datetime
        payload["createdAt"] = datetime.now()
        payload["updatedAt"] = datetime.now()
        
        result = db.collection("patients").add(payload)
        doc_ref = result[1] if isinstance(result, (list, tuple)) and len(result) > 1 else result
        created = doc_ref.get()
        data = _serialize_doc(created)
        return jsonify({"message": "Patient data created successfully", "data": data, "storage": "firestore"}), 201
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@patients_details_bp.route("/<doc_id>", methods=["GET"])
def get_patients_details(doc_id: str):
    try:
        db = _db()
        doc = db.collection("patients").document(doc_id).get()
        if not doc.exists:
            return jsonify({"error": "Patient not found"}), 404
        data = _serialize_doc(doc)
        return jsonify({"data": data, "storage": "firestore"}), 200
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@patients_details_bp.route("/<doc_id>", methods=["PUT", "PATCH"])
def update_patients_details(doc_id: str):
    try:
        payload = request.get_json(silent=True) or {}
        if not payload:
            return jsonify({"error": "Empty request body"}), 400

        db = _db()
        ref = db.collection("patients").document(doc_id)
        if not ref.get().exists:
            return jsonify({"error": "Patient not found"}), 404
        
        # Update timestamp
        from datetime import datetime
        payload["updatedAt"] = datetime.now()
        
        ref.update(payload)
        updated = ref.get()
        data = _serialize_doc(updated)
        return jsonify({"message": "Patient data updated successfully", "data": data, "storage": "firestore"}), 200
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@patients_details_bp.route("/<doc_id>", methods=["DELETE"])
def delete_patients_details(doc_id: str):
    try:
        db = _db()
        ref = db.collection("patients").document(doc_id)
        if not ref.get().exists:
            return jsonify({"error": "Patient not found"}), 404
        ref.delete()
        return jsonify({"message": "Patient data deleted successfully", "id": doc_id, "storage": "firestore"}), 200
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@patients_details_bp.route("/user/<user_id>", methods=["GET"])
def get_patients_details_by_user(user_id: str):
    try:
        db = _db()
        docs = db.collection("patients").where("userId", "==", user_id).limit(1).stream()
        items = []
        for doc in docs:
            items.append(_serialize_doc(doc))
        
        if not items:
            return jsonify({"error": "No patient data found for this user"}), 404
        
        return jsonify({"data": items[0], "storage": "firestore"}), 200
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

