# MealPlan/meal_logic.py - FINAL ENGLISH VERSION WITH BMI-BASED CALORIE ADJUSTMENT

import pandas as pd
from pulp import *
import random
import os
import pickle
import json
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import warnings

# Suppress harmless sklearn warning about feature names
warnings.filterwarnings("ignore", message="X does not have valid feature names")


# ==================================================
# PATHS
# ==================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "food.csv")
MODEL_PATH = os.path.join(BASE_DIR, "meal_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "scaler.pkl")

df = None
vitamin_model = None
scaler = None

# ==================================================
# LOAD DATASET – ONLY food.csv
# ==================================================
def load_dataset():
    global df
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(f"food.csv not found at {CSV_PATH}")
    
    df = pd.read_csv(CSV_PATH)
    
    nutrient_cols = [
        "Data.Carbohydrate", "Data.Protein", "Data.Fat.Total Lipid",
        "Data.Sugar Total", "Data.Major Minerals.Sodium", "Data.Fiber",
        "Data.Vitamins.Vitamin A - RAE", "Data.Vitamins.Vitamin C",
        "Data.Vitamins.Vitamin B12", "Data.Cholesterol",
        "Data.Major Minerals.Calcium", "Data.Major Minerals.Potassium"
    ]
    
    for col in nutrient_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    
    df[nutrient_cols] = df[nutrient_cols].fillna(0)
    
    df["Calories"] = (
        df["Data.Carbohydrate"] * 4 +
        df["Data.Protein"] * 4 +
        df["Data.Fat.Total Lipid"] * 9
    )
    df["Calories"] = df["Calories"].fillna(0)
    
    return df

# ==================================================
# TRAIN & SAVE AI MODEL
# ==================================================
def train_and_save_model():
    global vitamin_model, scaler
    print("Training new AI Health Model...")
    
    features = [
        "Data.Carbohydrate", "Data.Protein", "Data.Fat.Total Lipid",
        "Data.Sugar Total", "Data.Major Minerals.Sodium",
        "Data.Fiber", "Data.Cholesterol", "Calories"
    ]
    
    healthy = (
        (df["Data.Sugar Total"] < 10) &
        (df["Data.Major Minerals.Sodium"] < 200) &
        (df["Data.Fiber"] > 1.5) &
        (df["Calories"] > 30) &
        (df["Calories"] < 350) &
        (df["Data.Protein"] > 2)
    )
    
    y = healthy.astype(int)
    X = df[features]
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
    
    vitamin_model = RandomForestClassifier(n_estimators=200, random_state=42, class_weight="balanced")
    vitamin_model.fit(X_train, y_train)
    
    accuracy = vitamin_model.score(X_test, y_test)
    print(f"Model trained successfully | Accuracy: {accuracy:.3f}")
    
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(vitamin_model, f)
    with open(SCALER_PATH, "wb") as f:
        pickle.dump(scaler, f)
    print("New model files saved!")

# ==================================================
# AI SCORING (VECTORIZED BATCH)
# ==================================================
def batch_ai_food_score(data_df):
    if vitamin_model is None or scaler is None:
        return [0.6] * len(data_df)
    
    features = [
        "Data.Carbohydrate", "Data.Protein", "Data.Fat.Total Lipid",
        "Data.Sugar Total", "Data.Major Minerals.Sodium",
        "Data.Fiber", "Data.Cholesterol", "Calories"
    ]
    
    try:
        scaled = scaler.transform(data_df[features])
        probs = vitamin_model.predict_proba(scaled)[:, 1]
        return probs
    except Exception as e:
        print("Batch AI Scoring failed:", e)
        return [0.5] * len(data_df)

# ==================================================
# LOAD DATA & MODEL (LAZY LOADING)
# ==================================================
_system_initialized = False

def initialize_system():
    global df, vitamin_model, scaler, _system_initialized
    if _system_initialized:
        return

    df = load_dataset()

    if not (os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH)):
        train_and_save_model()
    else:
        try:
            with open(MODEL_PATH, "rb") as f:
                vitamin_model = pickle.load(f)
            with open(SCALER_PATH, "rb") as f:
                scaler = pickle.load(f)
        except Exception as e:
            print(f"Model load failed ({e}) – retraining...")
            train_and_save_model()

    # Vectorized scoring takes milliseconds instead of seconds
    df["ai_score"] = batch_ai_food_score(df)
    _system_initialized = True

