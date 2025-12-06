from flask import jsonify, request

from models.polyphamacy_risk_model import (
    calculate_polypharmacy_risk,
    find_drug_interactions,
    get_user_profile,
    save_polypharmacy_assessment,
    search_drug_names,
)

MAX_DRUGS = 20
MIN_DRUGS = 2


def analyze_polypharmacy():
    payload = request.get_json(silent=True) or {}
    user_id = payload.get("userId")
    drugs = payload.get("drugs", [])
    age = payload.get("age")
    liver_function = payload.get("liverFunction")
    kidney_function = payload.get("kidneyFunction")
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

    user_profile = get_user_profile(user_id)
    if not user_profile:
        return jsonify({"message": "User profile not found"}), 404

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

        assessment = save_polypharmacy_assessment(
            user_id=user_id,
            user_profile=user_profile,
            drugs=sanitized_drugs,
            interactions=interactions,
            severity_summary=severity_summary,
            age=age,
            liver_function=liver_function,
            kidney_function=kidney_function,
            risk_calculation=risk_calculation,
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
