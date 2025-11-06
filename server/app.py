from flask import Flask, jsonify, request
from flask_cors import CORS
import os

# Firebase Admin / Firestore
import firebase_admin
from firebase_admin import credentials, firestore

# Import the blueprint
from routes.personal_details import personal_details_bp


def get_db():
    """Initialize Firestore client once and reuse."""
    if not firebase_admin._apps:
        # Get the absolute path to the service account key
        current_dir = os.path.dirname(os.path.abspath(__file__))
        service_account_path = os.path.join(current_dir, "serviceAccountKey.json")
        
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)

        # ✅ Connection check at startup
        try:
            db = firestore.client()
            # Try reading a small test query
            db.collection('test').limit(1).get()
            print("✅ Firebase connected successfully!")
        except Exception as e:
            print("❌ Firebase connection failed:", e)
    return firestore.client()


# Create Flask app
app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(personal_details_bp)


@app.route('/')
def health_check():
    return jsonify({"status": "Server is running", "message": "Smart Polycare API"}), 200


# ✅ Add Firebase connection check endpoint
@app.route('/check-firebase')
def check_firebase():
    try:
        db = get_db()
        # Try reading from Firestore
        test_ref = db.collection('test').limit(1).get()
        return jsonify({
            "status": "success",
            "message": "Connected to Firebase Firestore!",
            "documents_found": len(test_ref)
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
