from flask import Flask, jsonify, request
from flask_cors import CORS

# Firebase Admin / Firestore
import firebase_admin
from firebase_admin import credentials, firestore

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}})


def get_db():
    """Initialize Firestore client once and reuse."""
    if not firebase_admin._apps:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
    return firestore.client()


@app.route("/")
def home():
    return "Smart PolyCare Flask API is running"


# ---------------------------
# Personal Details CRUD (Firestore: collection `personal_details`)
# ---------------------------

@app.route("/api/personal-details", methods=["GET"])  # list all
def list_personal_details():
    db = get_db()
    docs = db.collection("personal_details").stream()
    items = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        items.append(data)
    return jsonify(items), 200


@app.route("/api/personal-details", methods=["POST"])  # create
def create_personal_detail():
    payload = request.get_json(silent=True) or {}
    required_fields = ["firstName", "lastName", "age", "email"]
    missing = [f for f in required_fields if f not in payload]
    if missing:
        return jsonify({"error": "Missing fields", "fields": missing}), 400

    db = get_db()
    doc_ref = db.collection("personal_details").add(payload)[1]
    created = doc_ref.get()
    data = created.to_dict() or {}
    data["id"] = created.id
    return jsonify(data), 201


@app.route("/api/personal-details/<doc_id>", methods=["GET"])  # read one
def get_personal_detail(doc_id: str):
    db = get_db()
    doc = db.collection("personal_details").document(doc_id).get()
    if not doc.exists:
        return jsonify({"error": "Not found"}), 404
    data = doc.to_dict() or {}
    data["id"] = doc.id
    return jsonify(data), 200


@app.route("/api/personal-details/<doc_id>", methods=["PUT", "PATCH"])  # update
def update_personal_detail(doc_id: str):
    payload = request.get_json(silent=True) or {}
    if not payload:
        return jsonify({"error": "Empty body"}), 400
    db = get_db()
    ref = db.collection("personal_details").document(doc_id)
    if not ref.get().exists:
        return jsonify({"error": "Not found"}), 404
    ref.update(payload)
    updated = ref.get()
    data = updated.to_dict() or {}
    data["id"] = updated.id
    return jsonify(data), 200


@app.route("/api/personal-details/<doc_id>", methods=["DELETE"])  # delete
def delete_personal_detail(doc_id: str):
    db = get_db()
    ref = db.collection("personal_details").document(doc_id)
    if not ref.get().exists:
        return jsonify({"error": "Not found"}), 404
    ref.delete()
    return jsonify({"ok": True, "id": doc_id}), 200


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
