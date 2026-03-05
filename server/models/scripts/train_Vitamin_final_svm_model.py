import os
import pandas as pd
import ast
import joblib

from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.svm import LinearSVC
from sklearn.multiclass import OneVsRestClassifier
from sklearn.metrics import classification_report


# Get current script directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Paths
DATA_PATH = os.path.normpath(os.path.join(SCRIPT_DIR, "..", "..", "Data", "final_vitamin_dataset_cleaned.csv"))
MODEL_DIR = os.path.normpath(os.path.join(SCRIPT_DIR, "..", "Vitamin_difml"))
RESULTS_DIR = os.path.normpath(os.path.join(SCRIPT_DIR, "..", "Reports"))


# Load dataset
df = pd.read_csv(DATA_PATH)

# Convert string list to actual list
df["vitamin_labels"] = df["vitamin_labels"].apply(ast.literal_eval)

print("Total samples:", len(df))
print(df.head())


# Convert labels to multi-label format
mlb = MultiLabelBinarizer()
Y = mlb.fit_transform(df["vitamin_labels"])

print("Vitamin classes:", mlb.classes_)


# TF-IDF Feature Extraction
tfidf = TfidfVectorizer(
    max_features=10000,
    ngram_range=(1, 2),
    min_df=2
)

X = tfidf.fit_transform(df["combined_text"])


# Train Test Split
X_train, X_test, Y_train, Y_test = train_test_split(
    X,
    Y,
    test_size=0.2,
    random_state=42
)


# Train SVM Model
final_svm = OneVsRestClassifier(
    LinearSVC(class_weight="balanced")
)

final_svm.fit(X_train, Y_train)


# Model Evaluation
Y_pred = final_svm.predict(X_test)

final_report = classification_report(
    Y_test,
    Y_pred,
    target_names=mlb.classes_,
    zero_division=0
)

print(final_report)


# Save Results
os.makedirs(RESULTS_DIR, exist_ok=True)

report_df = pd.DataFrame(
    classification_report(
        Y_test,
        Y_pred,
        target_names=mlb.classes_,
        output_dict=True,
        zero_division=0
    )
).transpose()

report_df.to_csv(os.path.join(RESULTS_DIR, "classification_report.csv"))

print("✅ Final evaluation metrics saved")


# Save Model
os.makedirs(MODEL_DIR, exist_ok=True)

joblib.dump(final_svm, os.path.join(MODEL_DIR, "model.pkl"))
joblib.dump(tfidf, os.path.join(MODEL_DIR, "tfidf.pkl"))
joblib.dump(mlb, os.path.join(MODEL_DIR, "label_encoder.pkl"))

print("✅ Final SVM model saved successfully")