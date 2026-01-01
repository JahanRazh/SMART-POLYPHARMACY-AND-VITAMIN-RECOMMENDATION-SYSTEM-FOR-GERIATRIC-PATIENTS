from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import cv2
import numpy as np
import csv
import os
from datetime import datetime
from tensorflow.keras.models import load_model

app = Flask(__name__)
CORS(app)

# ===============================
# Load trained emotion model
# ===============================
model = load_model("model_3_csv_transfer_learning.keras")

emotion_labels = [
    "Angry", "Disgust", "Fear",
    "Happy", "Sad", "Surprise", "Neutral"
]

# ===============================
# CSV storage path (ABSOLUTE)
# ===============================
CSV_FILE = os.path.join(os.getcwd(), "patient_emotions.csv")

# Create CSV file if not exists
if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Name", "Age", "Emotion", "Timestamp"])


# ===============================
# Image preprocessing (RGB)
# ===============================
def preprocess_image(image_base64):
    # Decode base64 image
    image_data = base64.b64decode(image_base64.split(",")[1])
    np_arr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    # Resize
    img = cv2.resize(img, (96, 96))

    # Convert BGR → RGB
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # Normalize
    img = img / 255.0

    # Expand dims → (1, 96, 96, 3)
    img = np.expand_dims(img, axis=0)

    return img


# ===============================
# Emotion Detection API
# ===============================
@app.route("/detect_emotion", methods=["POST"])
def detect_emotion():
    data = request.get_json()

    name = data.get("name", "Unknown")
    age = data.get("age", "0")
    image = data.get("image")

    if image is None:
        return jsonify({"error": "No image received"}), 400

    print(f"📥 Received → Name: {name}, Age: {age}")

    # Preprocess & predict
    img = preprocess_image(image)
    preds = model.predict(img, verbose=0)
    emotion = emotion_labels[np.argmax(preds)]

    print("😊 Predicted emotion:", emotion)

    # Save to CSV
    with open(CSV_FILE, mode="a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            name,
            age,
            emotion,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ])

    print("✅ Emotion saved to CSV")

    return jsonify({"emotion": emotion})


# ===============================
# Run server
# ===============================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
