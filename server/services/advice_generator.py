"""
Advice generation service using Google Gemini API.
Generates personalized 2-week health recommendations based on:
- Detected emotion (facial emotion detection)
- Mental health level (ML-based assessment)
- Polypharmacy risk (drug interaction analysis)
- Occupation (lifestyle context)
- Medications (if available)
"""

import os
import json
from typing import Dict, Optional
import google.generativeai as genai

# Configure Gemini API - check multiple sources
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
print(f"[advice_generator] GOOGLE_API_KEY loaded from env: {bool(GOOGLE_API_KEY)}")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    print(f"[advice_generator] ✅ Gemini API configured with key (first 10 chars: {GOOGLE_API_KEY[:10]}...)")


def generate_two_week_advice(
    emotion: str,
    mental_health_level: str,
    polypharmacy_risk: str,
    occupation: str,
    medications: Optional[list] = None,
    patient_name: Optional[str] = None,
    age: Optional[int] = None,
) -> Dict:
    """
    Generate personalized 2-week health advice using Google Gemini.
    
    Args:
        emotion: Detected emotion (e.g., "Happy", "Sad", "Neutral", "Anxious")
        mental_health_level: Mental health assessment level (e.g., "Low", "Moderate", "High")
        polypharmacy_risk: Polypharmacy risk level (e.g., "Low", "Medium", "High", "Critical")
        occupation: Current or past occupation (e.g., "Engineer", "Teacher", "Retired")
        medications: List of medication names (optional)
        patient_name: Patient's name (optional)
        age: Patient's age (optional)
    
    Returns:
        Dictionary with structure:
        {
            "week_1": [
                {"day": 1, "recommendation": "..."},
                {"day": 2, "recommendation": "..."},
                ...
            ],
            "week_2": [
                {"day": 8, "recommendation": "..."},
                ...
            ],
            "summary": "Overall 2-week plan summary",
            "source": "gemini_api"
        }
    """
    
    # Get API key from environment at runtime (in case it was set after startup)
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("❌ GOOGLE_API_KEY not found in environment variables")
        print("   Available env vars:", list(os.environ.keys())[:10], "...")
        return {
            "error": "GOOGLE_API_KEY environment variable not set",
            "week_1": [],
            "week_2": [],
            "summary": "",
            "source": "fallback"
        }
    
    # Configure API at runtime
    try:
        genai.configure(api_key=api_key)
        print(f"✅ Gemini API configured at runtime")
    except Exception as e:
        print(f"❌ Failed to configure Gemini API: {e}")
        return {
            "error": f"Failed to configure Gemini API: {str(e)}",
            "week_1": [],
            "week_2": [],
            "summary": "",
            "source": "gemini_api"
        }
    
    try:
        # Try models in order of availability
        # gemini-2.5-flash is the latest and most efficient model
        models_to_try = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
        model = None
        last_error = None
        
        for model_name in models_to_try:
            try:
                print(f"🤖 Trying model: {model_name}")
                model = genai.GenerativeModel(model_name)
                print(f"✅ Using model: {model_name}")
                break
            except Exception as e:
                print(f"⚠️  Model {model_name} not available: {str(e)[:50]}")
                last_error = e
                continue
        
        if model is None:
            raise Exception(f"No models available. Last error: {last_error}")
        
        # Build context from patient data
        context_parts = []
        if patient_name:
            context_parts.append(f"Patient: {patient_name}")
        if age:
            context_parts.append(f"Age: {age}")
        context_parts.extend([
            f"Detected Emotion: {emotion}",
            f"Mental Health Level: {mental_health_level}",
            f"Polypharmacy Risk: {polypharmacy_risk}",
            f"Occupation: {occupation}"
        ])
        if medications:
            context_parts.append(f"Current Medications: {', '.join(medications)}")
        
        context_str = "\n".join(context_parts)
        
        # Craft the prompt for Gemini
        prompt = f"""You are a geriatric health advisor specializing in personalized lifestyle recommendations for elderly patients.

PATIENT CONTEXT:
{context_str}

Your task: Generate a personalized 2-week (14-day) health and wellness plan. The advice should be:
1. Non-medical (focused on lifestyle, not medications)
2. Safe for elderly patients with potential polypharmacy
3. Contextual to the patient's emotional state and occupation
4. Practical and actionable
5. Emphasizing prevention, mental wellness, and quality of life

Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{{
    "summary": "A 1-2 sentence overview of the personalized 2-week plan",
    "week_1": [
        {{"day": 1, "recommendation": "Specific, actionable advice for Day 1"}},
        {{"day": 2, "recommendation": "Specific, actionable advice for Day 2"}},
        {{"day": 3, "recommendation": "Specific, actionable advice for Day 3"}},
        {{"day": 4, "recommendation": "Specific, actionable advice for Day 4"}},
        {{"day": 5, "recommendation": "Specific, actionable advice for Day 5"}},
        {{"day": 6, "recommendation": "Specific, actionable advice for Day 6"}},
        {{"day": 7, "recommendation": "Specific, actionable advice for Day 7"}}
    ],
    "week_2": [
        {{"day": 8, "recommendation": "Specific, actionable advice for Day 8"}},
        {{"day": 9, "recommendation": "Specific, actionable advice for Day 9"}},
        {{"day": 10, "recommendation": "Specific, actionable advice for Day 10"}},
        {{"day": 11, "recommendation": "Specific, actionable advice for Day 11"}},
        {{"day": 12, "recommendation": "Specific, actionable advice for Day 12"}},
        {{"day": 13, "recommendation": "Specific, actionable advice for Day 13"}},
        {{"day": 14, "recommendation": "Specific, actionable advice for Day 14"}}
    ]
}}

Important:
- Each day should have 1-2 actionable recommendations
- Consider the patient's emotional state (e.g., sadness → focus on positive activities)
- Factor in polypharmacy risk (e.g., high risk → emphasize safe activities, hydration, monitoring)
- Make advice relevant to their occupation/lifestyle
- Balance physical activity, mental wellness, nutrition, sleep, and social connection
- Week 2 should build on Week 1 themes with progression/advancement"""

        print(f"🤖 Calling Gemini API with model: gemini-2.0-flash")
        try:
            response = model.generate_content(prompt)
            response_text = response.text.strip()
        except Exception as e:
            error_str = str(e)
            print(f"❌ Gemini API Error: {error_str}")
            
            # Check if it's a model availability error
            if "404" in error_str or "not found" in error_str.lower():
                print(f"⚠️  Model not available. The API key may not have access to gemini-2.0-flash.")
                print(f"   Trying fallback model: gemini-1.5-flash")
                try:
                    # Try fallback model
                    model_fallback = genai.GenerativeModel("gemini-1.5-flash")
                    response = model_fallback.generate_content(prompt)
                    response_text = response.text.strip()
                    print(f"✅ Fallback model (gemini-1.5-flash) succeeded")
                except Exception as e2:
                    print(f"❌ Fallback model also failed: {e2}")
                    return {
                        "error": f"API Error: {error_str[:100]}. Please verify your API key has access to Gemini models.",
                        "week_1": [],
                        "week_2": [],
                        "summary": "",
                        "source": "error"
                    }
            else:
                return {
                    "error": f"API Error: {error_str[:200]}",
                    "week_1": [],
                    "week_2": [],
                    "summary": "",
                    "source": "error"
                }
        
        # Remove markdown code blocks if present
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
            response_text = response_text.strip()
        if response_text.endswith("```"):
            response_text = response_text[:-3].strip()
        
        print(f"📄 Raw Gemini response (first 200 chars): {response_text[:200]}...")
        
        # Parse JSON response
        try:
            advice_data = json.loads(response_text)
        except json.JSONDecodeError as e:
            print(f"❌ JSON Parse Error: {e}")
            print(f"   Attempted to parse: {response_text[:300]}")
            # Try to extract JSON if it's embedded in other text
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                try:
                    advice_data = json.loads(json_match.group())
                    print(f"✅ Extracted JSON successfully")
                except:
                    raise ValueError(f"Could not parse Gemini response as JSON. Response: {response_text[:300]}")
            else:
                raise ValueError(f"No JSON found in Gemini response. Response: {response_text[:300]}")
        
        # Ensure structure is correct
        if "week_1" not in advice_data:
            advice_data["week_1"] = []
        if "week_2" not in advice_data:
            advice_data["week_2"] = []
        if "summary" not in advice_data:
            advice_data["summary"] = ""
        
        advice_data["source"] = "gemini_api"
        
        return advice_data
        
    except json.JSONDecodeError as e:
        print(f"❌ Final JSON Parse Error: {str(e)}")
        return {
            "error": f"Failed to parse Gemini response as JSON: {str(e)[:100]}",
            "week_1": [],
            "week_2": [],
            "summary": "",
            "source": "gemini_api"
        }
    except ValueError as e:
        print(f"❌ Value Error: {str(e)}")
        return {
            "error": str(e)[:200],
            "week_1": [],
            "week_2": [],
            "summary": "",
            "source": "gemini_api"
        }
    except Exception as e:
        print(f"❌ Unexpected error generating advice: {type(e).__name__}: {str(e)[:200]}")
        import traceback
        traceback.print_exc()
        return {
            "error": f"{type(e).__name__}: {str(e)[:150]}",
            "week_1": [],
            "week_2": [],
            "summary": "",
            "source": "gemini_api"
        }
