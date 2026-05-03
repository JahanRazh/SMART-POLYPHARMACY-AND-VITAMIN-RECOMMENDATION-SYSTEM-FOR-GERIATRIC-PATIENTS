import os
import csv
import random
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score
from sklearn.metrics import r2_score, mean_absolute_error

# ─────────────────────────────────────────
# PATHS  (fixed for internal directory)
# ─────────────────────────────────────────
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
FOOD_CSV_PATH = os.path.join(BASE_DIR, "food.csv")
SAVE_DIR      = BASE_DIR

# ─────────────────────────────────────────
# KEYWORD LISTS
# ─────────────────────────────────────────
MEAT_KW = [
    "beef","meat","chicken","pork","lamb","fish","salmon","tuna","shrimp",
    "turkey","ham","bacon","sausage","steak","liver","kidney","crab",
    "lobster","scallop","mussel","oyster","squid","prawn","duck","veal",
    "venison","anchovy","sardine","tilapia","cod","halibut","catfish",
    "trout","clams","gelatin","lard","tallow","bison","buffalo"
]
NON_VEGAN_KW = [
    "milk","cheese","butter","yogurt","cream","whey","honey","egg",
    "lacto","casein","ghee","sour cream","kefir","mayonnaise","custard"
]
DAIRY_KW  = ["milk","cheese","butter","yogurt","cream","whey","lacto","casein","ghee","kefir"]
GLUTEN_KW = ["wheat","barley","rye","flour","bread","pasta","noodle","couscous","semolina","spelt","malt"]
NUT_KW    = ["peanut","almond","walnut","cashew","pecan","pistachio","hazelnut","macadamia"," nut"]


def text_safe(name, category, kw_list):
    t = f"{name} {category}".lower()
    return not any(k in t for k in kw_list)


# ─────────────────────────────────────────
# LOAD ALL FOODS FROM CSV
# ─────────────────────────────────────────
def load_all_foods(path):
    foods = []
    with open(path, newline='', encoding='utf-8') as f:
        reader = list(csv.DictReader(f))

    for row in reader:
        try:
            name     = row.get("Description", "Unknown")
            category = row.get("Category", "Unknown")
            txt      = f"{name} {category}".lower()

            # Binary dietary flags from CSV + keyword guardrail
            is_veg  = row.get("Vegetarian",    "0").strip() == "1" and text_safe(name, category, MEAT_KW)
            is_vegan= row.get("Vegan",         "0").strip() == "1" and is_veg and text_safe(name, category, NON_VEGAN_KW)
            is_gf   = row.get("Gluten Free",   "0").strip() == "1"
            is_df   = row.get("Dairy Free",    "0").strip() == "1" and text_safe(name, category, DAIRY_KW)
            is_nut  = row.get("Nut Allergy Safe","0").strip() == "1" and text_safe(name, category, NUT_KW)

            def f(col): return float(row.get(col, 0) or 0)

            foods.append({
                "name":      name,
                "category":  category,
                # Dietary flags
                "vegetarian": int(is_veg),
                "vegan":      int(is_vegan),
                "gluten_free":int(is_gf),
                "dairy_free": int(is_df),
                "nut_allergy":int(is_nut),
                # Macros
                "carbs":      f("Data.Carbohydrate"),
                "protein":    f("Data.Protein"),
                "fat":        f("Data.Fat.Total Lipid"),
                "sugar":      f("Data.Sugar Total"),
                "fiber":      f("Data.Fiber"),
                "sodium":     f("Data.Major Minerals.Sodium"),
                "cholesterol":f("Data.Cholesterol"),
                "water":      f("Data.Water"),
                # Vitamins
                "vitA":       f("Data.Vitamins.Vitamin A - RAE"),
                "vitB12":     f("Data.Vitamins.Vitamin B12"),
                "vitB6":      f("Data.Vitamins.Vitamin B6"),
                "vitC":       f("Data.Vitamins.Vitamin C"),
                "vitE":       f("Data.Vitamins.Vitamin E"),
                "vitK":       f("Data.Vitamins.Vitamin K"),
                # Minerals
                "calcium":    f("Data.Major Minerals.Calcium"),
                "iron":       f("Data.Major Minerals.Iron"),
                "magnesium":  f("Data.Major Minerals.Magnesium"),
                "phosphorus": f("Data.Major Minerals.Phosphorus"),
                "potassium":  f("Data.Major Minerals.Potassium"),
                "zinc":       f("Data.Major Minerals.Zinc"),
                # Computed
                "calories":   round(
                    f("Data.Carbohydrate") * 4 +
                    f("Data.Protein")      * 4 +
                    f("Data.Fat.Total Lipid") * 9
                ),
            })
        except Exception:
            continue

    print(f"✅ Loaded {len(foods)} foods from CSV")
    return foods


