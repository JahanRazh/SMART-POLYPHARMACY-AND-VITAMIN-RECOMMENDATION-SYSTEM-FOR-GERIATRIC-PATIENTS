from flask import jsonify, request

from models.polyphamacy_risk_model import (
    calculate_polypharmacy_risk,
    find_drug_interactions,
    get_user_profile,
    save_polypharmacy_assessment,
    search_drug_names,
    search_disease_names,
    get_polypharmacy_assessment,
    delete_polypharmacy_assessment,
    update_user_profile_fields,
    predict_adverse_events,
)

MAX_DRUGS = 20
MIN_DRUGS = 2


def analyze_polypharmacy():
    payload = request.get_json(silent=True) or {}
    user_id = payload.get("userId")
    drugs = payload.get("drugs", [])
    age = payload.get("age")
    gender = payload.get("gender", "")
    liver_function = payload.get("liverFunction")
    kidney_function = payload.get("kidneyFunction")
    existing_diseases = payload.get("existingDiseases", [])
    # caretaker mode removed; always treat as self

    if not user_id:
        return jsonify({"message": "userId is required"}), 400

    if not isinstance(drugs, list):
        return jsonify({"message": "drugs must be a list"}), 400

    if not age or not isinstance(age, int) or age < 0:
        return jsonify({"message": "age is required and must be a positive integer"}), 400

    if not liver_function or not isinstance(liver_function, str):
        return jsonify({"message": "liverFunction is required"}), 400

    if not kidney_function or not isinstance(kidney_function, str):
        return jsonify({"message": "kidneyFunction is required"}), 400

    sanitized_drugs = []
    seen = set()
    for drug in drugs:
        if isinstance(drug, str):
            cleaned = drug.strip()
            if cleaned:
                normalized = cleaned.lower()
                if normalized in seen:
                    continue
                seen.add(normalized)
                sanitized_drugs.append(cleaned)

    if len(sanitized_drugs) < MIN_DRUGS:
        return jsonify({"message": f"Provide at least {MIN_DRUGS} distinct drugs"}), 400

    if len(sanitized_drugs) > MAX_DRUGS:
        return jsonify({"message": f"Maximum of {MAX_DRUGS} drugs is allowed"}), 400

    # Sanitize existing diseases
    sanitized_diseases = []
    for disease in existing_diseases:
        if isinstance(disease, str):
            cleaned = disease.strip()
            if cleaned:
                sanitized_diseases.append(cleaned)

    # Auto-add organ-related diseases based on clinical indicators
    liver_lower = liver_function.lower().strip() if liver_function else ""
    if "severe" in liver_lower or ">150" in liver_lower or "above 150" in liver_lower:
        if "Liver Issues" not in sanitized_diseases:
            sanitized_diseases.append("Liver Issues")

    kidney_lower = kidney_function.lower().strip() if kidney_function else ""
    if "stage 5" in kidney_lower or "egfr <15" in kidney_lower or "below 15" in kidney_lower:
        if "Kidney Issues" not in sanitized_diseases:
            sanitized_diseases.append("Kidney Issues")

    user_profile = get_user_profile(user_id)
    if not user_profile:
        return jsonify({"message": "User profile not found"}), 404

    # Update user profile fields if provided from the form
    profile_updates = {}
    if gender:
        profile_updates["gender"] = gender
    if age:
        profile_updates["age"] = age
    update_user_profile_fields(user_id, profile_updates)

    try:
        interactions, severity_summary = find_drug_interactions(sanitized_drugs)
        
        # Calculate polypharmacy risk
        risk_calculation = calculate_polypharmacy_risk(
            drug_count=len(sanitized_drugs),
            age=age,
            severity_summary=severity_summary,
            liver_function=liver_function,
            kidney_function=kidney_function,
        )

        # Predict adverse drug events
        ade_predictions = predict_adverse_events(
            drugs=sanitized_drugs,
            age=age,
            diseases=sanitized_diseases,
        )

        assessment = save_polypharmacy_assessment(
            user_id=user_id,
            user_profile=user_profile,
            drugs=sanitized_drugs,
            interactions=interactions,
            severity_summary=severity_summary,
            age=age,
            gender=gender,
            liver_function=liver_function,
            kidney_function=kidney_function,
            risk_calculation=risk_calculation,
            existing_diseases=sanitized_diseases,
            ade_predictions=ade_predictions,
        )
    except FileNotFoundError as file_error:
        return jsonify({"message": str(file_error)}), 500
    except Exception as error:
        return jsonify({"message": f"Unable to analyze polypharmacy risk: {error}"}), 500

    response = {
        "assessmentId": assessment.get("id"),
        "mode": "self",
        "user": assessment.get("user"),
        "drugCount": assessment.get("drugCount"),
        "drugs": assessment.get("drugs"),
        "interactionsFound": assessment.get("interactionCount"),
        "interactions": assessment.get("interactions"),
        "severitySummary": assessment.get("severitySummary"),
        "age": assessment.get("age"),
        "liverFunction": assessment.get("liverFunction"),
        "kidneyFunction": assessment.get("kidneyFunction"),
        "existingDiseases": assessment.get("existingDiseases", []),
        "adePredictions": assessment.get("adePredictions", []),
        "riskCalculation": assessment.get("riskCalculation"),
        "createdAt": assessment.get("createdAt"),
        "source": assessment.get("source"),
    }

    return jsonify(response), 200