# ==================================================
# FILTER FOODS
# ==================================================
def filter_foods(patient_data, active_conditions):
    filtered = df[df["ai_score"] > 0.35].copy()
    desc_lower = filtered["Description"].str.lower().fillna("")
    
    restrictions = patient_data.get("dietaryRestrictions", {})
    preferences = patient_data.get("preferences", {})
    
    # Preferred foods boost
    preferred_foods = preferences.get("preferredFoods", "")

    if preferred_foods:
        preferred_list = [f.strip().lower() for f in preferred_foods.split(",") if f.strip()]
        
        for food in preferred_list:
            mask = filtered["Description"].str.lower().str.contains(food, na=False)
            
            # Give massive priority boost
            filtered.loc[mask, "ai_score"] += 1000
        
        print("Preferred foods prioritized:", preferred_list)
    
    if restrictions.get("vegan", False) or restrictions.get("vegetarian", False):
        animal_keywords = ["milk", "yogurt", "cheese", "butter", "egg", "fish", "meat", "chicken", "beef", "pork", "tuna", "salmon", "honey"]
        filtered = filtered[~desc_lower.str.contains("|".join(animal_keywords))]
    
    if restrictions.get("dairyFree", False):
        dairy_keywords = ["milk", "yogurt", "cheese", "butter", "cream", "whey", "casein"]
        filtered = filtered[~desc_lower.str.contains("|".join(dairy_keywords))]
    
    if restrictions.get("nutAllergy", False):
        nut_keywords = ["almond", "nut", "peanut", "cashew", "walnut", "coconut", "hazelnut", "pecan"]
        filtered = filtered[~desc_lower.str.contains("|".join(nut_keywords))]
    
    if restrictions.get("glutenFree", False):
        gluten_keywords = ["wheat", "bread", "bun", "pasta", "flour", "barley", "rye", "malt"]
        filtered = filtered[~desc_lower.str.contains("|".join(gluten_keywords))]
    
    dislikes = preferences.get("foodDislikes", "")
    if dislikes:
        for item in [d.strip().lower() for d in dislikes.split(",") if d.strip()]:
            filtered = filtered[~desc_lower.str.contains(item, regex=False)]
    
    if "diabetes" in active_conditions:
        filtered = filtered[filtered["Data.Sugar Total"] < 8]
    if "hypertension" in active_conditions:
        filtered = filtered[filtered["Data.Major Minerals.Sodium"] < 140]
    
    if any("vitamin_a" in c for c in active_conditions):
        filtered = filtered.nlargest(500, "Data.Vitamins.Vitamin A - RAE")
    if any("vitamin_c" in c for c in active_conditions):
        filtered = filtered.nlargest(500, "Data.Vitamins.Vitamin C")
    
    filtered = filtered[
        (filtered["Calories"] > 20) & 
        (filtered["Calories"] < 400)
    ].reset_index(drop=True)
    
    print(f"Filtered to {len(filtered)} suitable foods")
    return filtered

# ==================================================
# CLINICAL PREPARATION DATA
# ==================================================
PREP_TIPS = {
    "vitamin_a_deficiency": [
        "Carotenoids (Vit A) are fat-soluble. Always cook these with a small amount of healthy oil/fat to double absorption.",
        "Mashing or pureeing carrots/sweet potatoes increases the availability of Vitamin A by breaking down plant walls."
    ],
    "vitamin_c_deficiency": [
        "Vitamin C is heat-sensitive. Avoid prolonged boiling; brief steaming or raw consumption preserves the highest nutrient content.",
        "Store cut fruits and vegetables in airtight containers and consume quickly, as oxygen lightens the Vitamin C content."
    ],
    "vitamin_b12_deficiency": [
        "For B12 sourced from meats, avoid overcooking (well-done), as extreme heat can reduce B12 concentration by up to 30%.",
        "Fermented foods listed in your plan can help naturally improve the gut environment for B12 absorption."
    ],
    "diabetes": [
        "Allow cooked starches (like potatoes or rice) to cool slightly before eating; this creates 'resistant starch' which lowers the glycemic index.",
        "Pair all fruits with nuts or seeds to slow down sugar absorption."
    ],
    "hypertension": [
        "Use lemon juice, zest, or fresh herbs instead of any salt during the preparation phase to keep sodium levels clinical.",
        "Rinse any canned beans or vegetables thoroughly under cold water to remove up to 40% of residual sodium."
    ]
}