# ─────────────────────────────────────────
# SCORING FUNCTION  (domain knowledge)
# ─────────────────────────────────────────
def compute_score(user, food):
    """
    Returns 0-100 suitability score for a user-food pair.
    Higher = better match.
    """
    score = 55.0  # neutral baseline

    name_lower = food["name"].lower()

    # ── Hard dietary violations → score = 0 ──────────────────────
    if user["vegetarian"] and (
        not food["vegetarian"] or any(k in name_lower for k in MEAT_KW)
    ):
        return 0.0

    if user["vegan"] and (
        not food["vegan"] or
        any(k in name_lower for k in MEAT_KW + NON_VEGAN_KW)
    ):
        return 0.0

    if user["gluten_free"] and not food["gluten_free"]:
        return 0.0

    if user["dairy_free"] and (
        not food["dairy_free"] or any(k in name_lower for k in DAIRY_KW)
    ):
        return 0.0

    if user["nut_allergy"] and (
        not food["nut_allergy"] or any(k in name_lower for k in NUT_KW)
    ):
        return 0.0

    # ── Food preference boost ─────────────────────────────────────
    liked    = user.get("liked_foods", [])
    disliked = user.get("disliked_foods", [])
    for kw in liked:
        if kw and kw.lower() in name_lower:
            score += 15
            break
    for kw in disliked:
        if kw and kw.lower() in name_lower:
            score -= 20
            break

    # ── Medical conditions ────────────────────────────────────────
    if user["diabetes"]:
        score -= food["sugar"]  * 0.8
        score += food["fiber"]  * 2.5
        score -= food["carbs"]  * 0.3

    if user["hypertension"]:
        score -= max(0, food["sodium"] - 200) * 0.05
        score += food["potassium"] * 0.01
        score += food["magnesium"] * 0.02

    if user["heart_disease"]:
        score -= food["fat"]         * 0.8
        score -= food["cholesterol"] * 0.05
        score += food["fiber"]       * 1.5
        score += food["vitE"]        * 2.0

    # ── BMI ───────────────────────────────────────────────────────
    bmi = user["bmi"]
    if bmi > 30:        # obese → low calorie dense
        score -= food["calories"] * 0.03
        score -= food["fat"]      * 0.5
        score += food["fiber"]    * 1.5
        score += food["protein"]  * 0.3
    elif bmi < 18.5:    # underweight → calorie rich
        score += food["calories"] * 0.02
        score += food["protein"]  * 0.5
        score += food["fat"]      * 0.2

    # ── Activity level ────────────────────────────────────────────
    activity = user["activity"]  # 0=sedentary … 3=active
    if activity >= 2:
        score += food["protein"]  * 0.4
        score += food["carbs"]    * 0.2
    elif activity == 0:
        score -= food["calories"] * 0.015

    # ── Age ───────────────────────────────────────────────────────
    age = user["age"]
    if age > 65:
        score += food["calcium"]  * 0.05
        score += food["vitD"]     * 2.0  if "vitD" in food else 0
        score += food["vitB12"]   * 3.0
        score += food["protein"]  * 0.3
        score -= food["sodium"]   * 0.02

    # ── Vitamin deficiencies ──────────────────────────────────────
    if user["def_vitA"]:   score += min(food["vitA"],   500) / 50  * 8
    if user["def_vitB12"]: score += min(food["vitB12"],  10) / 2   * 10
    if user["def_vitC"]:   score += min(food["vitC"],   200) / 20  * 8
    if user["def_iron"]:   score += min(food["iron"],    20) / 5   * 10
    if user["def_calcium"]:score += min(food["calcium"],500) / 100 * 8
    if user["def_zinc"]:   score += min(food["zinc"],    15) / 2   * 8

    # ── Nutrition quality bonus ───────────────────────────────────
    score += food["fiber"]   * 0.5
    score += food["protein"] * 0.2
    score -= max(0, food["sugar"] - 15) * 0.3

    return float(max(0.0, min(100.0, score)))


