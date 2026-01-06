from flask import request, jsonify
from datetime import datetime
from db import get_db
import os

# Fast dataset preload for O(1) lookups during requests. Builds simple
# in-memory maps from normalized field values to advice strings so the
# controller avoids reading/parsing the CSV on every request.
DATASET_LOADED = False
DATASET_STRUCT = {
    "exact_map": {},
    "emotion_map": {},
    "mh_map": {},
    "poly_map": {},
    "occ_map": {},
    "advice_col": None,
}
try:
    import pandas as _pd

    _csv_path = os.path.join(os.path.dirname(__file__), "..", "Data", "geriatric_non_medical_advice_dataset.csv")
    if os.path.exists(_csv_path):
        _df = _pd.read_csv(_csv_path)
        cols_lc = {c.lower(): c for c in _df.columns}

        def _find_col(*tokens):
            for lc, orig in cols_lc.items():
                if any(tok in lc for tok in tokens):
                    return orig
            return None

        _emotion_col = _find_col("emotion")
        _mh_col = _find_col("mental_health_risk", "mental_health", "mental")
        _poly_col = _find_col("polypharmacy_risk", "polypharmacy", "poly", "risk")
        _occ_col = _find_col("past_occupation", "occupation", "past occupation")
        _advice_col = _find_col("non_medical_advice", "non_medical", "non medical", "advice", "recommend")

        DATASET_STRUCT["advice_col"] = _advice_col

        for _, _row in _df.iterrows():
            e = str(_row.get(_emotion_col, "") or "").strip().lower() if _emotion_col else ""
            m = str(_row.get(_mh_col, "") or "").strip().lower() if _mh_col else ""
            p = str(_row.get(_poly_col, "") or "").strip().lower() if _poly_col else ""
            o = str(_row.get(_occ_col, "") or "").strip().lower() if _occ_col else ""
            adv = str(_row.get(_advice_col, "") or "").strip() if _advice_col else ""

            key = (e, m, p, o)
            DATASET_STRUCT["exact_map"].setdefault(key, []).append(adv)
            if e:
                DATASET_STRUCT["emotion_map"].setdefault(e, []).append(adv)
            if m:
                DATASET_STRUCT["mh_map"].setdefault(m, []).append(adv)
            if p:
                DATASET_STRUCT["poly_map"].setdefault(p, []).append(adv)
            if o:
                DATASET_STRUCT["occ_map"].setdefault(o, []).append(adv)

        DATASET_LOADED = True
except Exception:
    DATASET_LOADED = False

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
    source = None
    model_dir = os.path.join(os.path.dirname(__file__), "..", "models", "geriatric_emotion_model")

    # Attempt to find matching advice from the curated CSV dataset first
    try:
        csv_path = os.path.join(os.path.dirname(__file__), "..", "Data", "geriatric_non_medical_advice_dataset.csv")
        if os.path.exists(csv_path):
            import pandas as pd

            df = pd.read_csv(csv_path)

            # build lowercase mapping of column names for flexible matching
            cols_lc = {c.lower(): c for c in df.columns}

            def find_col_by_tokens(*tokens):
                for key_lc, orig in cols_lc.items():
                    if any(tok in key_lc for tok in tokens):
                        return orig
                return None

            # expected columns (case-insensitive)
            emotion_col = find_col_by_tokens("emotion")
            mh_col = find_col_by_tokens("mental_health_risk", "mental", "mental_health")
            poly_col = find_col_by_tokens("polypharmacy_risk", "polypharmacy", "poly")
            occ_col = find_col_by_tokens("past_occupation", "occupation", "past occupation")
            advice_col = find_col_by_tokens("non_medical_advice", "non medical advice", "non_medical", "advice")

            # prepare lowercase series for matching when columns exist
            for orig in (emotion_col, mh_col, poly_col, occ_col, advice_col):
                if orig and orig in df.columns:
                    df[orig] = df[orig].astype(str)
                    df[orig + "_lc"] = df[orig].str.lower()

            occ = (merged.get("occupation") or "").strip().lower()
            mh_val = str(merged.get("mentalHealthLevel") or "").strip().lower()
            em = str(merged.get("detectedEmotion") or "").strip().lower()
            pr = str(merged.get("polypharmacyRisk") or "").strip().lower()

            mask = pd.Series(True, index=df.index)
            applied = False

            if occ and occ_col and (occ_col + "_lc") in df.columns:
                mask &= df[occ_col + "_lc"].str.contains(occ, na=False)
                applied = True
            if mh_val and mh_col and (mh_col + "_lc") in df.columns:
                mask &= df[mh_col + "_lc"].str.contains(mh_val, na=False)
                applied = True
            if em and emotion_col and (emotion_col + "_lc") in df.columns:
                mask &= df[emotion_col + "_lc"].str.contains(em, na=False)
                applied = True
            if pr and poly_col and (poly_col + "_lc") in df.columns:
                mask &= df[poly_col + "_lc"].str.contains(pr, na=False)
                applied = True

            matched = df[mask] if applied else df.iloc[0:0]

            # If no multi-field match, try single-field matches in priority order
            if matched.empty:
                for val, col in ((mh_val, mh_col), (em, emotion_col), (pr, poly_col), (occ, occ_col)):
                    if val and col and (col + "_lc") in df.columns:
                        cand = df[df[col + "_lc"].str.contains(val, na=False)]
                        if not cand.empty:
                            matched = cand
                            break

            if not matched.empty:
                # Extract advice texts from the Non_Medical_Advice column if present
                advice_texts = []
                if advice_col and advice_col in matched.columns:
                    advice_texts = matched[advice_col].dropna().astype(str).tolist()
                else:
                    # fallback to any advice-like column
                    advice_like = [c for c in df.columns if any(x in c.lower() for x in ("advice", "recommend", "suggest", "note"))]
                    if advice_like:
                        advice_texts = matched[advice_like[0]].dropna().astype(str).tolist()

                # flatten lines and classify into categories using keywords
                cat_keywords = {
                    "nutrition": ["diet", "food", "nutrition", "meal", "vitamin", "calorie"],
                    "movement": ["exercise", "walk", "movement", "activity", "balance", "strength"],
                    "sleep": ["sleep", "bedtime", "insomnia", "rest"],
                    "stress": ["stress", "anxiety", "mindful", "meditation", "breath", "mood"],
                    "general": []
                }

                buckets = {k: [] for k in cat_keywords.keys()}
                for text in advice_texts:
                    for line in str(text).splitlines():
                        s = line.strip()
                        if not s:
                            continue
                        low = s.lower()
                        placed = False
                        for cat, keys in cat_keywords.items():
                            if keys and any(k in low for k in keys):
                                buckets[cat].append(s)
                                placed = True
                                break
                        if not placed:
                            buckets["general"].append(s)

                # Build structured advice object expected by frontend
                structured = {}
                for k, lines in buckets.items():
                    if lines:
                        # deduplicate preserving order
                        seen = []
                        for L in lines:
                            if L not in seen:
                                seen.append(L)
                        structured[k] = {
                            "summary": seen[0] if seen else "",
                            "recommendations": [ {"title": f"Advice {i+1}", "detail": detail} for i, detail in enumerate(seen) ]
                        }

                if structured:
                    advice_text = structured
                    source = "dataset"
    except Exception:
        # dataset fallback silently ignored
        pass
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

    if not source:
        source = "model" if os.path.exists(model_dir) else "heuristic"

    return jsonify({"advice": advice_text, "source": source, "data": merged}), 200
