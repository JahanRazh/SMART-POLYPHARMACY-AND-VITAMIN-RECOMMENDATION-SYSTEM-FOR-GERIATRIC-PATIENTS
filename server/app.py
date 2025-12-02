# app.py
from flask import Flask, jsonify
from flask_cors import CORS

# Import the blueprints
from routes.polyphamacy_risk_route import polypharmacy_bp
from db import get_db

# Create Flask app
app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(polypharmacy_bp)

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
    
# Run localy
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)