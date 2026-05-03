import os
import csv
import random
import joblib
import traceback
from datetime import datetime
from flask import request, jsonify

BASE_DIR    = os.path.dirname(__file__)
FOOD_CSV    = os.path.join(BASE_DIR, "../models/MealPlan/food.csv")
MODEL_PATH  = os.path.join(BASE_DIR, "../models/MealPlan/meal_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "../models/MealPlan/scaler.pkl")
COLS_PATH   = os.path.join(BASE_DIR, "../models/MealPlan/feature_cols.pkl")

# ── Global cache (loaded once per process) ───────────────────────────────────
_model     = None
_scaler    = None
_feat_cols = None
_ALL_FOODS = None   # list of dicts, loaded from CSV

# ── Keyword lists ─────────────────────────────────────────────────────────────
MEAT_KW = [
    "meat","beef","pork","chicken","turkey","lamb","fish","shrimp","crab",
    "lobster","seafood","bacon","ham","steak","fillet","mussel","oyster",
    "scallop","squid","octopus","salmon","tuna","venison","duck","veal",
    "sardine","anchovy","tilapia","liver","kidney","tongue","gelatin","lard",
]
DAIRY_EGG_KW = [
    "milk","cheese","cream","yogurt","butter","egg","honey","whey",
    "casein","lard","gelatin","kefir","ghee",
]
NUT_KW = [
    "nut","peanut","almond","walnut","cashew","pistachio","pecan",
    "hazelnut","brazil nut","macadamia","pine nut",
]


# =============================================================================
# LOADERS
# =============================================================================
def get_ml_model():
    global _model, _scaler, _feat_cols
    if _model is None:
        if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            _model     = joblib.load(MODEL_PATH)
            _scaler    = joblib.load(SCALER_PATH)
            _feat_cols = joblib.load(COLS_PATH) if os.path.exists(COLS_PATH) else None
            print("✅ ML model loaded")
        else:
            print("⚠️  ML model not found — run train_meal_model.py first")
    return _model, _scaler, _feat_cols


def load_foods_from_csv():
    foods = []
    if not os.path.exists(FOOD_CSV):
        print("❌ food.csv NOT FOUND:", FOOD_CSV)
        return foods

    def fv(row, col):
        return float(row.get(col, 0) or 0)

    try:
        if not os.path.exists(FOOD_CSV):
            print(f"❌ CRITICAL: food.csv NOT FOUND at {FOOD_CSV}")
            return foods

        with open(FOOD_CSV, newline='', encoding='utf-8') as f:
            data = list(csv.DictReader(f))
            print(f"📊 CSV raw rows read: {len(data)}")

        for i, row in enumerate(data):
            try:
                name     = row.get("Description", "Unknown")
                category = row.get("Category", "Unknown")
                txt      = f"{name} {category}".lower()

                # Robust parsing for dietary flags
                def is_true(col):
                    val = str(row.get(col, "0")).strip()
                    return val == "1" or val.lower() == "true"

                is_veg  = is_true("Vegetarian") and not any(k in txt for k in MEAT_KW)
                is_vegan= is_true("Vegan") and is_veg and not any(k in txt for k in DAIRY_EGG_KW)
                is_gf   = is_true("Gluten Free")
                is_df   = is_true("Dairy Free") and not any(k in txt for k in DAIRY_EGG_KW)
                is_nut  = is_true("Nut Allergy Safe") and not any(k in txt for k in NUT_KW)

                carbs   = fv(row, "Data.Carbohydrate")
                protein = fv(row, "Data.Protein")
                fat     = fv(row, "Data.Fat.Total Lipid")

                foods.append({
                    "name":       name,
                    "category":   category,
                    "vegetarian": int(is_veg),
                    "vegan":      int(is_vegan),
                    "glutenFree": int(is_gf),
                    "dairyFree":  int(is_df),
                    "nutAllergy": int(is_nut),
                    "carbs":      carbs,
                    "protein":    protein,
                    "fat":        fat,
                    "sugar":      fv(row, "Data.Sugar Total"),
                    "fiber":      fv(row, "Data.Fiber"),
                    "sodium":     fv(row, "Data.Major Minerals.Sodium"),
                    "cholesterol":fv(row, "Data.Cholesterol"),
                    "water":      fv(row, "Data.Water"),
                    "vitA":       fv(row, "Data.Vitamins.Vitamin A - RAE"),
                    "vitB12":     fv(row, "Data.Vitamins.Vitamin B12"),
                    "vitB6":      fv(row, "Data.Vitamins.Vitamin B6"),
                    "vitC":       fv(row, "Data.Vitamins.Vitamin C"),
                    "vitE":       fv(row, "Data.Vitamins.Vitamin E"),
                    "vitK":       fv(row, "Data.Vitamins.Vitamin K"),
                    "calcium":    fv(row, "Data.Major Minerals.Calcium"),
                    "iron":       fv(row, "Data.Major Minerals.Iron"),
                    "magnesium":  fv(row, "Data.Major Minerals.Magnesium"),
                    "phosphorus": fv(row, "Data.Major Minerals.Phosphorus"),
                    "potassium":  fv(row, "Data.Major Minerals.Potassium"),
                    "zinc":       fv(row, "Data.Major Minerals.Zinc"),
                    "calories":   round(carbs * 4 + protein * 4 + fat * 9),
                    "score":      50.0,
                })
            except Exception as e:
                if i < 5: print(f"⚠️ Row {i} error: {e}")
                continue

        print(f"✅ Successfully processed {len(foods)} foods")
    except Exception as e:
        print("🔥 load_foods_from_csv CRITICAL ERROR:", e)
        traceback.print_exc()

    return foods


def get_foods():
    """Return cached food list, loading from CSV on first call."""
    global _ALL_FOODS
    if _ALL_FOODS is None:
        print("📦 Caching food dataset...")
        _ALL_FOODS = load_foods_from_csv()
    return _ALL_FOODS


# =============================================================================
# BMI HELPERS
# =============================================================================
def calculate_bmi(weight, height):
    h = height / 100.0
    return round(weight / (h * h), 1)


def get_bmi_category(bmi):
    if bmi < 18.5: return "Underweight"
    elif bmi < 25: return "Normal"
    elif bmi < 30: return "Overweight"
    return "Obese"


def get_daily_calorie_target(gender, age, activity, bmi_cat):
    """
    Calculate daily calorie needs for seniors (65+) based on clinical standards.
    Women: 1600 (Sedentary) - 2200 (Active)
    Men: 2000 (Sedentary) - 2600 (Active)
    """
    targets = {
        "male": {
            "sedentary": 2000,
            "light": 2100,
            "moderate": 2200,
            "active": 2400,
            "very active": 2500
        },
        "female": {
            "sedentary": 1600,
            "light": 1700,
            "moderate": 1800,
            "active": 2000,
            "very active": 2100
        }
    }
    
    # Normalize inputs
    g = str(gender).lower() if gender else "female"
    if g not in ["male", "female"]: g = "female"
    
    act = str(activity).lower()
    if "very active" in act: a = "very active"
    elif "active" in act: a = "active"
    elif "moderate" in act: a = "moderate"
    elif "light" in act: a = "light"
    else: a = "sedentary"
    
    base_target = targets[g][a]
    
    # Geriatric Weight Management (Weight loss deficit or Gain surplus)
    if bmi_cat == "Obese":
        base_target -= 450  # Targets ~0.5kg/week loss
    elif bmi_cat == "Overweight":
        base_target -= 250
    elif bmi_cat == "Underweight":
        base_target += 300  # High nutrient density surplus
        
    # Safety Floor Constraints for Seniors
    if g == "female":
        return max(1200, base_target)
    else:
        return max(1500, base_target)


def get_portion(bmi_cat, activity):
    # This legacy function is kept for backward compatibility if needed elsewhere
    base = 300
    if bmi_cat == "Underweight": base = 380
    elif bmi_cat == "Obese":     base = 240
    elif bmi_cat == "Overweight":base = 270
    activity_map = {"sedentary": 0, "light": 30, "moderate": 60, "active": 100, "very active": 130}
    base += activity_map.get(activity.lower(), 0)
    return base


# =============================================================================
# ML SCORING  (uses all 40 features matching training)
# =============================================================================
def score_foods_with_ml(foods, payload):
    """
    Score every food using the trained model.
    Falls back to rule-based scoring if model unavailable.
    """
    model, scaler, feat_cols = get_ml_model()

    basic      = payload.get("basicProfile", {})
    conditions = payload.get("medicalConditions", {})
    diet       = payload.get("dietaryRestrictions", {})
    vitamins   = payload.get("vitaminDeficiencies", [])
    preferences= payload.get("foodPreferences", {})

    # ── Parse user features ───────────────────────────────────────
    try:    age = float(basic.get("age", 60))
    except: age = 60.0

    gender   = 1 if str(basic.get("gender","")).lower() == "male" else 0
    bmi      = calculate_bmi(float(basic.get("weight", 65)), float(basic.get("height", 165)))
    act_map  = {"sedentary": 0, "light": 1, "moderate": 2, "active": 3, "very active": 3}
    activity = act_map.get(str(basic.get("activityLevel","sedentary")).lower(), 0)

    diabetes       = 1 if conditions.get("diabetes")     else 0
    hypertension   = 1 if conditions.get("hypertension") else 0
    heart_disease  = 1 if conditions.get("heartDisease") else 0

    veg  = 1 if diet.get("vegetarian") else 0
    vegan= 1 if diet.get("vegan")      else 0
    gf   = 1 if diet.get("glutenFree") else 0
    df   = 1 if diet.get("dairyFree")  else 0
    nut  = 1 if diet.get("nutAllergy") else 0

    # Vitamin deficiency flags
    vit_list = [str(v).lower() for v in vitamins]
    def has_vit(*keys): return int(any(k in v for k in keys for v in vit_list))
    def_vitA    = has_vit("vitamin a", "vita")
    def_vitB12  = has_vit("b12", "vitamin b12")
    def_vitC    = has_vit("vitamin c", "vitc")
    def_iron    = has_vit("iron")
    def_calcium = has_vit("calcium")
    def_zinc    = has_vit("zinc")

    # Food preferences
    liked    = [str(x).lower().strip() for x in preferences.get("liked",    [])] if preferences else []
    disliked = [str(x).lower().strip() for x in preferences.get("disliked", [])] if preferences else []

    if model and scaler:
        try:
            batch = []
            for food in foods:
                nl = food["name"].lower()
                liked_flag    = int(any(kw in nl for kw in liked))
                disliked_flag = int(any(kw in nl for kw in disliked))

                batch.append([
                    # user (18)
                    age, gender, bmi, activity,
                    diabetes, hypertension, heart_disease,
                    veg, vegan, gf, df, nut,
                    def_vitA, def_vitB12, def_vitC,
                    def_iron, def_calcium, def_zinc,
                    # preferences (2)
                    liked_flag, disliked_flag,
                    # food nutrients (20)
                    food["carbs"],    food["protein"],   food["fat"],
                    food["sugar"],    food["fiber"],     food["sodium"],
                    food["cholesterol"], food["water"],
                    food["vitA"],     food["vitB12"],    food["vitB6"],
                    food["vitC"],     food["vitE"],      food["vitK"],
                    food["calcium"],  food["iron"],
                    food["magnesium"],food["phosphorus"],
                    food["potassium"],food["zinc"],
                ])

            scores = model.predict(scaler.transform(batch))
            for i, food in enumerate(foods):
                food["score"] = float(scores[i])

            # Hard penalty: disliked foods go to bottom
            for food in foods:
                nl = food["name"].lower()
                if any(kw in nl for kw in disliked):
                    food["score"] = max(0.0, food["score"] - 30)

            print("✅ ML scoring applied")
            return

        except Exception as e:
            print(f"⚠️  ML scoring failed ({e}), using fallback")
            traceback.print_exc()

    # ── Fallback rule-based scoring ───────────────────────────────
    for food in foods:
        s = 55.0
        nl = food["name"].lower()
        if any(kw in nl for kw in liked):    s += 15
        if any(kw in nl for kw in disliked): s -= 25
        if diabetes:
            s -= food["sugar"] * 0.8
            s += food["fiber"] * 2.0
        if hypertension:
            s -= max(0, food["sodium"] - 200) * 0.04
        if heart_disease:
            s -= food["fat"] * 0.6
        if bmi > 30:
            s -= food["calories"] * 0.02
            s += food["fiber"] * 1.5
        elif bmi < 18.5:
            s += food["protein"] * 0.5
        if def_vitA:    s += food["vitA"]   * 0.1
        if def_vitB12:  s += food["vitB12"] * 2.0
        if def_vitC:    s += food["vitC"]   * 0.2
        if def_iron:    s += food["iron"]   * 1.5
        if def_calcium: s += food["calcium"]* 0.05
        if def_zinc:    s += food["zinc"]   * 1.0
        food["score"] = float(max(0.0, min(100.0, s)))


# =============================================================================
# DIETARY FILTER
# =============================================================================
def filter_foods(all_foods, diet):
    filtered = []
    for food in all_foods:
        nl   = food["name"].lower()
        safe = True
        if diet.get("vegetarian") and (not food["vegetarian"] or any(k in nl for k in MEAT_KW)):
            safe = False
        if diet.get("vegan") and (not food["vegan"] or any(k in nl for k in MEAT_KW + DAIRY_EGG_KW)):
            safe = False
        if diet.get("glutenFree") and not food["glutenFree"]:
            safe = False
        if diet.get("dairyFree") and (not food["dairyFree"] or any(k in nl for k in DAIRY_EGG_KW)):
            safe = False
        if diet.get("nutAllergy") and (not food["nutAllergy"] or any(k in nl for k in NUT_KW)):
            safe = False
        if safe:
            filtered.append(food)

    # Fallback if nothing passes
    if not filtered:
        print("⚠️ No foods matched restrictions — using safe fallback")
        fallback = [f for f in all_foods if any(
            kw in f["name"].lower() for kw in ["apple","rice","banana","water","oat","vegetable"]
        )]
        filtered = fallback if fallback else all_foods[:200]

    return filtered


# =============================================================================
# PLAN BUILDER  (balanced by category)
# =============================================================================
def build_plan(foods, daily_goal, days=28, meals_per_day=5):
    if not foods:
        return {"Day 1": {"meals": ["No foods available"], "total_calories": 0}}

    # Target calories per meal
    cpm = daily_goal / meals_per_day

    # Group by category
    by_cat = {}
    for f in foods:
        c = f.get("category", "Other")
        by_cat.setdefault(c, []).append(f)

    # Sort each category by score descending
    for c in by_cat:
        by_cat[c].sort(key=lambda x: x.get("score", 0), reverse=True)

    cat_names    = list(by_cat.keys())
    food_indices = {c: 0 for c in cat_names}
    weekly       = {}

    for d in range(1, days + 1):
        meals = []
        total = 0
        for m in range(meals_per_day):
            cat   = cat_names[(d * meals_per_day + m) % len(cat_names)]
            pool  = by_cat[cat]
            food  = pool[food_indices[cat] % len(pool)]
            food_indices[cat] += 1

            # Calories per 100g
            cal_100 = food.get("calories", 200)
            if cal_100 <= 0: cal_100 = 50 # safety fallback
            
            # Calculate grams needed to reach cpm
            # cpm = (cal_100 * grams) / 100  => grams = (cpm * 100) / cal_100
            grams = round((cpm * 100) / cal_100)
            
            # Sanity limits for senior portions: cap at 300g
            grams = max(50, min(300, grams))
            actual_cal = round((cal_100 * grams) / 100)
            
            meals.append(f"• {food['name']} ({cat}) - {grams}g (~{actual_cal} kcal)")
            total += actual_cal

        weekly[f"Day {d}"] = {
            "meals":         meals,
            "total_calories": total,
        }

    return weekly


# =============================================================================
# MAIN GENERATOR
# =============================================================================
def generate_meal_plan(payload):
    basic    = payload.get("basicProfile", {})
    weight   = float(basic.get("weight", 65))
    height   = float(basic.get("height", 165))
    activity = str(basic.get("activityLevel", "sedentary"))

    bmi     = calculate_bmi(weight, height)
    bmi_cat = get_bmi_category(bmi)
    
    # Calculate target calories based on Geriatric Standards
    gender = basic.get("gender", "female")
    age = float(basic.get("age", 65))
    daily_goal = get_daily_calorie_target(gender, age, activity, bmi_cat)
    
    # Legacy portion for reference or fallback
    portion = get_portion(bmi_cat, activity)

    # Load (cached) food list
    all_foods = get_foods()
    if not all_foods:
        raise ValueError("Food dataset is empty or not accessible.")

    # Score every food with ML
    score_foods_with_ml(all_foods, payload)

    # Dietary filter
    diet     = payload.get("dietaryRestrictions", {})
    filtered = filter_foods(all_foods, diet)

    # Take top foods per category for variety
    by_cat = {}
    for f in filtered:
        by_cat.setdefault(f.get("category","Other"), []).append(f)

    top_pool = []
    for c, foods_in_cat in by_cat.items():
        top = sorted(foods_in_cat, key=lambda x: x.get("score", 0), reverse=True)[:25]
        top_pool.extend(top)

    if not top_pool:
        raise ValueError("No suitable foods found after filtering.")

    # Generate plan options
    # Set days to 28 (1 month) and meals per day to a random value between 7 and 10
    total_days = 28
    meals_count = random.randint(7, 10)
    print(f"🚀 Generating plan for {total_days} days with {meals_count} meals per day")

    options = []
    for i in range(3):
        random.shuffle(top_pool)
        options.append({
            "optionId":   i + 1,
            "name":       f"AI Meal Plan {i + 1}",
            "weeklyPlan": build_plan(top_pool, daily_goal, days=total_days, meals_per_day=meals_count),
        })

    return {
        "userId":          payload.get("userId"),
        "patient_name":    basic.get("name", "Patient"),
        "bmi":             bmi,
        "bmi_category":    bmi_cat,
        "portion_grams":   portion,
        "daily_calorie_range": int(daily_goal),
        "mealPlanOptions": options,
        "plan_duration":   f"{total_days} Days",
        "meals_per_day":   meals_count,
        "generatedAt":     datetime.utcnow().isoformat(),
        "aiGenerated":     True,
    }


# =============================================================================
# FLASK CONTROLLERS
# =============================================================================
def create_meal_plan():
    from models.meal_plan_model import save_meal_plan_assessment, save_generated_meal_plan
    payload = request.get_json()
    if not payload:
        return jsonify({"error": "No JSON payload received"}), 400
    try:
        result = generate_meal_plan(payload)
        save_meal_plan_assessment(payload)
        save_generated_meal_plan(result, payload.get("userId"))
        return jsonify(result), 200
    except Exception as e:
        print("🔥 CREATE ERROR:", str(e))
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


def get_latest_assessment():
    from models.meal_plan_model import fetch_latest_meal_plan_assessment
    user_id = request.args.get("userId")
    if not user_id:
        return jsonify({"error": "userId required"}), 400
    try:
        return jsonify(fetch_latest_meal_plan_assessment(user_id)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def get_active_meal_plan():
    from models.meal_plan_model import fetch_saved_meal_plan
    user_id = request.args.get("userId")
    if not user_id:
        return jsonify({"error": "userId required"}), 400
    try:
        data = fetch_saved_meal_plan(user_id)
        if not data:
            return jsonify({"message": "No active plan"}), 404
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def track_meal_consumption():
    from models.meal_plan_model import save_meal_tracking
    try:
        return jsonify(save_meal_tracking(request.get_json())), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def get_meal_tracking_for_plan():
    from models.meal_plan_model import fetch_meal_tracking
    u = request.args.get("userId")
    p = request.args.get("planId")
    if not u or not p:
        return jsonify({"error": "userId and planId required"}), 400
    try:
        return jsonify(fetch_meal_tracking(u, p)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def delete_meal_plan():
    from models.meal_plan_model import delete_meal_plan_for_user
    user_id = request.args.get("userId")
    if not user_id:
        return jsonify({"error": "userId required"}), 400
    try:
        return jsonify(delete_meal_plan_for_user(user_id)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500