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

# OpenCV face detector
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")


def decode_image(image_base64: str) -> Optional[np.ndarray]:
    try:
        if "," in image_base64:
            image_base64 = image_base64.split(",", 1)[1]
        image_data = base64.b64decode(image_base64)
        np_arr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return img
    except Exception:
        return None


def extract_face_for_model(frame: np.ndarray) -> Tuple[Optional[np.ndarray], dict]:
    if frame is None:
        return None, {}
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    if len(faces) == 0:
        return None, {}
    x, y, w, h = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)[0]
    face = frame[y : y + h, x : x + w]
    face = cv2.resize(face, (96, 96))
    face = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
    face = face.astype("float32") / 255.0
    face = np.expand_dims(face, axis=0)
    face_box = {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}
    return face, face_box


@emotion_bp.route("/detect_emotion", methods=["POST"])
def detect_emotion():
    """Return detection results only. Do not persist individual captures."""
    data = request.get_json() or {}
    image = data.get("image")
    if not image:
        return jsonify({"error": "No image provided"}), 400

    frame = decode_image(image)
    if frame is None:
        return jsonify({"emotion": None, "all_predictions": {}, "face_detected": False}), 200

    face_input, face_box = extract_face_for_model(frame)
    if face_input is None:
        return jsonify({"emotion": None, "all_predictions": {}, "face_detected": False}), 200

    preds = model.predict(face_input, verbose=0)[0]
    emotion_idx = int(np.argmax(preds))
    emotion = emotion_labels[emotion_idx]
    all_predictions = {label: float(preds[i]) for i, label in enumerate(emotion_labels)}

    return (
        jsonify({
            "emotion": emotion,
            "all_predictions": all_predictions,
            "face_detected": True,
            "face_box": face_box,
        }),
        200,
    )


@emotion_bp.route("/commit_emotion", methods=["POST"])
def commit_emotion():
    """Accepts `emotions` list or `most_emotion` and stores a single summary
    under `users/{userId}/emotions` (creates minimal user doc if needed).
    """
    data = request.get_json() or {}
    emotions = data.get("emotions", [])
    most_emotion = data.get("most_emotion")
    name = data.get("name") or "Unknown"
    age = data.get("age") or 0
    email = data.get("email") or ""
    uid = data.get("uid") or data.get("userId")

    # Determine chosen emotion
    chosen = None
    chosen_count = None
    if most_emotion:
        if most_emotion not in emotion_labels:
            return jsonify({"success": False, "error": "Invalid most_emotion"}), 400
        chosen = most_emotion
    else:
        if not isinstance(emotions, list) or len(emotions) == 0:
            return jsonify({"success": False, "error": "No emotions provided"}), 400
        counts = {label: 0 for label in emotion_labels}
        for e in emotions:
            if e in counts:
                counts[e] += 1
        chosen, chosen_count = max(counts.items(), key=lambda kv: kv[1])
        if chosen_count == 0:
            return jsonify({"success": False, "error": "No valid emotions in list"}), 400

    try:
        db = get_db()

        # Resolve or create user doc
        user_id = uid
        if not user_id and email:
            try:
                q = db.collection("users").where("email", "==", email).limit(1).get()
                if q:
                    user_id = q[0].id
            except Exception:
                user_id = None

        if not user_id and email:
            try:
                new_ref = db.collection("users").document()
                new_ref.set({"email": email, "name": name, "createdAt": datetime.utcnow()})
                user_id = new_ref.id
            except Exception:
                user_id = None

        record = {"name": name, "age": age, "emotion": chosen, "timestamp": datetime.utcnow()}
        if chosen_count is not None:
            record["count"] = int(chosen_count)
        if email:
            record["email"] = email

        if user_id:
            db.collection("users").document(user_id).collection("emotions").add(record)
            return jsonify({"success": True, "emotion": chosen, "count": chosen_count, "userId": user_id}), 200
        else:
            db.collection("patient_emotions_commit").add(record)
            return jsonify({"success": True, "emotion": chosen, "count": chosen_count}), 200
    except Exception as e:
        print("Error committing emotion:", e)
        return jsonify({"success": False, "error": str(e)}), 500
