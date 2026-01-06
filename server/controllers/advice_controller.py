from flask import request, jsonify
from datetime import datetime
from db import get_db
import os

# Optional heavy imports (transformers) will be attempted at runtime inside functions


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


def get_patient_advice():
    """
    GET /api/patient-advice?patientId=<id>&email=<email>

    Aggregate latest data from Firestore collections:
      - users (by patientId)
      - polypharmacy_assessments (by userId)
      - patient_assessment (mental health) (by email)
      - patient_emotions (by email)

    Attempt to generate advice using the local `Advice_model` if available,
    otherwise fall back to `generate_advice_from_data`.
    """
    patient_id = request.args.get("patientId")
    email = request.args.get("email")

    db = get_db()
    user_profile = {}
    if patient_id:
        try:
            doc = db.collection("users").document(patient_id).get()
            if doc.exists:
                user_profile = doc.to_dict()
                if not email:
                    email = user_profile.get("email")
        except Exception:
            user_profile = {}

    # Fetch latest polypharmacy assessment (by userId)
    poly = {}
    try:
        if patient_id:
            q = (
                db.collection("polypharmacy_assessments")
                .where("userId", "==", patient_id)
                .order_by("updatedAt", direction="DESCENDING")
                .limit(1)
                .get()
            )
            if q:
                poly = q[0].to_dict()
    except Exception:
        poly = {}

    # Fetch latest mental health assessment (by email)
    mh = {}
    try:
        if email:
            q = (
                db.collection("patient_assessment")
                .where("email", "==", email)
                .order_by("timestamp", direction="DESCENDING")
                .limit(1)
                .get()
            )
            if q:
                mh = q[0].to_dict()
    except Exception:
        mh = {}

    # Fetch latest emotion capture (by email)
    emotion = {}
    try:
        if email:
            q = (
                db.collection("patient_emotions")
                .where("email", "==", email)
                .order_by("timestamp", direction="DESCENDING")
                .limit(1)
                .get()
            )
            if q:
                emotion = q[0].to_dict()
    except Exception:
        emotion = {}

    # Build merged data for advice generator
    merged = {}
    # basic profile
    merged["name"] = user_profile.get("displayName") or user_profile.get("firstName") or user_profile.get("name")
    merged["email"] = email or user_profile.get("email")
    merged["occupation"] = user_profile.get("occupation") or mh.get("occupation") or ""
    merged["age"] = mh.get("age") or poly.get("age") or user_profile.get("age")

    # mental health
    # full_assessment uses key 'mental_health_level' in controller
    merged["mentalHealthLevel"] = mh.get("mental_health_level") or mh.get("mentalHealthLevel") or mh.get("mental_health_Risk") or mh.get("mental_health_Risk")

    # emotion
    merged["detectedEmotion"] = emotion.get("emotion") or emotion.get("detectedEmotion")

    # lifestyle fields — prefer values from mental health assessment (they contain input data)
    for k in ("sleep_duration", "exercise_time", "screen_time", "smoking_habit", "alcohol_intake", "meditation_practice"):
        if k in mh:
            merged[k] = mh.get(k)

    # polypharmacy fields
    if poly:
        merged["polypharmacyRisk"] = poly.get("riskCalculation") or poly.get("riskCalculation")
        merged["drugs"] = poly.get("drugs")

    # Try to use a dedicated Advice_model if available; otherwise fallback
    advice_text = None
    model_dir = os.path.join(os.path.dirname(__file__), "..", "models", "geriatric_emotion_model")
    try:
        # Import here to avoid hard dependency at module import time
        from transformers import AutoTokenizer, AutoModelForCausalLM
        import torch

        if os.path.exists(model_dir):
            tokenizer = AutoTokenizer.from_pretrained(model_dir)
            model = AutoModelForCausalLM.from_pretrained(model_dir)

            # Construct a compact prompt
            prompt_parts = [f"Patient: {merged.get('name') or 'Unknown'}"]
            if merged.get("age"):
                prompt_parts.append(f"Age: {merged.get('age')}")
            if merged.get("occupation"):
                prompt_parts.append(f"Occupation: {merged.get('occupation')}")
            if merged.get("mentalHealthLevel"):
                prompt_parts.append(f"MentalHealth: {merged.get('mentalHealthLevel')}")
            if merged.get("detectedEmotion"):
                prompt_parts.append(f"RecentEmotion: {merged.get('detectedEmotion')}")
            if merged.get("drugs"):
                prompt_parts.append(f"Medications: {', '.join(merged.get('drugs')[:10])}")

            prompt_parts.append("Provide short, non-medical lifestyle advice in bullet points.")
            prompt = "\n".join(prompt_parts)

            inputs = tokenizer(prompt, return_tensors="pt")
            if torch.cuda.is_available():
                model = model.to("cuda")
                inputs = {k: v.to("cuda") for k, v in inputs.items()}

            outputs = model.generate(**inputs, max_new_tokens=200, do_sample=False)
            advice_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    except Exception:
        advice_text = None

    if not advice_text:
        advice_text = generate_advice_from_data(merged)

    # Save generated advice to Firestore for records
    try:
        entry = {
            "name": merged.get("name"),
            "email": merged.get("email"),
            "input": merged,
            "advice": advice_text,
            "timestamp": datetime.utcnow(),
        }
        db.collection("patient_advice").add(entry)
    except Exception as e:
        print("❌ Error saving generated advice to Firebase:", e)

    return jsonify({"advice": advice_text, "source": "model" if os.path.exists(model_dir) else "heuristic", "data": merged}), 200
