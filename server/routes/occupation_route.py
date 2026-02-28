from flask import Blueprint, request, jsonify
import csv
import os
from difflib import SequenceMatcher
from functools import lru_cache


occupation_bp = Blueprint("occupation_bp", __name__)


@lru_cache(maxsize=1)
def load_occupations():
    """
    Load occupation list from CSV once and cache it.
    CSV format:
      Occupation
      Chief Executives
      General and Operations Managers
      ...
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_path = os.path.join(base_dir, "Data", "occupation.csv")

    occupations = []
    try:
        with open(csv_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = (row.get("Occupation") or "").strip()
                if name:
                    occupations.append(name)
    except FileNotFoundError:
        # If the file is missing, just return empty list (frontend will show nothing)
        return []

    return occupations


def score_match(query: str, candidate: str) -> float:
    """
    Simple fuzzy score combining substring match and similarity.
    """
    q = query.lower()
    c = candidate.lower()

    if not q or not c:
        return 0.0

    # Strong boost if query appears as substring
    substring_bonus = 0.0
    if q in c:
        substring_bonus = 0.4
        # Slightly higher if it starts with the query
        if c.startswith(q):
            substring_bonus = 0.6

    similarity = SequenceMatcher(None, q, c).ratio()  # 0..1

    return similarity + substring_bonus


@occupation_bp.route("/occupation_suggestions", methods=["GET"])
def occupation_suggestions():
    """
    Return fuzzy occupation suggestions for an input query.

    Query params:
      - q: partial occupation text

    Response:
      {
        "suggestions": [
          { "label": "Software Developers; Applications" },
          { "label": "Software Developers; Systems Software" },
          ...
        ]
      }
    """
    query = (request.args.get("q") or "").strip()

    # Require at least 2 characters before searching
    if len(query) < 2:
        return jsonify({"suggestions": []}), 200

    occupations = load_occupations()
    if not occupations:
        return jsonify({"suggestions": []}), 200

    # Score all occupations and return top 10
    scored = [
        (score_match(query, occ), occ)
        for occ in occupations
    ]

    # Filter out very low scores
    scored = [(s, occ) for s, occ in scored if s > 0.3]

    # Sort best first
    scored.sort(key=lambda x: x[0], reverse=True)

    top = [occ for _, occ in scored[:10]]

    return jsonify(
        {
            "suggestions": [
                {"label": occ} for occ in top
        ]
        }
    ), 200


