import os
import sys

# Ensure UTF-8 output encoding across all platforms and WSGI runners (prevents UnicodeEncodeError)
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
if hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# pyrefly: ignore [missing-import]
from flask import Flask, jsonify, request
from flask_cors import CORS

# Load environment variables from .env file
env_file = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_file):
    print(f"[INFO] Loading environment from: {env_file}")
    with open(env_file, "r", encoding="utf-8-sig") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()
                if key.strip() == 'GOOGLE_API_KEY':
                    print("[INFO] Google API key loaded from .env")
else:
    print(f"[INFO] No .env file found at {env_file} (using runtime environment variables)")

# Blueprints
print("[INFO] Loading route blueprints...")
from routes.polyphamacy_risk_route import polypharmacy_bp
print("[INFO] Loaded polypharmacy route")
from routes.emotion_route import emotion_bp
print("[INFO] Loaded emotion route")
from routes.full_assessment_route import full_assessment_bp
print("[INFO] Loaded full assessment route")
from routes.meal_plan_route import meal_plan_bp
print("[INFO] Loaded meal plan route")

from routes.advice_route import advice_bp
print("[INFO] Loaded advice route")
from routes.vitamin_deficiency_route import vitamin_deficiency_bp
print("[INFO] Loaded vitamin deficiency route")
from routes.advice_history_route import advice_history_bp
print("[INFO] Loaded advice history route")
from routes.counsellor_booking_route import counsellor_booking_bp
print("[INFO] Loaded counsellor booking route")

from db import get_db
print("[INFO] Loaded database connection module")

app = Flask(__name__)

# Configure CORS explicitly to allow all origins and all headers
CORS(app, resources={r"/*": {"origins": "*"}})

# Register blueprints
app.register_blueprint(polypharmacy_bp)
app.register_blueprint(emotion_bp)
app.register_blueprint(full_assessment_bp)
app.register_blueprint(meal_plan_bp)

app.register_blueprint(advice_bp)
app.register_blueprint(vitamin_deficiency_bp)
app.register_blueprint(advice_history_bp)
app.register_blueprint(counsellor_booking_bp)

@app.route('/')
@app.route('/health')
@app.route('/api/health')
@app.route('/api/ping')
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "Smart Polycare API",
        "version": "1.0.0",
        "timestamp": os.environ.get("RENDER_GIT_COMMIT", "running"),
        "modules": [
            "polypharmacy_risk",
            "vitamin_deficiency",
            "meal_plans",
            "patient_advice",
            "emotion_detection",
            "counsellor_booking"
        ]
    }), 200

@app.route('/check-firebase')
def check_firebase():
    try:
        db = get_db()
        test_ref = db.collection('test').limit(1).get()
        return jsonify({"status": "success", "message": "Connected to Firebase!", "documents_found": len(test_ref)}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.before_request
def handle_incoming_request():
    """Handle CORS preflight (OPTIONS) instantly and log incoming requests."""
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
        response.headers['Access-Control-Allow-Headers'] = '*'
        return response

    print(f"\n[REQUEST] Incoming request: {request.method} {request.path}")

@app.after_request
def after_request(response):
    """Ensure CORS headers are set on all responses"""
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
    response.headers['Access-Control-Allow-Headers'] = '*'
    return response

@app.errorhandler(404)
def not_found(error):
    resp = jsonify({"error": "Endpoint not found", "path": request.path})
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp, 404

@app.errorhandler(500)
def server_error(error):
    print(f"[ERROR] Server error: {error}")
    resp = jsonify({"error": "Internal server error", "details": str(error)})
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp, 500

if __name__ == "__main__":
    print("\n[START] Starting Smart Polycare API Server...")
    print("  Server host: http://127.0.0.1:5000")
    print("  CORS enabled for all origins")
    print("  Using Firebase Admin SDK for database access\n")
    
    try:
        port = int(os.environ.get("PORT", 5000))
        host = os.environ.get("HOST", "0.0.0.0")
        app.run(host=host, port=port, debug=False, use_reloader=False)
    except OSError as e:
        if "Address already in use" in str(e):
            print("❌ ERROR: Port 5000 is already in use!")
            print("   Kill the process using: netstat -ano | findstr :5000")
            print("   Then: taskkill /PID <PID> /F")
        else:
            print(f"❌ ERROR: {e}")
        raise