from flask import Blueprint, request, jsonify
import pandas as pd
import joblib
from db import get_db
from datetime import datetime
import os

full_assessment_bp = Blueprint("full_assessment", __name__)

# Load ML artifacts
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "models")

model = joblib.load(os.path.join(MODEL_DIR, "mental_health_model.pkl"))
scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))
label_encoders = joblib.load(os.path.join(MODEL_DIR, "label_encoders.pkl"))
target_encoder = joblib.load(os.path.join(MODEL_DIR, "target_encoder.pkl"))

TRAIN_FEATURES = list(model.feature_names_in_)

@full_assessment_bp.route("/full_assessment", methods=["POST"])
def full_assessment():
    data = request.get_json()

    # Step 1: create empty row
    row = {feature: 0 for feature in TRAIN_FEATURES}

    # Step 2: numeric features
    for col in ["age", "exercise_time", "sleep_duration", "physical_activity",
                "screen_time", "work_hours", "social_interaction_duration"]:
        row[col] = data.get(col, 0)

    # Step 3: categorical features
    defaults = {
        "gender": "Male",
        "occupation": "Unemployed",
        "smoking_habit": "No",
        "alcohol_intake": "No",
        "meditation_practice": "No"
    }
    for col, default_value in defaults.items():
        value = data.get(col, default_value)
        if col in label_encoders:
            le = label_encoders[col]
            if value in le.classes_:
                row[col] = le.transform([value])[0]
            else:
                row[col] = 0

    # Step 4: DataFrame
    df = pd.DataFrame([row])
    numeric_cols = scaler.feature_names_in_
    df[numeric_cols] = scaler.transform(df[numeric_cols])

    # Step 5: predict
    pred_encoded = model.predict(df)[0]
    prediction = target_encoder.inverse_transform([pred_encoded])[0]

    # Save to Firebase
    db = get_db()
    db.collection("patient_assessment").add({
        **data,
        "mental_health_level": prediction,
        "timestamp": datetime.utcnow()
    })

    return jsonify({"mental_health_Risk": prediction}), 200
