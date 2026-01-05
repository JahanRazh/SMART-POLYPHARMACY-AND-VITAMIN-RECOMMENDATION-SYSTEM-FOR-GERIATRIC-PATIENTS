from flask import request, jsonify
from datetime import datetime
from db import get_db


def generate_advice_from_data(data: dict) -> str:
    """
    Create simple, explainable advice text from patient data.
    This is a deterministic heuristic generator for offline use and
    a placeholder for future integration with the `Advice_model`.
    """
    parts = []

    name = data.get("name") or "Patient"
    parts.append(f"Hello {name}, here are some personalized recommendations:")

    # Mental health level
    mh = (data.get("mentalHealthLevel") or data.get("mental_health_level") or "").lower()
    if mh:
        if "high" in mh or "severe" in mh or "risk" in mh:
            parts.append("• Mental health: Your assessment indicates elevated risk. Consider contacting a mental health professional for further evaluation and support.")
        elif "moderate" in mh:
            parts.append("• Mental health: Moderate concerns detected — monitor symptoms and prioritize sleep, activity, and social connection. Consider short-term counseling if symptoms persist.")
        else:
            parts.append("• Mental health: No major concerns detected. Maintain healthy habits and reach out if things change.")

    # Emotion
    emotion = (data.get("detectedEmotion") or data.get("emotion") or "").lower()
    if emotion:
        if any(x in emotion for x in ["sad", "depress", "angry", "fear"]):
            parts.append("• Current emotion: We detected signs of distress in recent captures — try a short breathing exercise (4-4-4) or a 5–10 minute walk.")
        elif "happy" in emotion or "surprise" in emotion:
            parts.append("• Current emotion: You seem positive — keep activities that support your mood.")
        else:
            parts.append(f"• Current emotion: {emotion.capitalize()}. Stay mindful and check in with how you feel during the day.")

    # Lifestyle numeric checks
    try:
        sleep = float(data.get("sleep_duration", 0) or 0)
    except Exception:
        sleep = 0
    if sleep and sleep < 6:
        parts.append("• Sleep: You're getting less than 6 hours. Aim for 7–9 hours; keep a consistent bedtime and wind-down routine.")
    elif sleep:
        parts.append("• Sleep: Good — keep consistent sleep timing and avoid screens before bed.")

    try:
        exercise = float(data.get("exercise_time", 0) or 0)
    except Exception:
        exercise = 0
    if exercise < 0.5:
        parts.append("• Exercise: Try to include at least 20–30 minutes of light activity most days (walking, stretching).")
    else:
        parts.append("• Exercise: Good activity — maintain this and include some balance/strength work twice a week.")

    try:
        screen = float(data.get("screen_time", 0) or 0)
    except Exception:
        screen = 0
    if screen and screen > 8:
        parts.append("• Screen time: High daily screen time can affect sleep and mood — take regular breaks and try screen-free time before bed.")

    # Substance use
    smoking = (data.get("smoking_habit") or "").lower()
    if smoking in ("yes", "true", "y"):  # simple checks
        parts.append("• Smoking: Quitting or reducing smoking greatly improves health. Contact local cessation services for support.")

    alcohol = (data.get("alcohol_intake") or "").lower()
    if alcohol in ("yes", "true", "y"):
        parts.append("• Alcohol: Reduce intake where possible — stick to recommended limits and avoid drinking to cope with mood.")

    # Meditation
    meditation = (data.get("meditation_practice") or "").lower()
    if meditation in ("no", "false", "n", ""):
        parts.append("• Mindfulness: Try short guided meditations (5–10 minutes) to help with stress and mood.")

    # Occupation-based suggestion (optional)
    occ = (data.get("occupation") or "").strip()
    if occ:
        parts.append(f"• Work: For your occupation ({occ}), remember to take regular posture and eye-rest breaks.")

    parts.append("If you'd like, we can provide a more detailed plan including meal and vitamin suggestions.")

    return "\n".join(parts)


def create_advice():
    data = request.get_json() or {}

    advice_text = generate_advice_from_data(data)

    # Save to Firestore for record
    try:
        db = get_db()
        entry = {
            "name": data.get("name"),
            "email": data.get("email"),
            "input": data,
            "advice": advice_text,
            "timestamp": datetime.utcnow(),
        }
        db.collection("patient_advice").add(entry)
    except Exception as e:
        print("❌ Error saving advice to Firebase:", e)

    return jsonify({"advice": advice_text}), 200
