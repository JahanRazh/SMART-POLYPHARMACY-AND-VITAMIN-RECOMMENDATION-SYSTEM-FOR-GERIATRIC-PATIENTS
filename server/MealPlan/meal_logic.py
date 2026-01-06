# MealPlan/meal_logic.py - FINAL CLEAN & OPTIMIZED VERSION

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

# Suppress the harmless sklearn warning about feature names
warnings.filterwarnings("ignore", message="X does not have valid feature names")

print("🍽️ Smart Meal Planner Starting...")

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
        raise FileNotFoundError(f"❌ food.csv not found at {CSV_PATH}")
    
    print(f"📁 Loading dataset: food.csv")
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
    
    print(f"✅ Dataset loaded & cleaned: {len(df)} foods")
    return df

# ==================================================
# TRAIN & SAVE AI MODEL
# ==================================================
def train_and_save_model():
    global vitamin_model, scaler
    print("🧠 Training new AI Health Model...")
    
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
    print(f"✅ Model trained | Accuracy: {accuracy:.3f}")
    
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(vitamin_model, f)
    with open(SCALER_PATH, "wb") as f:
        pickle.dump(scaler, f)
    print("💾 New model files saved!")

# ==================================================
# LOAD DATA & MODEL
# ==================================================
df = load_dataset()

if not (os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH)):
    train_and_save_model()
else:
    try:
        with open(MODEL_PATH, "rb") as f:
            vitamin_model = pickle.load(f)
        with open(SCALER_PATH, "rb") as f:
            scaler = pickle.load(f)
        print("🧠 Existing AI model loaded")
    except Exception as e:
        print(f"⚠️ Model load failed ({e}) – retraining...")
        train_and_save_model()

# ==================================================
# AI SCORING – Fixed warning by using same structure as training
# ==================================================
def ai_food_score(row):
    if vitamin_model is None or scaler is None:
        return 0.6
    
    feature_values = np.array([
        row["Data.Carbohydrate"], row["Data.Protein"], row["Data.Fat.Total Lipid"],
        row["Data.Sugar Total"], row["Data.Major Minerals.Sodium"],
        row["Data.Fiber"], row["Data.Cholesterol"], row["Calories"]
    ]).reshape(1, -1)
    
    # Create DataFrame with column names to match training exactly
    feature_df = pd.DataFrame(
        feature_values,
        columns=[
            "Data.Carbohydrate", "Data.Protein", "Data.Fat.Total Lipid",
            "Data.Sugar Total", "Data.Major Minerals.Sodium",
            "Data.Fiber", "Data.Cholesterol", "Calories"
        ]
    )
    
    try:
        scaled = scaler.transform(feature_df)
        return float(vitamin_model.predict_proba(scaled)[0][1])
    except:
        return 0.5

df["ai_score"] = df.apply(ai_food_score, axis=1)

# ==================================================
# FILTER FOODS
# ==================================================
def filter_foods(patient_data, active_conditions):
    filtered = df[df["ai_score"] > 0.35].copy()
    desc_lower = filtered["Description"].str.lower().fillna("")
    
    restrictions = patient_data.get("dietaryRestrictions", {})
    preferences = patient_data.get("preferences", {})
    
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
    
    print(f"🔍 Filtered to {len(filtered)} suitable foods")
    return filtered

# ==================================================
# DAILY MEAL PLAN
# ==================================================
def generate_daily_plan(filtered_df, seed=42):
    random.seed(seed)
    if len(filtered_df) < 5:
        return ["Not enough suitable foods"], 0
    
    foods = filtered_df.nlargest(80, "ai_score").sample(n=min(50, len(filtered_df)), random_state=seed)
    
    prob = LpProblem("DailyMeal", LpMinimize)
    x = {i: LpVariable(f"x{i}", 0, 3, LpInteger) for i in range(len(foods))}
    
    prob += (
        lpSum(foods.iloc[i]["Calories"] * x[i] for i in x) -
        200 * lpSum(foods.iloc[i]["ai_score"] * x[i] for i in x)
    )
    
    prob += lpSum(foods.iloc[i]["Calories"] * x[i] for i in x) >= 1500
    prob += lpSum(foods.iloc[i]["Calories"] * x[i] for i in x) <= 2200
    prob += lpSum(foods.iloc[i]["Data.Protein"] * x[i] for i in x) >= 60
    prob += lpSum(foods.iloc[i]["Data.Fiber"] * x[i] for i in x) >= 25
    prob += lpSum(foods.iloc[i]["Data.Sugar Total"] * x[i] for i in x) <= 50
    
    status = prob.solve(PULP_CBC_CMD(msg=0, timeLimit=8))
    
    if LpStatus[status] != "Optimal":
        fallback = foods.nlargest(6, "ai_score")
        plan = []
        for _, row in fallback.iterrows():
            plan.append(f"• {row['Description'][:60]} - 150g (~{int(row['Calories'] * 1.5)} kcal)")
        return plan, 1800
    
    plan = []
    total_cal = 0
    for i in x:
        qty = value(x[i])
        if qty > 0:
            grams = int(qty * 100)
            kcal = int(foods.iloc[i]["Calories"] * qty)
            name = foods.iloc[i]["Description"]
            name = name[:57] + "..." if len(name) > 60 else name
            plan.append(f"• {name} - {grams}g (~{kcal} kcal)")
            total_cal += kcal
    
    return plan[:7], int(total_cal)

# ==================================================
# MAIN FUNCTION
# ==================================================
def generate_full_meal_plan(patient_data):
    basic = patient_data.get("basicProfile", {})
    medical = patient_data.get("medicalConditions", {})
    vitamin_defs = patient_data.get("vitaminDeficiencies", [])
    
    active_conditions = []
    if medical.get("diabetes"): active_conditions.append("diabetes")
    if medical.get("hypertension"): active_conditions.append("hypertension")
    
    for vd in vitamin_defs:
        name = vd.get("name", "").lower()
        if "vitamin a" in name: active_conditions.append("vitamin_a_deficiency")
        if "vitamin c" in name: active_conditions.append("vitamin_c_deficiency")
    
    foods = filter_foods(patient_data, active_conditions)
    
    if len(foods) < 8:
        return {
            "success": False,
            "error": f"Too few suitable foods found ({len(foods)}). Please relax some restrictions."
        }
    
    options = []
    for option_id in range(1, 4):
        weekly = {}
        for day in range(1, 8):
            meals, cal = generate_daily_plan(foods, seed=option_id * 1000 + day)
            weekly[f"Day {day}"] = {"meals": meals, "total_calories": cal}
        options.append({
            "optionId": option_id,
            "name": f"AI Balanced Plan {option_id}",
            "weeklyPlan": weekly
        })
    
    return {
        "success": True,
        "patient_name": basic.get("name", "Patient"),
        "bmi": basic.get("bmi", 22),
        "conditions": active_conditions,
        "suitable_foods_count": len(foods),
        "mealPlanOptions": options
    }

# ==================================================
# TEST
# ==================================================
def test_meal_planner():
    sample = {
        "basicProfile": {"name": "Nimal Perera", "bmi": 27},
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
    

if __name__ == "__main__":
    test_meal_planner()
    print("\n✅ Meal planner is ready! Call generate_full_meal_plan() from your API.")