# ─────────────────────────────────────────
# GENERATE SYNTHETIC TRAINING DATA
# ─────────────────────────────────────────
FOOD_PREFERENCE_POOLS = {
    "liked":    ["rice","vegetable","fruit","chicken","fish","salad","bean","lentil","oat","yogurt","egg"],
    "disliked": ["liver","sardine","oyster","bitter","tripe","blood","tongue","kidney","brain"],
}

def generate_training_data(foods, n_users=200):
    np.random.seed(42)
    random.seed(42)
    records = []

    for _ in range(n_users):
        # Sample liked / disliked keywords (0-3 each)
        n_liked    = random.randint(0, 3)
        n_disliked = random.randint(0, 2)
        liked    = random.sample(FOOD_PREFERENCE_POOLS["liked"],    min(n_liked,    len(FOOD_PREFERENCE_POOLS["liked"])))
        disliked = random.sample(FOOD_PREFERENCE_POOLS["disliked"], min(n_disliked, len(FOOD_PREFERENCE_POOLS["disliked"])))

        user = {
            "age":         float(np.random.randint(18, 90)),
            "gender":      int(np.random.randint(0, 2)),
            "bmi":         float(np.random.uniform(14, 42)),
            "activity":    int(np.random.randint(0, 4)),
            "diabetes":    int(np.random.choice([0, 1], p=[0.65, 0.35])),
            "hypertension":int(np.random.choice([0, 1], p=[0.60, 0.40])),
            "heart_disease":int(np.random.choice([0, 1], p=[0.75, 0.25])),
            "vegetarian":  int(np.random.choice([0, 1], p=[0.75, 0.25])),
            "vegan":       int(np.random.choice([0, 1], p=[0.85, 0.15])),
            "gluten_free": int(np.random.choice([0, 1], p=[0.80, 0.20])),
            "dairy_free":  int(np.random.choice([0, 1], p=[0.75, 0.25])),
            "nut_allergy": int(np.random.choice([0, 1], p=[0.85, 0.15])),
            "def_vitA":    int(np.random.choice([0, 1], p=[0.70, 0.30])),
            "def_vitB12":  int(np.random.choice([0, 1], p=[0.65, 0.35])),
            "def_vitC":    int(np.random.choice([0, 1], p=[0.75, 0.25])),
            "def_iron":    int(np.random.choice([0, 1], p=[0.65, 0.35])),
            "def_calcium": int(np.random.choice([0, 1], p=[0.60, 0.40])),
            "def_zinc":    int(np.random.choice([0, 1], p=[0.78, 0.22])),
            "liked_foods": liked,
            "disliked_foods": disliked,
        }
        # Ensure vegan implies vegetarian
        if user["vegan"]: user["vegetarian"] = 1

        # Encode preferences as binary flags per food (computed per pair)
        for food in foods:
            score = compute_score(user, food)

            # Preference flags for this specific food
            name_lower = food["name"].lower()
            liked_flag    = int(any(kw in name_lower for kw in liked))
            disliked_flag = int(any(kw in name_lower for kw in disliked))

            records.append([
                # User features (18)
                user["age"], user["gender"], user["bmi"], user["activity"],
                user["diabetes"], user["hypertension"], user["heart_disease"],
                user["vegetarian"], user["vegan"], user["gluten_free"],
                user["dairy_free"], user["nut_allergy"],
                user["def_vitA"], user["def_vitB12"], user["def_vitC"],
                user["def_iron"], user["def_calcium"], user["def_zinc"],
                # Preference flags (2)
                liked_flag, disliked_flag,
                # Food features (20)
                food["carbs"], food["protein"], food["fat"],
                food["sugar"], food["fiber"], food["sodium"],
                food["cholesterol"], food["water"],
                food["vitA"], food["vitB12"], food["vitB6"],
                food["vitC"], food["vitE"], food["vitK"],
                food["calcium"], food["iron"],
                food["magnesium"], food["phosphorus"],
                food["potassium"], food["zinc"],
                # Target
                score,
            ])

    print(f"✅ Generated {len(records)} training samples")
    return records


