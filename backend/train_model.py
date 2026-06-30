"""
MediMind - ML Model Training Script
====================================
Trains Random Forest and XGBoost classifiers on the drug interaction dataset.
Saves the best model as 'model.pkl' and metrics as 'model_metrics.json'.

Run from the backend/ folder:
    python train_model.py

Requirements (install if missing):
    pip install scikit-learn xgboost joblib
"""

import pandas as pd
import numpy as np
import json
import os
import warnings
warnings.filterwarnings("ignore")

from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, confusion_matrix, classification_report
)
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
import joblib

try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    print("⚠️  XGBoost not installed. Only Random Forest will be trained.")
    print("    Run: pip install xgboost")

# ─── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR    = Path(__file__).resolve().parent.parent          # MediMind New/
DATASET     = BASE_DIR / "dataset" / "medimind_interactions_dataset.csv"
MODEL_OUT   = Path(__file__).resolve().parent / "ml_model" / "model.pkl"
METRICS_OUT = Path(__file__).resolve().parent / "ml_model" / "model_metrics.json"
MODEL_OUT.parent.mkdir(exist_ok=True)

print("=" * 60)
print("  MediMind — ML Model Training")
print("=" * 60)


# ─── 1. Load Dataset ───────────────────────────────────────────────────────────
print(f"\n📂 Loading dataset from:\n   {DATASET}")
df = pd.read_csv(DATASET)
print(f"   Loaded {len(df):,} rows, {len(df.columns)} columns")
print(f"   Columns: {list(df.columns)}")


# ─── 2. Feature Engineering ────────────────────────────────────────────────────
print("\n🔧 Engineering features...")

# Normalise drug names
df["drug1"] = df["drug1"].astype(str).str.strip().str.lower()
df["drug2"] = df["drug2"].astype(str).str.strip().str.lower()

# Combined drug pair text feature (for TF-IDF character n-grams)
df["drug_pair"] = df["drug1"] + " " + df["drug2"]

# Encode interaction_type as a numeric feature
df["interaction_type"] = df["interaction_type"].fillna("none").astype(str).str.lower().str.strip()

le_type = LabelEncoder()
df["interaction_type_enc"] = le_type.fit_transform(df["interaction_type"])

# Drop rows with missing labels
df = df.dropna(subset=["label"])
df["label"] = df["label"].astype(int)

print(f"   Label distribution:\n{df['label'].value_counts().to_string()}")
print(f"   Interaction types: {df['interaction_type'].unique().tolist()}")


# ─── 3. Define Features and Target ─────────────────────────────────────────────
# We use the drug pair text + interaction_type encoding as features
# Target: label (0 = no interaction, 1 = interaction exists)

X_text = df["drug_pair"]              # text feature -> TF-IDF
X_type = df[["interaction_type_enc"]] # numeric feature
y      = df["label"]

print(f"\n📊 Dataset split:")
print(f"   Total samples : {len(y):,}")
print(f"   Positive (1)  : {(y==1).sum():,} ({(y==1).mean()*100:.1f}%)")
print(f"   Negative (0)  : {(y==0).sum():,} ({(y==0).mean()*100:.1f}%)")


# ─── 4. Train/Test Split ───────────────────────────────────────────────────────
X_text_train, X_text_test, X_type_train, X_type_test, y_train, y_test = train_test_split(
    X_text, X_type, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)
print(f"\n   Train: {len(y_train):,} | Test: {len(y_test):,}")


# ─── 5. Build TF-IDF Feature Matrix ───────────────────────────────────────────
print("\n🔢 Building TF-IDF features from drug names...")
tfidf = TfidfVectorizer(
    analyzer="char_wb",   # character n-grams (great for drug names)
    ngram_range=(2, 4),
    max_features=5000,
    sublinear_tf=True,
)
X_tfidf_train = tfidf.fit_transform(X_text_train)
X_tfidf_test  = tfidf.transform(X_text_test)

# Stack TF-IDF with numeric feature
from scipy.sparse import hstack, csr_matrix
X_type_train_sp = csr_matrix(X_type_train.values)
X_type_test_sp  = csr_matrix(X_type_test.values)

X_train_final = hstack([X_tfidf_train, X_type_train_sp])
X_test_final  = hstack([X_tfidf_test,  X_type_test_sp])
print(f"   Feature matrix: {X_train_final.shape}")


# ─── 6. Train Models ──────────────────────────────────────────────────────────
results = {}

# --- Random Forest ---
print("\n🌲 Training Random Forest...")
rf = RandomForestClassifier(
    n_estimators=200,
    max_depth=20,
    min_samples_leaf=2,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1,
)
rf.fit(X_train_final, y_train)
rf_preds = rf.predict(X_test_final)
rf_proba = rf.predict_proba(X_test_final)[:, 1]

