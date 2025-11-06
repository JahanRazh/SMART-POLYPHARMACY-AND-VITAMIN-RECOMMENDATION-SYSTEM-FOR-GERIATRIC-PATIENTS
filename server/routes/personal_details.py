from flask import Blueprint, jsonify, request

# Blueprint
personal_details_bp = Blueprint(
    "personal_details",
    __name__,
    url_prefix="/api/personal-details"
)

# Optional in-memory fallback (dev only, if Firestore not available)
dev_storage = []
next_id = 1

def _db():
    """
    Lazy-import get_db from app.py to avoid circular imports.
    Returns a Firestore client or raises if unavailable.
    """
    from app import get_db  # lazy import prevents circular import on module load
    return get_db()

@personal_details_bp.route("", methods=["GET"])  # list all
def list_personal_details():
    try:
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
            # Fallback to in-memory store (dev)
            return jsonify({"data": dev_storage, "count": len(dev_storage), "storage": "memory"}), 200
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@personal_details_bp.route("", methods=["POST"])  # create
def create_personal_detail():
    try:
        payload = request.get_json(silent=True) or {}
        required = ["firstName", "lastName", "age", "email"]
        missing = [f for f in required if f not in payload]
        if missing:
            return jsonify({"error": "Missing fields", "fields": missing}), 400

        try:
            db = _db()
            _, doc_ref = db.collection("personal_details").add(payload)
            created = doc_ref.get()
            data = created.to_dict() or {}
            data["id"] = created.id
            return jsonify({"message": "Personal detail created successfully", "data": data, "storage": "firestore"}), 201
        except Exception:
            # Fallback to in-memory store (dev)
            global next_id
            new_item = {**payload, "id": str(next_id)}
            dev_storage.append(new_item)
            next_id += 1
            return jsonify({"message": "Personal detail created successfully", "data": new_item, "storage": "memory"}), 201
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@personal_details_bp.route("/<doc_id>", methods=["GET"])  # read one
def get_personal_detail(doc_id: str):
    try:
        try:
            db = _db()
            doc = db.collection("personal_details").document(doc_id).get()
            if not doc.exists:
                return jsonify({"error": "Document not found"}), 404
            data = doc.to_dict() or {}
            data["id"] = doc.id
            return jsonify({"data": data, "storage": "firestore"}), 200
        except Exception:
            # Fallback to in-memory store (dev)
            item = next((it for it in dev_storage if it["id"] == doc_id), None)
            if not item:
                return jsonify({"error": "Document not found"}), 404
            return jsonify({"data": item, "storage": "memory"}), 200
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@personal_details_bp.route("/<doc_id>", methods=["PUT", "PATCH"])  # update
def update_personal_detail(doc_id: str):
    try:
        payload = request.get_json(silent=True) or {}
        if not payload:
            return jsonify({"error": "Empty request body"}), 400

        try:
            db = _db()
            ref = db.collection("personal_details").document(doc_id)
            if not ref.get().exists:
                return jsonify({"error": "Document not found"}), 404
            ref.update(payload)
            updated = ref.get()
            data = updated.to_dict() or {}
            data["id"] = updated.id
            return jsonify({"message": "Document updated successfully", "data": data, "storage": "firestore"}), 200
        except Exception:
            # Fallback to in-memory store (dev)
            idx = next((i for i, it in enumerate(dev_storage) if it["id"] == doc_id), None)
            if idx is None:
                return jsonify({"error": "Document not found"}), 404
            dev_storage[idx].update(payload)
            return jsonify({"message": "Document updated successfully", "data": dev_storage[idx], "storage": "memory"}), 200
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@personal_details_bp.route("/<doc_id>", methods=["DELETE"])  # delete
def delete_personal_detail(doc_id: str):
    try:
        try:
            db = _db()
            ref = db.collection("personal_details").document(doc_id)
            if not ref.get().exists:
                return jsonify({"error": "Document not found"}), 404
            ref.delete()
            return jsonify({"message": "Document deleted successfully", "id": doc_id, "storage": "firestore"}), 200
        except Exception:
            # Fallback to in-memory store (dev)
            idx = next((i for i, it in enumerate(dev_storage) if it["id"] == doc_id), None)
            if idx is None:
                return jsonify({"error": "Document not found"}), 404
            dev_storage.pop(idx)
            return jsonify({"message": "Document deleted successfully", "id": doc_id, "storage": "memory"}), 200
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500
