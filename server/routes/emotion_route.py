from flask import Blueprint, request, jsonify
from db import get_db
from tensorflow.keras.models import load_model
import base64
import cv2
import numpy as np
from datetime import datetime

emotion_bp = Blueprint("emotion_bp", __name__)

# Load model once
model = load_model("models/model_3_csv_transfer_learning.keras")

emotion_labels = ["Angry", "Disgust", "Fear", "Happy", "Sad", "Surprise", "Neutral"]

def preprocess_image(image_base64):
    image_data = base64.b64decode(image_base64.split(",")[1])
    np_arr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)   # 🔥 FIXED (3 channels)
    img = cv2.resize(img, (96, 96))
    img = img / 255.0
    img = np.expand_dims(img, axis=0)
    return img

@emotion_bp.route("/detect_emotion", methods=["POST"])
def detect_emotion():
    data = request.get_json()

    name = data.get("name")
    age = data.get("age")
    image = data.get("image")

    img = preprocess_image(image)
    preds = model.predict(img, verbose=0)
    emotion = emotion_labels[np.argmax(preds)]

    # Save to Firestore
    db = get_db()
    db.collection("patient_emotions").add({
        "name": name,
        "age": age,
        "emotion": emotion,
        "timestamp": datetime.utcnow()
    })

    return jsonify({"emotion": emotion}), 200
