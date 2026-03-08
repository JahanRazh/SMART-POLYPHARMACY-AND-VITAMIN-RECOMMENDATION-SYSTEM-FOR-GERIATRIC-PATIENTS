from flask import request, jsonify
from datetime import datetime
import uuid
import json
import os
import csv
import random

from db import get_db
from models.meal_plan_model import (
    save_meal_plan_assessment,
    save_generated_meal_plan,
    fetch_latest_meal_plan_assessment,
    fetch_saved_meal_plan,
    save_meal_tracking,
    delete_meal_plan_for_user
)
from models.polyphamacy_risk_model import get_user_profile, get_polypharmacy_assessment


# ==================================================
# PATHS
# ==================================================

FOOD_CSV_PATH = os.path.join(
    os.path.dirname(__file__),
    "../models/MealPlan/food.csv"
)


# ==================================================
# BMI HELPERS
# ==================================================

def _get_bmi_category(bmi: float) -> str:
    if bmi < 18.5:
        return "Underweight"
    elif bmi < 25.0:
        return "Normal weight"
    elif bmi < 30.0:
        return "Overweight"
    else:
        return "Obese"


def _get_daily_calorie_range(bmi: float, activity_level: str = "") -> str:
    activity = (activity_level or "").lower()
    if bmi < 18.5:
        base = (2200, 2800)
    elif bmi < 25.0:
        base = (1800, 2200)
    elif bmi < 30.0:
        base = (1500, 1900)
    else:
        base = (1200, 1600)

    if "moderate" in activity:
        base = (base[0] + 200, base[1] + 200)
    elif "active" in activity or "high" in activity:
        base = (base[0] + 400, base[1] + 400)

    return f"{base[0]}\u2013{base[1]} kcal"


def _get_bmi_advice(bmi_category: str) -> str:
    advice = {
        "Underweight":   "Your BMI is below normal. Focus on nutrient-dense, high-calorie foods to reach a healthy weight.",
        "Normal weight": "Your BMI is within the healthy range. Maintain a balanced diet rich in vegetables, lean protein, and whole grains.",
        "Overweight":    "Your BMI is slightly high. Focus on low-calorie, high-fiber foods to support healthy weight loss.",
        "Obese":         "Your BMI indicates obesity. A calorie-controlled, high-fiber diet with lean proteins is recommended. Consult your doctor.",
    }
    return advice.get(bmi_category, "Maintain a balanced and nutritious diet.")


# ==================================================
# LOAD AND FILTER FOOD CSV
# ==================================================

