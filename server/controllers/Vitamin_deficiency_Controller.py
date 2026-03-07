from flask import jsonify, request

from models.Vitamin_deficiency_model import (
    predict_vitamin_deficiency,
    search_drug_names,
    get_all_symptoms,
    save_vitamin_assessment,
    get_vitamin_assessment
)


def predict_deficiency():
    """
    POST /api/vitamin-deficiency/predict
    Body: { "userId": "...", "drugs": ["Metformin", "Digoxin", ...], "symptoms": ["fatigue", "tingling"] }
    """
    payload = request.get_json(silent=True) or {}

    user_id = payload.get("userId")
    drugs = payload.get("drugs", [])
    symptoms = payload.get("symptoms", [])

    if not isinstance(drugs, list) or len(drugs) < 2:
        return jsonify({"message": "At least 2 drugs are required"}), 400

    # Clean and deduplicate drugs
    clean_drugs = []
    seen = set()
    for d in drugs:
        if isinstance(d, str) and d.strip():
            normalized = d.strip().lower()
            if normalized not in seen:
                seen.add(normalized)
                clean_drugs.append(d.strip())

    if len(clean_drugs) < 2:
        return jsonify({"message": "At least 2 distinct drugs are required"}), 400

    if not isinstance(symptoms, list) or len(symptoms) == 0:
        return jsonify({"message": "At least one symptom is required"}), 400

    try:
        result = predict_vitamin_deficiency(clean_drugs, symptoms)
        
        # Save to Firebase if user is logged in
        if user_id:
            try:
                saved_doc = save_vitamin_assessment(
                    user_id=user_id,
                    drugs=result.get("drugs", clean_drugs),
                    symptoms=result.get("symptoms", symptoms),
                    predictions=result.get("predictions", []),
                    pair_details=result.get("pair_details", [])
                )
                result["savedId"] = saved_doc.get("id")
            except Exception as e:
                print(f"Failed to save vitamin assessment to Firebase: {str(e)}")
                
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"message": f"Prediction error: {str(e)}"}), 500


def get_drugs():
    """
    GET /api/vitamin-deficiency/drugs?q=met&limit=15
    Returns matching drug names for autocomplete.
    """
    query = request.args.get("q", "", type=str)
    limit = request.args.get("limit", 15, type=int)

    if not query:
        return jsonify({"items": []}), 200

    try:
        items = search_drug_names(query, limit=limit)
        return jsonify({"items": items}), 200
    except Exception as e:
        return jsonify({"message": f"Drug search error: {str(e)}", "items": []}), 500


def get_symptoms():
    """
    GET /api/vitamin-deficiency/symptoms
    Returns all available symptoms from the dataset.
    """
    try:
        items = get_all_symptoms()
        return jsonify({"items": items}), 200
    except Exception as e:
        return jsonify({"message": f"Symptoms load error: {str(e)}", "items": []}), 500

def get_assessment():
    """
    GET /api/vitamin-deficiency/assessment?userId=...
    Retrieves the user's latest vitamin deficiency assessment.
    """
    user_id = request.args.get("userId")
    if not user_id:
        return jsonify({"message": "userId is required"}), 400
        
    try:
        data = get_vitamin_assessment(user_id)
        if not data:
            return jsonify({"message": "No assessment found"}), 404
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"message": f"Error fetching assessment: {str(e)}"}), 500
