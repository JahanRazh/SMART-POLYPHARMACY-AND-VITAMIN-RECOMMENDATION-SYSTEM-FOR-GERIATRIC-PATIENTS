from flask import Blueprint, jsonify, request

personal_details_bp = Blueprint(
    "personal_details",
    __name__,
    url_prefix="/api/personal-details"
)

def _db():
    """
    Lazy-import get_db from app.py to avoid circular imports.
    Must return a Firestore client.
    """
    from app import get_db  # lazy import prevents circular import on module load
    return get_db()

@personal_details_bp.route("", methods=["GET"])
def list_personal_details():
    try:
        db = _db()
        docs = db.collection("personal_details").stream()
        items = []
        for doc in docs:
            data = doc.to_dict() or {}
            data["id"] = doc.id
            items.append(data)
        return jsonify({"data": items, "count": len(items), "storage": "firestore"}), 200
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@personal_details_bp.route("", methods=["POST"])
def create_personal_detail():
    try:
        payload = request.get_json(silent=True) or {}
        required = ["firstName", "lastName", "age", "email"]
        missing = [f for f in required if f not in payload]
        if missing:
            return jsonify({"error": "Missing fields", "fields": missing}), 400

        db = _db()
        # add returns (write_result, doc_ref) in many SDK versions
        result = db.collection("personal_details").add(payload)
        # normalize whether add returned a tuple or a doc_ref
        doc_ref = result[1] if isinstance(result, (list, tuple)) and len(result) > 1 else result
        created = doc_ref.get()
        data = created.to_dict() or {}
        data["id"] = created.id
        return jsonify({"message": "Personal detail created successfully", "data": data, "storage": "firestore"}), 201
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@personal_details_bp.route("/<doc_id>", methods=["GET"])
def get_personal_detail(doc_id: str):
    try:
        db = _db()
        doc = db.collection("personal_details").document(doc_id).get()
        if not doc.exists:
            return jsonify({"error": "Document not found"}), 404
        data = doc.to_dict() or {}
        data["id"] = doc.id
        return jsonify({"data": data, "storage": "firestore"}), 200
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@personal_details_bp.route("/<doc_id>", methods=["PUT", "PATCH"])
def update_personal_detail(doc_id: str):
    try:
        payload = request.get_json(silent=True) or {}
        if not payload:
            return jsonify({"error": "Empty request body"}), 400

        db = _db()
        ref = db.collection("personal_details").document(doc_id)
        if not ref.get().exists:
            return jsonify({"error": "Document not found"}), 404
        ref.update(payload)
        updated = ref.get()
        data = updated.to_dict() or {}
        data["id"] = updated.id
        return jsonify({"message": "Document updated successfully", "data": data, "storage": "firestore"}), 200
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@personal_details_bp.route("/<doc_id>", methods=["DELETE"])
def delete_personal_detail(doc_id: str):
    try:
        db = _db()
        ref = db.collection("personal_details").document(doc_id)
        if not ref.get().exists:
            return jsonify({"error": "Document not found"}), 404
        ref.delete()
        return jsonify({"message": "Document deleted successfully", "id": doc_id, "storage": "firestore"}), 200
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500
