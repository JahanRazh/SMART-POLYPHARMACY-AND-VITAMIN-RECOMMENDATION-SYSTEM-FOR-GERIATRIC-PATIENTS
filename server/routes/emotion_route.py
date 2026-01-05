from flask import Blueprint, request, jsonify
from db import get_db
from tensorflow.keras.models import load_model
import base64
import cv2
import numpy as np
from datetime import datetime
from typing import Optional, Tuple

emotion_bp = Blueprint("emotion_bp", __name__)

# Load emotion model (transfer learning)
model = load_model("models/model_3_csv_transfer_learning.keras")
emotion_labels = ["Angry", "Disgust", "Fear", "Happy", "Sad", "Surprise", "Neutral"]

# OpenCV face detector (same as webcam_test_model_3.py)
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)


def decode_image(image_base64: str) -> Optional[np.ndarray]:
    """
    Decode base64 image from the frontend into a BGR OpenCV frame.
    """
    try:
        # Handle "data:image/jpeg;base64,...."
        if "," in image_base64:
            image_base64 = image_base64.split(",", 1)[1]

        image_data = base64.b64decode(image_base64)
        np_arr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return img
    except Exception:
        return None


def extract_face_for_model(frame: np.ndarray) -> Tuple[Optional[np.ndarray], dict]:
    """
    Detect a face in the frame and prepare it for the emotion model.
    Returns:
        - face_input: np.ndarray shaped (1, 96, 96, 3) or None if no face.
        - face_box: dict with x, y, w, h (or empty if no face).
    """
    if frame is None:
        return None, {}

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    if len(faces) == 0:
        return None, {}

    # Choose the largest detected face (most likely the user)
    x, y, w, h = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)[0]

    face = frame[y : y + h, x : x + w]  # BGR
    face = cv2.resize(face, (96, 96))
    face = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
    face = face.astype("float32") / 255.0
    face = np.expand_dims(face, axis=0)  # (1, 96, 96, 3)

    face_box = {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}
    return face, face_box


@emotion_bp.route("/detect_emotion", methods=["POST"])
def detect_emotion():
    """
    Detect emotion only when a human face is present in the camera frame.

    Frontend contract:
      - On success with face:
          {
            "emotion": "Happy",
            "all_predictions": { "Happy": 0.92, "Neutral": 0.03, ... },
            "face_detected": true,
            "face_box": { "x": ..., "y": ..., "w": ..., "h": ... }
          }
      - On success with NO face:
          {
            "emotion": null,
            "all_predictions": {},
            "face_detected": false
          }
    """
    data = request.get_json() or {}
    name = data.get("name", "Unknown")
    age = data.get("age", 0)
    email = data.get("email", "")  # User email for database storage
    image = data.get("image")

    if not image:
        return jsonify({"error": "No image provided"}), 400

    frame = decode_image(image)
    if frame is None:
        return jsonify({"emotion": None, "all_predictions": {}, "face_detected": False}), 200

    face_input, face_box = extract_face_for_model(frame)

    # No face in frame → tell frontend but don't guess an emotion
    if face_input is None:
        return jsonify(
            {
                "emotion": None,
                "all_predictions": {},
                "face_detected": False,
            }
        ), 200

    # Predict emotion on the detected face
    preds = model.predict(face_input, verbose=0)[0]  # shape (7,)
    emotion_idx = int(np.argmax(preds))
    emotion = emotion_labels[emotion_idx]

    # Convert predictions to a serializable dict
    all_predictions = {
        label: float(preds[i]) for i, label in enumerate(emotion_labels)
    }

    # Save to Firebase only when a face is detected
    try:
        db = get_db()
        emotion_data = {
            "name": name,
            "age": age,
            "emotion": emotion,
            "all_predictions": all_predictions,
            "face_box": face_box,
            "timestamp": datetime.utcnow(),
        }
        
        # Add email if provided
        if email:
            emotion_data["email"] = email
        
        db.collection("patient_emotions").add(emotion_data)
        print(f"✅ Saved emotion data to Firebase: {emotion} for {name} ({email})")
    except Exception as e:
        print(f"❌ Error saving emotion data to Firebase: {str(e)}")
        # Don't fail the request if database save fails, just log it

    return (
        jsonify(
            {
                "emotion": emotion,
                "all_predictions": all_predictions,
                "face_detected": True,
                "face_box": face_box,
            }
        ),
        200,
    )
