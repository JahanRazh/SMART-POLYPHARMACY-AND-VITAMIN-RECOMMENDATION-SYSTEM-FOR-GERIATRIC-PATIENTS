from flask import jsonify, request
import os
import pandas as pd
import difflib

from db import get_db


def _safe_get(d: dict, keys, default=None):
    for k in keys:
        v = d.get(k)
        if v is not None:
            return v
    return default


def _similar(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    return difflib.SequenceMatcher(None, a.lower(), b.lower()).ratio()


def patient_advice():
    """Fetch latest patient assessment and polypharmacy assessment by email (or patientId),
    then use fuzzy matching to select the best CSV row and return Non_Medical_Advice.
    """
    email = request.args.get("email") or request.args.get("patientId")
    if not email:
        return jsonify({"message": "email or patientId query param is required"}), 400

    db = get_db()

    # Resolve if patientId provided but not an email
    if "@" not in email:
        try:
            user_doc = db.collection("users").document(email).get()
            if user_doc.exists:
                email = (user_doc.to_dict() or {}).get("email") or email
        except Exception:
            pass

    # Fetch latest patient_assessment for this email
    patient_data = {}
    try:
        q = db.collection("patient_assessment").where("email", "==", email).limit(50).get()
        best = None
        best_ts = None
        for doc in q:
            d = doc.to_dict() or {}
            ts = d.get("timestamp") or d.get("createdAt")
            if best is None:
                best = d
                best_ts = ts
                continue
            if ts and best_ts:
                try:
                    if ts > best_ts:
                        best = d
                        best_ts = ts
                except Exception:
                    pass
        if best:
            patient_data = best
    except Exception as e:
        print("Error fetching patient_assessment:", e)

    # Fetch latest polypharmacy assessment for this email
    poly_data = {}
    try:
        q2 = db.collection("polypharmacy_assessments").where("user.email", "==", email).limit(5).get()
        if not q2:
            q2 = db.collection("polypharmacy_assessments").where("email", "==", email).limit(5).get()
        if q2:
            # pick most recent
            poly_data = (q2[0].to_dict() or {})
    except Exception as e:
        print("Error fetching polypharmacy_assessments:", e)

    # Extract matching fields
    emotion = _safe_get(patient_data, ["detectedEmotion", "detected_emotion", "emotion", "most_emotion"]) or ""
    mental = _safe_get(patient_data, ["mental_health_level", "mentalHealthLevel", "mental_health_Risk", "mental_health"]) or ""
    occupation = _safe_get(patient_data, ["occupation", "Past_Occupation", "past_occupation"]) or ""

    risk_calc = poly_data.get("riskCalculation") if isinstance(poly_data, dict) else None
    poly_risk = ""
    if isinstance(risk_calc, dict):
        poly_risk = _safe_get(risk_calc, ["riskLevel", "risk_level", "risk"]) or poly_risk
    poly_risk = poly_risk or poly_data.get("riskLevel") or poly_data.get("polypharmacyRisk") or ""

    # Normalize inputs
    def norm(v):
        return (v or "").strip()

    e_in = norm(emotion)
    m_in = norm(mental)
    p_in = norm(poly_risk)
    o_in = norm(occupation)

    # Load CSV
    csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "Data", "geriatric_non_medical_advice_dataset.csv")
    if not os.path.exists(csv_path):
        return jsonify({"message": f"Advice dataset not found at {csv_path}"}), 500

    try:
        df = pd.read_csv(csv_path, dtype=str).fillna("")
    except Exception as e:
        return jsonify({"message": f"Failed to read dataset: {e}"}), 500

    # If CSV empty
    if df.shape[0] == 0:
        return jsonify({"message": "Advice dataset is empty"}), 500

    # Compute fuzzy score per row with weights
    weights = {
        "Mental_Health_Risk": 0.4,
        "Polypharmacy_Risk": 0.3,
        "Emotion": 0.2,
        "Past_Occupation": 0.1,
    }

    best_score = -1.0
    best_row = None

    for idx, row in df.iterrows():
        score = 0.0
        # mental
        m_val = norm(row.get("Mental_Health_Risk", ""))
        score += weights["Mental_Health_Risk"] * _similar(m_in, m_val)
        # poly
        p_val = norm(row.get("Polypharmacy_Risk", ""))
        score += weights["Polypharmacy_Risk"] * _similar(p_in, p_val)
        # emotion
        e_val = norm(row.get("Emotion", ""))
        score += weights["Emotion"] * _similar(e_in, e_val)
        # occupation
        o_val = norm(row.get("Past_Occupation", ""))
        score += weights["Past_Occupation"] * _similar(o_in, o_val)

        if score > best_score:
            best_score = score
            best_row = row

    # require a reasonable threshold; fallback to previous exact matching logic if too low
    threshold = 0.45
    if best_row is None or best_score < threshold:
        # fallback: try exact / partial as before
        # try exact combinations
        mask = pd.Series([True] * len(df))
        if e_in:
            mask &= df["Emotion"].astype(str).str.strip().str.lower() == e_in.lower()
        if m_in:
            mask &= df["Mental_Health_Risk"].astype(str).str.strip().str.lower() == m_in.lower()
        if p_in:
            mask &= df["Polypharmacy_Risk"].astype(str).str.strip().str.lower() == p_in.lower()
        if o_in:
            mask &= df["Past_Occupation"].astype(str).str.strip().str.lower() == o_in.lower()
        res = df[mask]
        if not res.empty:
            best_row = res.iloc[0]
        else:
            # single-field fallbacks
            for key, val in (("Mental_Health_Risk", m_in), ("Polypharmacy_Risk", p_in), ("Emotion", e_in), ("Past_Occupation", o_in)):
                if val:
                    r = df[df[key].astype(str).str.strip().str.lower() == val.lower()]
                    if not r.empty:
                        best_row = r.iloc[0]
                        break

    if best_row is None:
        return jsonify({"message": "No matching advice found for the provided user data", "match": {"emotion": e_in, "mental": m_in, "poly": p_in, "occupation": o_in}}), 404

    advice_text = best_row.get("Non_Medical_Advice") or best_row.get("Non-Medical-Advice") or best_row.get("Advice") or ""

    return jsonify({
        "advice": advice_text,
        "matchedRow": {
            "Emotion": best_row.get("Emotion"),
            "Mental_Health_Risk": best_row.get("Mental_Health_Risk"),
            "Polypharmacy_Risk": best_row.get("Polypharmacy_Risk"),
            "Past_Occupation": best_row.get("Past_Occupation"),
        },
        "score": round(best_score, 3),
        "source": "csv_dataset",
    }), 200
