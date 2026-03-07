import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import pickle
import os


# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.normpath(os.path.join(SCRIPT_DIR, "..", "..", "Data", "Adverse Drug Event.csv"))
MODEL_DIR = os.path.normpath(os.path.join(SCRIPT_DIR, "..", "ade_model"))


def train_ade_model():
    """
    Train a Random Forest classifier to predict Adverse Drug Events.
    Features: Drug, Age, Existing Diseases
    Target: Predicted_ADE

    Outputs:
      - rf_ade_model.pkl
      - drug_encoder.pkl
      - disease_encoder.pkl
      - target_encoder.pkl
      - metadata.pkl
      - model_evaluation_report.txt
    """
    print("=" * 60)
    print("  Adverse Drug Event Prediction Model Training")
    print("=" * 60)

    # ---- Load Data ----
    print(f"\nLoading data from {DATA_FILE} ...")
    df = pd.read_csv(DATA_FILE, encoding="utf-8-sig")
    df = df.dropna(subset=["Drug", "Age", "Existing Diseases", "Predicted_ADE"])
    print(f"  Rows: {len(df):,}")

    # ---- Encode Categorical Features ----
    drug_encoder = LabelEncoder()
    disease_encoder = LabelEncoder()
    target_encoder = LabelEncoder()

    df["Drug_enc"] = drug_encoder.fit_transform(df["Drug"].astype(str))
    df["Disease_enc"] = disease_encoder.fit_transform(df["Existing Diseases"].astype(str))
    df["ADE_enc"] = target_encoder.fit_transform(df["Predicted_ADE"].astype(str))

    print(f"\n  Drugs:    {list(drug_encoder.classes_)}")
    print(f"  Diseases: {list(disease_encoder.classes_)}")
    print(f"  ADEs:     {list(target_encoder.classes_)}")

    # ---- Build feature matrix ----
    X = df[["Drug_enc", "Age", "Disease_enc"]].values
    y = df["ADE_enc"].values

    # ---- Train / Test split (80/20) ----
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\n  Train size: {len(X_train):,}  |  Test size: {len(X_test):,}")

    # ---- Train Random Forest ----
    print("\n  Training Random Forest classifier ...")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=20,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    # ---- Evaluate ----
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(
        y_test, y_pred,
        target_names=target_encoder.classes_,
    )

    print(f"\n  Test Accuracy: {accuracy * 100:.2f}%\n")
    print(report)

    # ---- Ensure output directory exists ----
    os.makedirs(MODEL_DIR, exist_ok=True)

    # ---- Save evaluation report as TXT ----
    report_path = os.path.join(MODEL_DIR, "model_evaluation_report.txt")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("=" * 60 + "\n")
        f.write("Adverse Drug Event Model Evaluation Report\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"Data file:   {DATA_FILE}\n")
        f.write(f"Total rows:  {len(df)}\n")
        f.write(f"Train size:  {len(X_train)}\n")
        f.write(f"Test size:   {len(X_test)}\n\n")
        f.write(f"Test Accuracy: {accuracy * 100:.2f}%\n\n")
        f.write("Classification Report:\n")
        f.write(report)
        f.write("\n" + "=" * 60 + "\n")

    print(f"✓ Evaluation report saved to {report_path}")

    # ---- Retrain on the FULL dataset for production ----
    print("\n  Retraining on full dataset for production ...")
    model.fit(X, y)

    # ---- Save artifacts ----
    with open(os.path.join(MODEL_DIR, "rf_ade_model.pkl"), "wb") as f:
        pickle.dump(model, f)
    with open(os.path.join(MODEL_DIR, "drug_encoder.pkl"), "wb") as f:
        pickle.dump(drug_encoder, f)
    with open(os.path.join(MODEL_DIR, "disease_encoder.pkl"), "wb") as f:
        pickle.dump(disease_encoder, f)
    with open(os.path.join(MODEL_DIR, "target_encoder.pkl"), "wb") as f:
        pickle.dump(target_encoder, f)

    metadata = {
        "data_file": DATA_FILE,
        "total_rows": int(len(df)),
        "test_accuracy": float(round(accuracy, 4)),
        "drugs": list(drug_encoder.classes_),
        "diseases": list(disease_encoder.classes_),
        "ade_classes": list(target_encoder.classes_),
        "model_type": "RandomForestClassifier",
        "n_estimators": 200,
        "max_depth": 20,
        "min_samples_split": 5,
        "random_state": 42,
        "test_size": 0.2,
        "stratify": True,
    }
    with open(os.path.join(MODEL_DIR, "metadata.pkl"), "wb") as f:
        pickle.dump(metadata, f)

    print(f"\n✓ Model and encoders saved to {MODEL_DIR}")
    print("  Files: rf_ade_model.pkl, drug_encoder.pkl, disease_encoder.pkl,")
    print("         target_encoder.pkl, metadata.pkl, model_evaluation_report.txt")
    print("=" * 60)
    return model


if __name__ == "__main__":
    train_ade_model()