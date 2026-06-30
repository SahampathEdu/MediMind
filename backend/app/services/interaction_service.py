import pandas as pd
import numpy as np
import os
import json
from pathlib import Path
from typing import Optional
from app.utils.normalizer import normalize_drug_name

# ML model (loaded once at startup)
try:
    import joblib
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False

ML_MODEL_PATH   = Path(__file__).resolve().parent.parent.parent / "ml_model" / "model.pkl"
METRICS_PATH    = Path(__file__).resolve().parent.parent.parent / "ml_model" / "model_metrics.json"


class InteractionService:
    def __init__(self, csv_path: str):
        self.csv_path = csv_path
        self.df       = self._load_dataset()
        self.model_bundle  = None
        self.model_metrics = None
        self._load_ml_model()

    # ─── Dataset ──────────────────────────────────────────────────────────────
    def _load_dataset(self) -> pd.DataFrame:
        if not os.path.exists(self.csv_path):
            print(f"❌ Dataset NOT found at: {self.csv_path}")
            return pd.DataFrame(columns=[
                "drug1", "drug2", "interaction_description",
                "interaction_effect", "interaction_type",
                "label", "source", "pair_key"
            ])
        print(f"✅ Loading dataset from: {self.csv_path}")
        df = pd.read_csv(self.csv_path)
        df["drug1"] = df["drug1"].astype(str).str.strip().str.lower()
        df["drug2"] = df["drug2"].astype(str).str.strip().str.lower()
        print(f"✅ Loaded {len(df):,} rows")
        return df

    def reload_dataset(self, new_path: Optional[str] = None):
        if new_path:
            self.csv_path = new_path
        self.df = self._load_dataset()

    # ─── ML Model ─────────────────────────────────────────────────────────────
    def _load_ml_model(self):
        if not ML_AVAILABLE:
            print("⚠️  joblib not available — ML model disabled")
            return
        if ML_MODEL_PATH.exists():
            try:
                self.model_bundle = joblib.load(ML_MODEL_PATH)
                print(f"✅ ML model loaded: {self.model_bundle.get('best_model_name', 'Unknown')}")
            except Exception as e:
                print(f"⚠️  Could not load ML model: {e}")
        else:
            print("⚠️  No trained model found — run train_model.py first")
            print(f"   Expected: {ML_MODEL_PATH}")

        if METRICS_PATH.exists():
            with open(METRICS_PATH) as f:
                self.model_metrics = json.load(f)

    def reload_model(self):
        self._load_ml_model()

    def get_model_metrics(self) -> Optional[dict]:
        return self.model_metrics

    # ─── ML Prediction ────────────────────────────────────────────────────────
    def _ml_predict(self, drug1: str, drug2: str, interaction_type: str = "none") -> Optional[dict]:
        """Use trained ML model to predict interaction. Returns None if model unavailable."""
        if not self.model_bundle:
            return None
        try:
            model   = self.model_bundle["model"]
            tfidf   = self.model_bundle["tfidf"]
            le_type = self.model_bundle["label_encoder"]

            drug_pair = f"{drug1} {drug2}"

            # Encode interaction_type
            itype_clean = interaction_type.strip().lower()
            if itype_clean in le_type.classes_:
                itype_enc = le_type.transform([itype_clean])[0]
            else:
                itype_enc = le_type.transform(["none"])[0]

            # Build feature matrix
            from scipy.sparse import hstack, csr_matrix
            X_text = tfidf.transform([drug_pair])
            X_type = csr_matrix([[itype_enc]])
            X      = hstack([X_text, X_type])

            label    = int(model.predict(X)[0])
            proba    = float(model.predict_proba(X)[0][1])
            return {"label": label, "confidence": round(proba, 3)}
        except Exception as e:
            print(f"⚠️  ML prediction error: {e}")
            return None

    # ─── Risk & Helpers ───────────────────────────────────────────────────────
    def get_risk_level(self, interaction_type: str, label: int) -> str:
        if label == 0:
            return "Low"
        if interaction_type == "increase_effect":
            return "High"
        elif interaction_type == "decrease_effect":
            return "Moderate"
        return "Moderate"

    def patient_risk_note(
        self,
        risk_level: str,
        age: Optional[int],
        gender: Optional[str],
        health_conditions: Optional[list],
    ) -> Optional[str]:
        notes = []
        if risk_level == "High":
            notes.append("⚠️ High-risk interaction detected. Consult a doctor immediately.")
        if age and age > 65:
            notes.append("Elderly patients may be more sensitive to this interaction.")
        if health_conditions:
            conds = [c.lower() for c in health_conditions]
            if any(k in conds for k in ["kidney disease", "renal", "kidney"]):
                notes.append("Renal impairment may intensify this interaction.")
            if any(k in conds for k in ["liver disease", "hepatic", "liver"]):
                notes.append("Hepatic impairment may slow drug metabolism.")
            if "diabetes" in conds and risk_level in ("High", "Moderate"):
                notes.append("Monitor blood glucose levels closely.")
        return " ".join(notes) if notes else None

    # ─── Main: Find Interaction ───────────────────────────────────────────────
    def find_interaction(
        self,
        drug1: str,
        drug2: str,
        age: Optional[int] = None,
        gender: Optional[str] = None,
        health_conditions: Optional[list] = None,
    ) -> dict:
        d1 = normalize_drug_name(drug1)
        d2 = normalize_drug_name(drug2)

        # 1️⃣ Dataset lookup (exact match — gives us rich descriptions)
        match = self.df[(self.df["drug1"] == d1) & (self.df["drug2"] == d2)]
        if match.empty:
            match = self.df[(self.df["drug1"] == d2) & (self.df["drug2"] == d1)]

        if not match.empty:
            # Exact match found in dataset
            row    = match.iloc[0]
            itype  = str(row.get("interaction_type", "none")).lower()
            db_label = int(row.get("label", 0))

            # 2️⃣ Run ML model on top of dataset match for confidence score
            ml_result  = self._ml_predict(d1, d2, itype)
            confidence = ml_result["confidence"] if ml_result else (0.92 if db_label else 0.55)
            # Use ML label if model available and trained, else trust dataset
            label = ml_result["label"] if ml_result else db_label

            risk = self.get_risk_level(itype, label)
            note = self.patient_risk_note(risk, age, gender, health_conditions)

            return {
                "found":                   True,
                "drug1":                   d1,
                "drug2":                   d2,
                "risk_level":              risk,
                "interaction_type":        itype,
                "interaction_effect":      row.get("interaction_effect", None),
                "interaction_description": row.get("interaction_description", None),
                "confidence_score":        confidence,
                "source":                  row.get("source", None),
                "prediction_source":       "dataset+ml" if ml_result else "dataset",
                "message":                 "Interaction found.",
                "patient_risk_note":       note,
            }

        # 3️⃣ Not in dataset — use ML model to predict
        ml_result = self._ml_predict(d1, d2, "none")

        if ml_result and ml_result["label"] == 1:
            # ML predicts interaction even though not in dataset
            risk       = "Moderate"   # conservative default for ML-only predictions
            confidence = ml_result["confidence"]
            note       = self.patient_risk_note(risk, age, gender, health_conditions)
            return {
                "found":                   True,
                "drug1":                   d1,
                "drug2":                   d2,
                "risk_level":              risk,
                "interaction_type":        "predicted",
                "interaction_effect":      "Potential interaction predicted by ML model.",
                "interaction_description": "This drug pair was not found in the dataset but the ML model predicts a possible interaction. Please consult a healthcare provider.",
                "confidence_score":        confidence,
                "source":                  "ml_model",
                "prediction_source":       "ml_only",
                "message":                 "Interaction predicted by ML model.",
                "patient_risk_note":       note,
            }

        # 4️⃣ No interaction found by either method
        return {
            "found":                   False,
            "drug1":                   d1,
            "drug2":                   d2,
            "risk_level":              "Low",
            "interaction_type":        None,
            "interaction_effect":      None,
            "interaction_description": None,
            "confidence_score":        ml_result["confidence"] if ml_result else None,
            "source":                  None,
            "prediction_source":       "ml_only" if ml_result else "none",
            "message":                 "No known interaction found.",
            "patient_risk_note":       None,
        }

    # ─── Utilities ────────────────────────────────────────────────────────────
    def search_drugs(self, query: str, limit: int = 20) -> list:
        q = query.strip().lower()
        if not q:
            return []
        all_drugs = pd.concat([self.df["drug1"], self.df["drug2"]]).drop_duplicates()
        matches   = all_drugs[all_drugs.str.contains(q, na=False)].tolist()
        return sorted(matches)[:limit]

    def dataset_size(self) -> int:
        return len(self.df)

    def get_stats(self) -> dict:
        total = len(self.df)
        return {
            "total_pairs":        total,
            "with_interactions":  int(self.df["label"].sum()) if "label" in self.df.columns else 0,
            "no_interaction":     total - (int(self.df["label"].sum()) if "label" in self.df.columns else 0),
        }