SAFETY_ALERTS = {
    "High": [
        "MEDICATION SAFETY: Avoid Grapefruit and Seville oranges as they interact with common geriatric medications.",
        "Check with your doctor before using salt substitutes (Potassium Chloride) if you are on ACE inhibitors."
    ],
    "Very High": [
        "CRITICAL SAFETY: Maintain consistent Vitamin K intake. Avoid sudden increases in leafy greens if on blood thinners.",
        "Limit caffeine and alcohol strictly as they increase the risk of drug-drug adverse reactions in polypharmacy cases."
    ],
    "Moderate": [
        "Safety Note: Take medications at least 1 hour before or 2 hours after high-fiber meals to ensure proper drug absorption."
    ]
}

def get_clinical_guides(active_conditions, poly_risk):
    guides = []
    alerts = []
    
    for condition in active_conditions:
        if condition in PREP_TIPS:
            guides.extend(PREP_TIPS[condition])
            
    risk_level = poly_risk if poly_risk else "Low"
    if risk_level in SAFETY_ALERTS:
        alerts.extend(SAFETY_ALERTS[risk_level])
        
    # Return unique items
    return list(dict.fromkeys(guides)), list(dict.fromkeys(alerts))

# ==================================================
# DAILY MEAL PLAN – Now accepts dynamic calorie range
# ==================================================
def generate_daily_plan(filtered_df, seed=42, calorie_min=1800, calorie_max=2200):
    random.seed(seed)
    if len(filtered_df) < 5:
        return {"breakfast": [], "lunch": [], "dinner": ["Not enough suitable foods"]}, 0
    
    foods = filtered_df.nlargest(80, "ai_score").sample(n=min(50, len(filtered_df)), random_state=seed)
    
    prob = LpProblem("DailyMeal", LpMinimize)
    x = {i: LpVariable(f"x{i}", 0, 3, LpInteger) for i in range(len(foods))}
    
    # Objective: minimize calories while maximizing AI health score
    prob += (
        lpSum(foods.iloc[i]["Calories"] * x[i] for i in x) -
        200 * lpSum(foods.iloc[i]["ai_score"] * x[i] for i in x)
    )
    
    # Dynamic calorie constraints based on BMI
    prob += lpSum(foods.iloc[i]["Calories"] * x[i] for i in x) >= calorie_min
    prob += lpSum(foods.iloc[i]["Calories"] * x[i] for i in x) <= calorie_max
    prob += lpSum(foods.iloc[i]["Data.Protein"] * x[i] for i in x) >= 60
    prob += lpSum(foods.iloc[i]["Data.Fiber"] * x[i] for i in x) >= 25
    prob += lpSum(foods.iloc[i]["Data.Sugar Total"] * x[i] for i in x) <= 50
    
    status = prob.solve(PULP_CBC_CMD(msg=0, timeLimit=8))
    
    def format_meal(row, multiplier=1.0):
        grams = int(100 * multiplier)
        kcal = int(row['Calories'] * multiplier)
        name = row['Description']
        name = name[:57] + "..." if len(name) > 60 else name
        return f"• {name} - {grams}g (~{kcal} kcal)"

    if LpStatus[status] != "Optimal":
        fallback = foods.nlargest(6, "ai_score")
        plan_items = [format_meal(row, 1.5) for _, row in fallback.iterrows()]
        return plan_items, int((calorie_min + calorie_max) / 2)
    
    plan_items = []
    total_cal = 0
    for i in x:
        qty = value(x[i])
        if qty > 0:
            grams = int(qty * 100)
            kcal = int(foods.iloc[i]["Calories"] * qty)
            name = foods.iloc[i]["Description"]
            name = name[:57] + "..." if len(name) > 60 else name
            plan_items.append(f"• {name} - {grams}g (~{kcal} kcal)")
            total_cal += kcal
            
    # Need at least 3 items
    while len(plan_items) < 3:
        fallback_item = foods.sample(1).iloc[0]
        plan_items.append(format_meal(fallback_item, 1.0))
        total_cal += int(fallback_item['Calories'])
    
    return plan_items, int(total_cal)

