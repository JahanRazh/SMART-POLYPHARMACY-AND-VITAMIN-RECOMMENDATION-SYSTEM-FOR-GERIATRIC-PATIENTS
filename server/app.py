from flask import Flask, jsonify
from flask_cors import CORS

# Blueprints
from routes.polyphamacy_risk_route import polypharmacy_bp
from routes.emotion_route import emotion_bp
from routes.full_assessment_route import full_assessment_bp
from routes.meal_plan_route import meal_plan_bp
from routes.occupation_route import occupation_bp
from routes.advice_route import advice_bp
from routes.vitamin_deficiency_route import vitamin_deficiency_bp

from db import get_db       

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(polypharmacy_bp)
app.register_blueprint(emotion_bp)
app.register_blueprint(full_assessment_bp)
app.register_blueprint(meal_plan_bp)
app.register_blueprint(occupation_bp)
app.register_blueprint(advice_bp)
app.register_blueprint(vitamin_deficiency_bp)

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

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False, use_reloader=False)