def search_drugs():
    """
    Fuzzy search endpoint for drug names based on Drug_interaction.csv.

    Query params:
      - q: search text (required)
      - limit: max number of results (optional, default 15)
    """
    query = request.args.get("q", "", type=str)
    if not query:
        return jsonify({"items": []}), 200

    limit = request.args.get("limit", 15, type=int)
    try:
        suggestions = search_drug_names(query, limit=limit)
        return jsonify({"items": suggestions}), 200
    except FileNotFoundError as file_error:
        return jsonify({"message": str(file_error), "items": []}), 500
    except Exception as error:
        return jsonify({"message": f"Unable to search drugs: {error}", "items": []}), 500


def search_diseases():
    """
    Fuzzy search endpoint for disease names from Adverse Drug Event.csv.

    Query params:
      - q: search text (required)
      - limit: max number of results (optional, default 15)
    """
    query = request.args.get("q", "", type=str)
    if not query:
        return jsonify({"items": []}), 200

    limit = request.args.get("limit", 15, type=int)
    try:
        suggestions = search_disease_names(query, limit=limit)
        return jsonify({"items": suggestions}), 200
    except Exception as error:
        return jsonify({"message": f"Unable to search diseases: {error}", "items": []}), 500


def get_latest_assessment():
    """Get the latest polypharmacy assessment for the logged-in user."""
    user_id = request.args.get("userId")
    if not user_id:
        return jsonify({"message": "userId is required"}), 400
        
    try:
        assessment = get_polypharmacy_assessment(user_id)
        if not assessment:
            return jsonify({"message": "No assessment found"}), 404
            
        return jsonify(assessment), 200
    except Exception as error:
        return jsonify({"message": f"Error retrieving assessment: {error}"}), 500


def clear_assessment():
    """Delete the polypharmacy assessment for the logged-in user."""
    user_id = request.args.get("userId")
    if not user_id:
        return jsonify({"message": "userId is required"}), 400
        
    try:
        success = delete_polypharmacy_assessment(user_id)
        if not success:
            return jsonify({"message": "No assessment found to delete"}), 404
            
        return jsonify({"message": "Assessment cleared successfully"}), 200
    except Exception as error:
        return jsonify({"message": f"Error clearing assessment: {error}"}), 500


def update_profile():
    """Live-update user profile fields from the Patient Snapshot form."""
    payload = request.get_json(silent=True) or {}
    user_id = payload.get("userId")
    if not user_id:
        return jsonify({"message": "userId is required"}), 400

    allowed_fields = {"firstName", "lastName", "displayName", "gender", "age"}
    updates = {}
    for key in allowed_fields:
        if key in payload and payload[key] is not None:
            updates[key] = payload[key]

    if not updates:
        return jsonify({"message": "No valid fields to update"}), 400

    try:
        update_user_profile_fields(user_id, updates)
        return jsonify({"message": "Profile updated", "updated": list(updates.keys())}), 200
    except Exception as error:
        return jsonify({"message": f"Error updating profile: {error}"}), 500