# ==================================================
# MAIN FUNCTION – Now uses BMI to adjust calories and give advice
# ==================================================
def generate_full_meal_plan(patient_data):
    initialize_system()
    
    basic = patient_data.get("basicProfile", {})
    medical = patient_data.get("medicalConditions", {})
    vitamin_defs = patient_data.get("vitaminDeficiencies", [])
    
    patient_name = basic.get("name", "Patient")
    bmi = float(basic.get("bmi", 22))
    
    # BMI-based calorie targets and advice
    if bmi < 18.5:
        bmi_category = "Underweight"
        calorie_min, calorie_max = 2200, 2800
        bmi_advice = "Your BMI is low. To gain healthy weight, focus on protein-rich and calorie-dense foods."
    elif 18.5 <= bmi < 25:
        bmi_category = "Normal Weight"
        calorie_min, calorie_max = 1800, 2200
        bmi_advice = "Your BMI is in the healthy range. Maintain your current weight with balanced meals."
    elif 25 <= bmi < 30:
        bmi_category = "Overweight"
        calorie_min, calorie_max = 1500, 1900
        bmi_advice = "Your BMI is slightly high. Focus on low-calorie, high-fiber foods to support healthy weight loss."
    else:  # BMI >= 30
        bmi_category = "Obese"
        calorie_min, calorie_max = 1400, 1800
        bmi_advice = "Your BMI is high. Consult a doctor and follow a low-calorie, nutrient-rich diet."

    active_conditions = []
    if medical.get("diabetes"): active_conditions.append("diabetes")
    if medical.get("hypertension"): active_conditions.append("hypertension")
    
    for vd in vitamin_defs:
        name = vd.get("name", "").lower()
        if "vitamin a" in name: active_conditions.append("vitamin_a_deficiency")
        if "vitamin c" in name: active_conditions.append("vitamin_c_deficiency")

    foods = filter_foods(patient_data, active_conditions)
    
    # Extra fiber boost for overweight/obese patients
    if bmi >= 25:
        foods = foods.nlargest(500, "Data.Fiber")
    
    if len(foods) < 8:
        return {
            "success": False,
            "error": f"Too few suitable foods found ({len(foods)}). Please relax some restrictions."
        }
    
    # Automatically determine duration based on vitamin deficiency levels
    has_severe = any(vd.get("level", "") == "Severe" for vd in vitamin_defs)
    has_moderate = any(vd.get("level", "") == "Moderate" for vd in vitamin_defs)
    
    if has_severe:
        num_days = 180
        duration_label = "6 Months"
    elif has_moderate:
        num_days = 90
        duration_label = "3 Months"
    else:
        num_days = 30
        duration_label = "1 Month"

    options = []
    for option_id in range(1, 2):
        # Generate 7 base days
        base_weekly_plan = {}
        for day in range(1, 8):
            meals, cal = generate_daily_plan(
                foods, 
                seed=option_id * 1000 + day,
                calorie_min=calorie_min,
                calorie_max=calorie_max
            )
            base_weekly_plan[day] = {"meals": meals, "total_calories": cal}
            
        # Loop the 7 base days until `num_days` is reached
        full_plan = {}
        for day in range(1, num_days + 1):
            base_day = ((day - 1) % 7) + 1
            full_plan[f"Day {day}"] = base_weekly_plan[base_day]
            
        options.append({
            "optionId": option_id,
            "name": f"Plan {option_id} - Optimized for {bmi_category}",
            "weeklyPlan": full_plan
        })
    
    # Generate Preparation and Safety Guides
    poly_risk = patient_data.get("polypharmacyRisk", "Low")
    prep_guides, safety_alerts = get_clinical_guides(active_conditions, poly_risk)
    
    return {
        "success": True,
        "patient_name": patient_name,
        "bmi": round(bmi, 1),
        "bmi_category": bmi_category,
        "bmi_advice": bmi_advice,
        "daily_calorie_range": f"{calorie_min}–{calorie_max} kcal",
        "conditions": active_conditions,
        "suitable_foods_count": len(foods),
        "plan_duration": duration_label,
        "mealPlanOptions": options,
        "preparationGuides": prep_guides,
        "safetyAlerts": safety_alerts,
        "polypharmacyRisk": poly_risk
    }

# ==================================================
# TEST FUNCTION
# ==================================================
def test_meal_planner():
    sample_patient = {
        "basicProfile": {"name": "John Doe", "bmi": 28.5},
        "dietaryRestrictions": {
            "vegetarian": True,
            "dairyFree": False,
            "glutenFree": False,
            "nutAllergy": False
        },
        "medicalConditions": {"diabetes": False, "hypertension": False},
        "vitaminDeficiencies": [],
        "preferences": {"foodDislikes": "onion, garlic"}
    }
    

# ==================================================
# RUN TEST
# ==================================================
if __name__ == "__main__":
    test_meal_planner()
    print("\nMeal planner is ready! Use generate_full_meal_plan(patient_data) in your API.")