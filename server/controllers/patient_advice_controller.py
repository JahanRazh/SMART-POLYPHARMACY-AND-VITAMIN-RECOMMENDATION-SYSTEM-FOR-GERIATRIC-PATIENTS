from flask import jsonify, request
import os
import pandas as pd
import difflib
from datetime import datetime, timedelta

from db import get_db
from services.advice_generator import generate_two_week_advice


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
    """
    Fetch or generate personalized 2-week health advice for a patient.
    
    Flow:
    1. Fetch patient data (emotion, mental health, polypharmacy risk, occupation)
    2. Check Firestore for cached advice (< 7 days old)
    3. If not fresh → Generate new advice using Google Gemini API
    4. Store/update in Firestore
    5. Return structured JSON with week_1 and week_2 recommendations
    
    Query params:
    - email or patientId: Patient identifier
    - force_regenerate: (optional) "true" to ignore cache and regenerate
    """
    email = request.args.get("email") or request.args.get("patientId")
    force_regenerate = request.args.get("force_regenerate", "false").lower() == "true"
    
    if not email:
        return jsonify({"message": "email or patientId query param is required"}), 400

    db = get_db()

    # Normalize email (lowercase for consistency)
    email = (email or "").strip()
    email_lower = email.lower()

    # Resolve if patientId provided but not an email
    if "@" not in email:
        try:
            user_doc = db.collection("users").document(email).get()
            if user_doc.exists:
                resolved_email = (user_doc.to_dict() or {}).get("email") or email
                email = resolved_email
                email_lower = (resolved_email or "").lower()
        except Exception as e:
            print(f"Could not resolve patientId: {e}")

    # Fetch latest patient_assessment for this email (try both exact and lowercase)
    patient_data = {}
    patient_name = None
    patient_age = None
    try:
        # First, try to get using the same docId format as save_patient_data endpoint
        # Convert email to docId format: "user@example.com" -> "user_at_example_dot_com"
        doc_id_format = email.lower().replace("@", "_at_").replace(".", "_")
        
        print(f"🔍 Trying to fetch patient data using docId format: {doc_id_format}")
        try:
            doc_by_id = db.collection("patient_assessment").document(doc_id_format).get()
            if doc_by_id.exists:
                patient_data = doc_by_id.to_dict() or {}
                print(f"✅ Found patient data using docId: {doc_id_format}")
        except Exception as e:
            print(f"⚠️ Could not fetch by docId: {e}")
        
        # If not found by docId, try where query with exact email
        if not patient_data:
            print(f"🔍 Trying to fetch patient data using where query (email): {email}")
            q = db.collection("patient_assessment").where("email", "==", email).limit(50).get()
            
            # If no results, try lowercase comparison across all documents
            if not q:
                print(f"⚠️ No exact match found, trying case-insensitive search...")
                all_docs = db.collection("patient_assessment").limit(1000).get()
                for doc in all_docs:
                    d = doc.to_dict() or {}
                    doc_email = (d.get("email") or "").strip().lower()
                    if doc_email == email_lower:
                        q = [doc]
                        print(f"✅ Found match with case-insensitive search")
                        break
            
            best = None
            best_ts = None
            for doc in q:
                d = doc.to_dict() or {}
                ts = d.get("timestamp") or d.get("createdAt") or d.get("updatedAt")
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
                print(f"✅ Found patient data using where query")
        
        if patient_data:
            patient_name = patient_data.get("name") or patient_data.get("patientName")
            patient_age = patient_data.get("age")
            print(f"✅ Found patient data for {email}")
        else:
            print(f"⚠️ No patient data found for {email}")
            return jsonify({
                "message": f"Patient data not found for {email}. Please complete the assessment first.",
                "week_1": [],
                "week_2": [],
                "summary": "",
                "source": "error",
                "debug": {
                    "email_searched": email,
                    "doc_id_tried": doc_id_format,
                    "patient_data_found": False
                }
            }), 404
            
    except Exception as e:
        print(f"❌ Error fetching patient_assessment: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "message": f"Database error: {str(e)}",
            "week_1": [],
            "week_2": [],
            "summary": "",
            "source": "error"
        }), 500

    # Fetch latest polypharmacy assessment for this email
    poly_data = {}
    medications = []
    try:
        # Try multiple query patterns
        q2 = []
        try:
            q2 = db.collection("polypharmacy_assessments").where("user.email", "==", email).limit(5).get()
        except:
            pass
        
        if not q2:
            try:
                q2 = db.collection("polypharmacy_assessments").where("email", "==", email).limit(5).get()
            except:
                pass
        
        if q2:
            poly_data = (q2[0].to_dict() or {})
            print(f"✅ Found polypharmacy data for {email}")
            
            # Extract medications list if available
            if "medications" in poly_data:
                meds = poly_data.get("medications", [])
                if isinstance(meds, list):
                    medications = [m.get("name") if isinstance(m, dict) else str(m) for m in meds]
            elif "drugs" in poly_data:
                drugs = poly_data.get("drugs", [])
                if isinstance(drugs, list):
                    medications = drugs
        else:
            print(f"⚠️ No polypharmacy data found for {email} (optional)")
    except Exception as e:
        print(f"⚠️ Error fetching polypharmacy_assessments: {e}")

    # Extract patient input features
    emotion = _safe_get(patient_data, ["detectedEmotion", "detected_emotion", "emotion", "most_emotion"]) or ""
    mental_health = _safe_get(patient_data, ["mental_health_level", "mentalHealthLevel", "mental_health_Risk", "mental_health"]) or ""
    occupation = _safe_get(patient_data, ["occupation", "Past_Occupation", "past_occupation"]) or ""

    risk_calc = poly_data.get("riskCalculation") if isinstance(poly_data, dict) else None
    poly_risk = ""
    if isinstance(risk_calc, dict):
        poly_risk = _safe_get(risk_calc, ["riskLevel", "risk_level", "risk"]) or poly_risk
    poly_risk = poly_risk or poly_data.get("riskLevel") or poly_data.get("polypharmacyRisk") or ""

    # Normalize inputs
    emotion = (emotion or "").strip()
    mental_health = (mental_health or "").strip()
    poly_risk = (poly_risk or "").strip()
    occupation = (occupation or "").strip()

    # Log extracted data for debugging
    print(f"\n📊 Extracted patient inputs for {email}:")
    print(f"  - Emotion: '{emotion}'")
    print(f"  - Mental Health: '{mental_health}'")
    print(f"  - Polypharmacy Risk: '{poly_risk}'")
    print(f"  - Occupation: '{occupation}'")

    # Use defaults for missing data instead of rejecting
    # This allows advice generation even if some fields are empty
    if not emotion:
        emotion = "Not detected"
        print(f"  ⚠️ No emotion data, using default: '{emotion}'")
    if not mental_health:
        mental_health = "Not assessed"
        print(f"  ⚠️ No mental health data, using default: '{mental_health}'")
    if not poly_risk:
        poly_risk = "Unknown"
        print(f"  ⚠️ No polypharmacy risk data, using default: '{poly_risk}'")
    if not occupation:
        occupation = "Not specified"
        print(f"  ⚠️ No occupation data, using default: '{occupation}'")
    
    # Now at least check if we found patient data at all
    if not patient_data or (not patient_name and not patient_age):
        print(f"⚠️ Minimal patient data found for {email}, but continuing with assessment generation...")
        # We'll generate advice with available data

    # Check for cached advice in Firestore (if not forcing regeneration)
    cached_advice = None
    advice_doc_id = None
    if not force_regenerate:
        try:
            q_cached = db.collection("patient_advice").where("email", "==", email).limit(1).get()
            if q_cached:
                cached_doc = q_cached[0]
                advice_doc_id = cached_doc.id
                cached_data = cached_doc.to_dict() or {}
                
                # Check if cached advice is fresh (< 7 days old)
                generated_date = cached_data.get("advice_generated_date")
                if generated_date:
                    try:
                        if isinstance(generated_date, str):
                            generated_date = datetime.fromisoformat(generated_date)
                        days_old = (datetime.now() - generated_date).days
                        if days_old < 7:
                            cached_advice = cached_data
                            print(f"✅ Using cached advice for {email} (generated {days_old} days ago)")
                    except Exception as e:
                        print(f"Error checking cache date: {e}")
        except Exception as e:
            print(f"⚠️ Error fetching cached advice: {e}")

    # If we have fresh cached advice, return it
    if cached_advice:
        return jsonify({
            "week_1": cached_advice.get("week_1", []),
            "week_2": cached_advice.get("week_2", []),
            "summary": cached_advice.get("summary", ""),
            "source": "cached",
            "generated_date": cached_advice.get("advice_generated_date"),
            "expires_date": cached_advice.get("advice_expires_date"),
            "inputs": {
                "emotion": emotion,
                "mental_health_level": mental_health,
                "polypharmacy_risk": poly_risk,
                "occupation": occupation,
            }
        }), 200

    # No fresh cached advice, generate new advice using Gemini API
    print(f"\n🤖 Generating new advice for {email} using Gemini API...")
    advice_result = generate_two_week_advice(
        emotion=emotion,
        mental_health_level=mental_health,
        polypharmacy_risk=poly_risk,
        occupation=occupation,
        medications=medications,
        patient_name=patient_name,
        age=patient_age
    )

    # Handle generation errors
    if "error" in advice_result:
        print(f"❌ Error generating advice: {advice_result['error']}")
        return jsonify({
            "message": f"Error generating advice: {advice_result['error']}",
            "week_1": [],
            "week_2": [],
            "summary": "Could not generate advice at this time",
            "source": "error"
        }), 500

    # Validate advice structure before returning
    week_1 = advice_result.get("week_1", [])
    week_2 = advice_result.get("week_2", [])
    
    if not week_1 or not week_2:
        print(f"❌ Invalid advice structure returned from Gemini")
        print(f"   week_1: {len(week_1) if week_1 else 0} items")
        print(f"   week_2: {len(week_2) if week_2 else 0} items")
        return jsonify({
            "message": "Failed to generate valid advice structure. Please try again.",
            "week_1": [],
            "week_2": [],
            "summary": "",
            "source": "error"
        }), 500

    # Store advice in Firestore
    now = datetime.now()
    expires = now + timedelta(days=7)
    
    advice_to_store = {
        "email": email,
        "patient_name": patient_name,
        "age": patient_age,
        "week_1": week_1,
        "week_2": week_2,
        "summary": advice_result.get("summary", ""),
        "advice_generated_date": now.strftime('%Y-%m-%dT%H:%M:%S'),
        "advice_expires_date": expires.strftime('%Y-%m-%dT%H:%M:%S'),
        "inputs": {
            "emotion": emotion,
            "mental_health_level": mental_health,
            "polypharmacy_risk": poly_risk,
            "occupation": occupation,
        },
        "source": "gemini_api",
        "medications": medications,
    }

    try:
        if advice_doc_id:
            # Update existing advice document
            db.collection("patient_advice").document(advice_doc_id).update(advice_to_store)
        else:
            # Create new advice document
            db.collection("patient_advice").add(advice_to_store)
        print(f"✅ Stored advice for {email} in Firestore")
    except Exception as e:
        print(f"⚠️ Warning: Could not store advice in Firestore: {e}")

    print(f"\n✅ Successfully generated advice for {email}")
    return jsonify({
        "week_1": week_1,
        "week_2": week_2,
        "summary": advice_result.get("summary", ""),
        "source": "gemini_api",
        "generated_date": now.strftime('%Y-%m-%dT%H:%M:%S'),
        "expires_date": expires.strftime('%Y-%m-%dT%H:%M:%S'),
        "inputs": {
            "emotion": emotion,
            "mental_health_level": mental_health,
            "polypharmacy_risk": poly_risk,
            "occupation": occupation,
        }
    }), 200

