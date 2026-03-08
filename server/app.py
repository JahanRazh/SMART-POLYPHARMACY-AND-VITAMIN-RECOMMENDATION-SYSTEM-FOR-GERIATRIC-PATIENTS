import os
from flask import Flask, jsonify, request
from flask_cors import CORS

# Load environment variables from .env file
env_file = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_file):
    print(f"📁 Loading environment from: {env_file}")
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()
                if key.strip() == 'GOOGLE_API_KEY':
                    print(f"✅ Loaded from .env")
else:
    print(f"⚠️ No .env file found at {env_file}")

# Blueprints
print("📦 Loading routes...")
from routes.polyphamacy_risk_route import polypharmacy_bp
print("✅ Loaded polypharmacy route")
from routes.emotion_route import emotion_bp
print("✅ Loaded emotion route")
from routes.full_assessment_route import full_assessment_bp
print("✅ Loaded full assessment route")
from routes.meal_plan_route import meal_plan_bp
print("✅ Loaded meal plan route")
from routes.occupation_route import occupation_bp
print("✅ Loaded occupation route")
from routes.advice_route import advice_bp
print("✅ Loaded advice route")
from routes.vitamin_deficiency_route import vitamin_deficiency_bp
print("✅ Loaded vitamin deficiency route")
from routes.advice_history_route import advice_history_bp
print("✅ Loaded advice history route")

from db import get_db
print("✅ Loaded database connection")

app = Flask(__name__)


# Configure CORS explicitly to allow all origins
CORS(app, resources={
    r"/api/*": {"origins": "*"},
    r"/full_assessment": {"origins": "*"},
    r"/detect_emotion": {"origins": "*"},
    r"/occupation_suggestions": {"origins": "*"},
    r"/meal_plan": {"origins": "*"},
    r"/polypharmacy_assessment": {"origins": "*"},
    r"/patient*": {"origins": "*"},
}, allow_headers=["Content-Type", "Authorization"])

# Register blueprints
app.register_blueprint(polypharmacy_bp)
app.register_blueprint(emotion_bp)
app.register_blueprint(full_assessment_bp)
app.register_blueprint(meal_plan_bp)
app.register_blueprint(occupation_bp)
app.register_blueprint(advice_bp)
app.register_blueprint(vitamin_deficiency_bp)
app.register_blueprint(advice_history_bp)

@app.route('/')
def health_check():
    return jsonify({"status": "Server is running", "message": "Smart Polycare API"}), 200

@app.route('/check-firebase')
def check_firebase():
    try:
        db = get_db()
        test_ref = db.collection('test').limit(1).get()
        return jsonify({"status": "success", "message": "Connected to Firebase!", "documents_found": len(test_ref)}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.before_request
def log_request():
    """Log all incoming requests for debugging"""
    print(f"\n📡 Incoming request: {request.method} {request.path}")
    if request.is_json:
        print(f"   Headers: {dict(request.headers)}")

@app.after_request
def after_request(response):
    """Ensure CORS headers are set on all responses"""
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found", "path": request.path}), 404

@app.errorhandler(500)
def server_error(error):
    print(f"❌ Server error: {error}")
    return jsonify({"error": "Internal server error", "details": str(error)}), 500

if __name__ == "__main__":
    print("\n🚀 Starting Smart Polycare API Server...")
    print("📍 Server will run on http://127.0.0.1:5000")
    print("⚠️  CORS enabled for all origins")
    print("💾 Using Firebase Admin SDK for database access\n")
    
    try:
        app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)
    except OSError as e:
        if "Address already in use" in str(e):
            print("❌ ERROR: Port 5000 is already in use!")
            print("   Kill the process using: netstat -ano | findstr :5000")
            print("   Then: taskkill /PID <PID> /F")
        else:
            print(f"❌ ERROR: {e}")
        raise
