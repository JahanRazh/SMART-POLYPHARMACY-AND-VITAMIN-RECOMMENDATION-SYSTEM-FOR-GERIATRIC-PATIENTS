from flask import jsonify, request

from models.polyphamacy_risk_model import (
    find_drug_interactions,
    get_user_profile,
    save_polypharmacy_assessment,
)

MAX_DRUGS = 20
MIN_DRUGS = 2


def analyze_polypharmacy():
    payload = request.get_json(silent=True) or {}
    user_id = payload.get("userId")
    drugs = payload.get("drugs", [])

    if not user_id:
        return jsonify({"message": "userId is required"}), 400

    if not isinstance(drugs, list):
        return jsonify({"message": "drugs must be a list"}), 400

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
        assessment = save_polypharmacy_assessment(
            user_id=user_id,
            user_profile=user_profile,
            drugs=sanitized_drugs,
            interactions=interactions,
            severity_summary=severity_summary,
        )
    except FileNotFoundError as file_error:
        return jsonify({"message": str(file_error)}), 500
    except Exception as error:
        return jsonify({"message": f"Unable to analyze polypharmacy risk: {error}"}), 500

    response = {
        "assessmentId": assessment.get("id"),
        "user": assessment.get("user"),
        "drugCount": assessment.get("drugCount"),
        "drugs": assessment.get("drugs"),
        "interactionsFound": assessment.get("interactionCount"),
        "interactions": assessment.get("interactions"),
        "severitySummary": assessment.get("severitySummary"),
        "createdAt": assessment.get("createdAt"),
        "source": assessment.get("source"),
    }

    return jsonify(response), 200