def _load_foods(conditions: list, bmi_category: str, dietary_restrictions: dict) -> list:
    """
    Load food.csv and return a filtered list of suitable foods.
    Each food is a dict with: description, calories_per_100g.
    """
    exclude_dairy  = dietary_restrictions.get("dairyFree")  or dietary_restrictions.get("Dairy Free")
    exclude_gluten = dietary_restrictions.get("glutenFree") or dietary_restrictions.get("Gluten Free")
    exclude_nuts   = dietary_restrictions.get("nutFree")    or dietary_restrictions.get("Nut Allergy Safe")
    vegetarian     = dietary_restrictions.get("vegetarian") or dietary_restrictions.get("Vegetarian")
    vegan          = dietary_restrictions.get("vegan")      or dietary_restrictions.get("Vegan")

    # Calorie cap per 100g based on BMI
    max_cal = 250 if bmi_category in ("Overweight", "Obese") else 999

    # Medical condition filters
    low_sodium_conditions = {"hypertension", "heart disease", "kidney disease", "high blood pressure"}
    need_low_sodium = any(c.lower() in low_sodium_conditions for c in conditions)

    low_sugar_conditions = {"diabetes", "type 2 diabetes", "prediabetes"}
    need_low_sugar = any(c.lower() in low_sugar_conditions for c in conditions)

    foods = []
    try:
        with open(FOOD_CSV_PATH, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    carb    = float(row.get("Data.Carbohydrate",         0) or 0)
                    protein = float(row.get("Data.Protein",               0) or 0)
                    fat     = float(row.get("Data.Fat.Total Lipid",       0) or 0)
                    sodium  = float(row.get("Data.Major Minerals.Sodium", 0) or 0)
                    sugar   = float(row.get("Data.Sugar Total",           0) or 0)
                    cal     = round(4 * carb + 4 * protein + 9 * fat, 1)

                    if cal > max_cal:
                        continue

                    if exclude_dairy  and row.get("Dairy Free",      "").strip().lower() != "yes":
                        continue
                    if exclude_gluten and row.get("Gluten Free",     "").strip().lower() != "yes":
                        continue
                    if exclude_nuts   and row.get("Nut Allergy Safe","").strip().lower() != "yes":
                        continue
                    if vegan      and row.get("Vegan",      "").strip().lower() != "yes":
                        continue
                    if vegetarian and row.get("Vegetarian", "").strip().lower() != "yes":
                        continue

                    if need_low_sodium and sodium > 400:
                        continue
                    if need_low_sugar  and sugar  > 10:
                        continue

                    foods.append({
                        "description":       row.get("Description", "Unknown Food").strip(),
                        "calories_per_100g": cal,
                    })
                except (ValueError, KeyError):
                    continue
    except Exception as e:
        print(f"⚠️  Could not load food CSV: {e}")

    return foods


# ==================================================
# BUILD WEEKLY MEAL PLAN
# ==================================================

def _build_weekly_plan(foods: list, seed: int = 0) -> dict:
    """
    Build a 7-day meal plan with 7 food items per day at 300g each.
    Returns { "Day 1": { "meals": [...], "total_calories": int }, ... }
    """
    rng = random.Random(seed)
    pool = foods[:]
    rng.shuffle(pool)
    pool_size = len(pool)

    weekly = {}
    for day_num in range(1, 8):
        offset    = ((day_num - 1) * 7) % max(pool_size, 1)
        day_slice = (pool + pool)[offset: offset + 7]
        meals     = []
        total     = 0
        for food in day_slice:
            grams = 300
            cal   = round(food["calories_per_100g"] * grams / 100)
            meals.append(f"\u2022 {food['description']} - {grams}g (~{cal} kcal)")
            total += cal
        weekly[f"Day {day_num}"] = {"meals": meals, "total_calories": total}

    return weekly


# ==================================================
# GENERATE MEAL PLAN (CSV + RULES)
# ==================================================

def generate_full_meal_plan(payload):

    basic          = payload.get("basicProfile", {})
    weight         = float(basic.get("weight", 70)   or 70)
    height         = float(basic.get("height", 165)  or 165)
    bmi_raw        = basic.get("bmi", None)
    activity_level = str(basic.get("activityLevel",  "") or "")

    # Calculate BMI if not provided or invalid
    if bmi_raw is None or str(bmi_raw).strip() in ("", "N/A"):
        height_m = height / 100.0
        bmi = round(weight / (height_m ** 2), 1) if height_m > 0 else 25.0
    else:
        try:
            bmi = float(bmi_raw)
        except (TypeError, ValueError):
            height_m = height / 100.0
            bmi = round(weight / (height_m ** 2), 1) if height_m > 0 else 25.0

    bmi_category        = _get_bmi_category(bmi)
    bmi_advice          = _get_bmi_advice(bmi_category)
    daily_calorie_range = _get_daily_calorie_range(bmi, activity_level)

    # Parse medical conditions
    med_cond_raw = payload.get("medicalConditions", {})
    conditions   = [k for k, v in med_cond_raw.items() if v and k != "other"]
    if med_cond_raw.get("other"):
        conditions.append(str(med_cond_raw["other"]))

    # Parse dietary restrictions
    diet_restrictions = payload.get("dietaryRestrictions", {})

    # Load filtered foods
    foods = _load_foods(conditions, bmi_category, diet_restrictions)

    # Fallback if strict filters yield nothing
    if not foods:
        print("⚠️  No foods after strict filter — relaxing medical filters...")
        foods = _load_foods([], bmi_category, diet_restrictions)

    if not foods:
        print("⚠️  No foods after diet filter — loading all foods...")
        foods = _load_foods([], "Normal weight", {})

    if not foods:
        raise RuntimeError(
            "No foods available to build a meal plan. "
            "Please check the food database at: " + FOOD_CSV_PATH
        )

    # Generate 3 diverse meal plan options
    options = []
    for i in range(3):
        weekly_plan = _build_weekly_plan(foods, seed=i * 42)
        options.append({
            "optionId":   i + 1,
            "name":       f"Plan {i + 1} - Optimized for {bmi_category}",
            "weeklyPlan": weekly_plan,
        })

    return {
        "generatedAt":          datetime.utcnow().isoformat(),
        "bmi":                  bmi,
        "bmi_category":         bmi_category,
        "bmi_advice":           bmi_advice,
        "daily_calorie_range":  daily_calorie_range,
        "mealPlanOptions":      options,
        "aiGenerated":          True,
        "suitable_foods_count": len(foods),
    }


# ==================================================
# CREATE MEAL PLAN
# ==================================================

def create_meal_plan():

    payload = request.get_json(silent=True) or {}

    user_id = payload.get("userId") or payload.get("email")
    if user_id:
        payload["userId"] = user_id

    if "basicProfile" not in payload:
        return jsonify({"error": "basicProfile is required"}), 400

    basic = payload.get("basicProfile", {})
    bmi   = basic.get("bmi")

    if bmi is None:
        return jsonify({"error": "BMI is required"}), 400

    try:
        float(bmi)
    except (TypeError, ValueError):
        return jsonify({"error": "BMI must be a number"}), 400


    # ---------------- USER PROFILE ----------------

    user_id = payload.get("userId")

    if user_id:

        user_profile = get_user_profile(user_id)

        if user_profile:
            payload["user"] = {
                "userId":      user_id,
                "displayName": user_profile.get("displayName", ""),
                "email":       user_profile.get("email", ""),
                "firstName":   user_profile.get("firstName", ""),
                "lastName":    user_profile.get("lastName", ""),
                "photoURL":    user_profile.get("photoURL", ""),
            }

        poly_assessment = get_polypharmacy_assessment(user_id)

        if poly_assessment and "riskCalculation" in poly_assessment:
            payload["polypharmacyRisk"] = poly_assessment["riskCalculation"].get("riskLevel", "N/A")
        else:
            payload["polypharmacyRisk"] = "N/A"


    # ---------------- SAVE FORM DATA ----------------

    saved_form_id = None
    db_error_msg  = None

    try:
        saved_data    = save_meal_plan_assessment(payload)
        saved_form_id = saved_data["id"]
        print(f"✅ Saved form data with ID: {saved_form_id}")
    except Exception as db_error:
        db_error_msg = str(db_error)
        print(f"⚠️  Form save failed: {db_error}")


    # ---------------- GENERATE MEAL PLAN ----------------

    try:
        result = generate_full_meal_plan(payload)

        result["databaseId"]     = saved_form_id
        result["id"]             = saved_form_id
        result["originalPlanId"] = saved_form_id
        result["formDataSaved"]  = bool(saved_form_id)
        result["db_error"]       = db_error_msg

        if "user" in payload:
            result["user"] = payload["user"]

        if "polypharmacyRisk" in payload:
            result["polypharmacyRisk"] = payload["polypharmacyRisk"]

        result["basicProfile"] = payload.get("basicProfile", {})

        med_conditions = payload.get("medicalConditions", {})
        result["conditions"] = [k for k, v in med_conditions.items() if v and k != "other"]
        if med_conditions.get("other"):
            result["conditions"].append(med_conditions["other"])

        diet_restrictions = payload.get("dietaryRestrictions", {})
        result["dietary_restrictions"] = [k for k, v in diet_restrictions.items() if v and k != "other"]
        if diet_restrictions.get("other"):
            result["dietary_restrictions"].append(diet_restrictions["other"])

        result["vitamin_deficiencies"] = payload.get("vitaminDeficiencies", [])
        result["medicalConditions"]    = payload.get("medicalConditions", {})
        result["dietaryRestrictions"]  = payload.get("dietaryRestrictions", {})
        result["userId"]               = payload.get("userId") or payload.get("email")

        for option in result.get("mealPlanOptions", []):
            option["databaseId"]     = saved_form_id
            option["id"]             = saved_form_id
            option["originalPlanId"] = saved_form_id

        try:
            save_generated_meal_plan(result, saved_form_id)
        except Exception as save_err:
            print(f"⚠️  Result save failed: {save_err}")

        return jsonify(result), 200

    except RuntimeError as model_err:
        print(f"❌ Model error: {model_err}")
        return jsonify({"error": str(model_err)}), 503

    except Exception as e:
        print(f"❌ Controller error: {e}")
        return jsonify({"error": str(e)}), 500


# ==================================================
# GET LATEST ASSESSMENT
# ==================================================

def get_latest_assessment():

    user_id = request.args.get("userId")

    if not user_id:
        return jsonify({"error": "userId is required"}), 400

    try:
        assessment = fetch_latest_meal_plan_assessment(user_id)

        if not assessment:
            return jsonify({"message": "No previous assessment found"}), 404

        return jsonify(assessment), 200

    except Exception as e:
        print(f"❌ Error fetching latest assessment: {e}")
        return jsonify({"error": str(e)}), 500


# ==================================================
# GET ACTIVE MEAL PLAN
# ==================================================

def get_active_meal_plan():

    user_id = request.args.get("userId")

    if not user_id:
        return jsonify({"error": "userId is required"}), 400

    try:
        plan = fetch_saved_meal_plan(user_id)

        if not plan:
            return jsonify({"message": "No active meal plan found"}), 404

        return jsonify(plan), 200

    except Exception as e:
        print(f"❌ Error fetching active plan: {e}")
        return jsonify({"error": str(e)}), 500


# ==================================================
# TRACK MEAL CONSUMPTION
# ==================================================

def track_meal_consumption():

    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No data provided"}), 400

        required = ["userId", "planId", "day", "consumedMeals"]

        for field in required:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        result = save_meal_tracking(data)

        return jsonify({
            "status":  "success",
            "message": "Meal tracking progress saved",
            "id":      result.get("id")
        }), 201

    except Exception as e:
        print(f"❌ Error in track_meal_consumption: {e}")
        return jsonify({"error": str(e)}), 500


# ==================================================
# DELETE MEAL PLAN
# ==================================================

def delete_meal_plan():

    user_id = request.args.get("userId")

    if not user_id:
        return jsonify({"error": "userId is required"}), 400

    try:
        result = delete_meal_plan_for_user(user_id)

        return jsonify({
            "status":  "success",
            "message": "Meal plan deleted successfully",
            "details": result
        }), 200

    except Exception as e:
        print(f"❌ Error in delete_meal_plan: {e}")
        return jsonify({"error": str(e)}), 500


# ==================================================
# GET MEAL TRACKING FOR PLAN
# ==================================================

def get_meal_tracking_for_plan():

    user_id = request.args.get("userId")
    plan_id = request.args.get("planId")

    if not user_id or not plan_id:
        return jsonify({"error": "userId and planId are required"}), 400

    try:
        from models.meal_plan_model import fetch_meal_tracking

        logs = fetch_meal_tracking(user_id, plan_id)

        return jsonify(logs), 200

    except Exception as e:
        print(f"❌ Error in get_meal_tracking_for_plan: {e}")
        return jsonify({"error": str(e)}), 500