# ─────────────────────────────────────────
# TRAIN
# ─────────────────────────────────────────
FEATURE_COLS = [
    # user
    "age","gender","bmi","activity",
    "diabetes","hypertension","heart_disease",
    "vegetarian","vegan","gluten_free","dairy_free","nut_allergy",
    "def_vitA","def_vitB12","def_vitC","def_iron","def_calcium","def_zinc",
    # preference
    "liked_flag","disliked_flag",
    # food
    "carbs","protein","fat","sugar","fiber","sodium","cholesterol","water",
    "vitA","vitB12","vitB6","vitC","vitE","vitK",
    "calcium","iron","magnesium","phosphorus","potassium","zinc",
]


def train_and_save():
    print(f"\n{'='*55}")
    print("   MEAL PLAN ML TRAINER  (GradientBoosting)")
    print(f"{'='*55}\n")

    if not os.path.exists(FOOD_CSV_PATH):
        raise FileNotFoundError(f"CSV not found: {FOOD_CSV_PATH}")

    # 1. Load foods
    foods = load_all_foods(FOOD_CSV_PATH)

    # 2. Sample for training (use up to 2000 foods × 200 users = 400k pairs)
    sample_size = min(2000, len(foods))
    sampled = random.sample(foods, sample_size)

    # 3. Generate training data
    records = generate_training_data(sampled, n_users=200)

    # 4. Build DataFrame
    cols = FEATURE_COLS + ["score"]
    df   = pd.DataFrame(records, columns=cols)

    X = df[FEATURE_COLS].values
    y = df["score"].values

    print(f"   Samples: {X.shape[0]:,}   Features: {X.shape[1]}")

    # 5. Scale
    scaler   = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # 6. Train GradientBoostingRegressor
    print("\n   Training GradientBoostingRegressor...")
    model = GradientBoostingRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        min_samples_leaf=5,
        random_state=42,
        verbose=0,
    )
    model.fit(X_scaled, y)

    # 7. Evaluate
    y_pred = model.predict(X_scaled)
    r2  = r2_score(y, y_pred)
    mae = mean_absolute_error(y, y_pred)
    print(f"\n   Train R²  : {r2:.4f}  ({r2*100:.1f}%)")
    print(f"   Train MAE : {mae:.3f}")

    

    # 8. Save
    os.makedirs(SAVE_DIR, exist_ok=True)
    model_path  = os.path.join(SAVE_DIR, "meal_model.pkl")
    scaler_path = os.path.join(SAVE_DIR, "scaler.pkl")
    features_path = os.path.join(SAVE_DIR, "feature_cols.pkl")

    joblib.dump(model,        model_path)
    joblib.dump(scaler,       scaler_path)
    joblib.dump(FEATURE_COLS, features_path)

    print(f"\n   ✅ model  → {model_path}")
    print(f"   ✅ scaler → {scaler_path}")
    print(f"   ✅ cols   → {features_path}")
    print(f"\n{'='*55}\n")


if __name__ == "__main__":
    train_and_save()