results["Random Forest"] = {
    "model": rf,
    "preds": rf_preds,
    "proba": rf_proba,
    "accuracy":  round(accuracy_score(y_test, rf_preds), 4),
    "precision": round(precision_score(y_test, rf_preds, zero_division=0), 4),
    "recall":    round(recall_score(y_test, rf_preds, zero_division=0), 4),
    "f1":        round(f1_score(y_test, rf_preds, zero_division=0), 4),
}
print(f"   ✅ Accuracy : {results['Random Forest']['accuracy']:.4f}")
print(f"   ✅ F1 Score : {results['Random Forest']['f1']:.4f}")

# --- XGBoost ---
if XGBOOST_AVAILABLE:
    print("\n⚡ Training XGBoost...")
    xgb = XGBClassifier(
        n_estimators=200,
        max_depth=8,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        use_label_encoder=False,
        eval_metric="logloss",
        random_state=42,
        n_jobs=-1,
    )
    xgb.fit(X_train_final, y_train)
    xgb_preds = xgb.predict(X_test_final)
    xgb_proba = xgb.predict_proba(X_test_final)[:, 1]

    results["XGBoost"] = {
        "model": xgb,
        "preds": xgb_preds,
        "proba": xgb_proba,
        "accuracy":  round(accuracy_score(y_test, xgb_preds), 4),
        "precision": round(precision_score(y_test, xgb_preds, zero_division=0), 4),
        "recall":    round(recall_score(y_test, xgb_preds, zero_division=0), 4),
        "f1":        round(f1_score(y_test, xgb_preds, zero_division=0), 4),
    }
    print(f"   ✅ Accuracy : {results['XGBoost']['accuracy']:.4f}")
    print(f"   ✅ F1 Score : {results['XGBoost']['f1']:.4f}")


# ─── 7. Compare & Pick Best Model ─────────────────────────────────────────────
print("\n📈 Model Comparison:")
print(f"{'Model':<20} {'Accuracy':>10} {'Precision':>10} {'Recall':>10} {'F1':>10}")
print("-" * 62)
for name, r in results.items():
    print(f"{name:<20} {r['accuracy']:>10.4f} {r['precision']:>10.4f} {r['recall']:>10.4f} {r['f1']:>10.4f}")

best_name  = max(results, key=lambda k: results[k]["f1"])
best       = results[best_name]
best_model = best["model"]
best_preds = best["preds"]
print(f"\n🏆 Best model: {best_name} (F1 = {best['f1']:.4f})")


# ─── 8. Detailed Report ───────────────────────────────────────────────────────
print(f"\n📋 Classification Report ({best_name}):")
print(classification_report(y_test, best_preds, target_names=["No Interaction", "Interaction"]))

cm = confusion_matrix(y_test, best_preds)
print(f"Confusion Matrix:\n{cm}")
tn, fp, fn, tp = cm.ravel()


# ─── 9. Save Model ─────────────────────────────────────────────────────────────
print(f"\n💾 Saving model to: {MODEL_OUT}")
model_bundle = {
    "model":            best_model,
    "tfidf":            tfidf,
    "label_encoder":    le_type,
    "best_model_name":  best_name,
}
joblib.dump(model_bundle, MODEL_OUT)
print("   ✅ model.pkl saved")


# ─── 10. Save Metrics JSON ────────────────────────────────────────────────────
all_model_metrics = {}
for name, r in results.items():
    all_model_metrics[name] = {
        "accuracy":  r["accuracy"],
        "precision": r["precision"],
        "recall":    r["recall"],
        "f1":        r["f1"],
    }

metrics_payload = {
    "best_model":       best_name,
    "accuracy":         best["accuracy"],
    "precision":        best["precision"],
    "recall":           best["recall"],
    "f1_score":         best["f1"],
    "true_positives":   int(tp),
    "true_negatives":   int(tn),
    "false_positives":  int(fp),
    "false_negatives":  int(fn),
    "test_size":        len(y_test),
    "train_size":       len(y_train),
    "total_samples":    len(y),
    "all_models":       all_model_metrics,
    "feature_count":    int(X_train_final.shape[1]),
    "classes":          ["No Interaction", "Interaction"],
}

print(f"\n💾 Saving metrics to: {METRICS_OUT}")
with open(METRICS_OUT, "w") as f:
    json.dump(metrics_payload, f, indent=2)
print("   ✅ model_metrics.json saved")

print("\n" + "=" * 60)
print("  Training Complete!")
print(f"  Best model  : {best_name}")
print(f"  Accuracy    : {best['accuracy']*100:.2f}%")
print(f"  Precision   : {best['precision']*100:.2f}%")
print(f"  Recall      : {best['recall']*100:.2f}%")
print(f"  F1 Score    : {best['f1']*100:.2f}%")
print("=" * 60)
print("\n✅ You can now run the backend — it will use the trained model automatically.")
