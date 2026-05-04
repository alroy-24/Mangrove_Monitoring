"""
STAGE 3: Risk Prediction Model
Train ML model to predict future mangrove loss.

Improvements over baseline:
  - XGBoost (default) with scale_pos_weight; falls back to Random Forest
  - SMOTE class balancing (imbalanced-learn)
  - Spatial block cross-validation (honest AUC, avoids autocorrelation leakage)
  - 9-feature ecological labels (NDVI + urban + aquaculture + fragmentation + prior loss)
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
import pickle
from pathlib import Path
import config


# ── Spatial block cross-validation ────────────────────────────────────────────

class SpatialBlockCV:
    """
    Partitions the raster into n_blocks×n_blocks tiles; each fold holds out one
    column-strip of tiles as the test set.  Prevents spatial autocorrelation
    leakage that inflates standard random k-fold scores.
    """

    def __init__(self, shape: tuple, n_blocks: int = 4, random_state: int = 42):
        self.h, self.w = shape
        self.n_blocks  = n_blocks
        self.rng       = np.random.RandomState(random_state)

    def split(self, n_total: int):
        """Yield (train_indices, test_indices) for each fold."""
        row_idx = np.arange(n_total) // self.w
        col_idx = np.arange(n_total)  % self.w

        br = (row_idx / self.h * self.n_blocks).clip(0, self.n_blocks - 1).astype(int)
        bc = (col_idx / self.w * self.n_blocks).clip(0, self.n_blocks - 1).astype(int)
        block_id    = br * self.n_blocks + bc
        n_blocks_sq = self.n_blocks ** 2
        order       = self.rng.permutation(n_blocks_sq)
        fold_size   = max(1, n_blocks_sq // self.n_blocks)

        for fold in range(self.n_blocks):
            test_b = set(order[fold * fold_size : (fold + 1) * fold_size].tolist())
            mask   = np.isin(block_id, list(test_b))
            yield np.where(~mask)[0], np.where(mask)[0]


# ── Risk predictor ─────────────────────────────────────────────────────────────

class RiskPredictor:
    """Train and predict mangrove loss risk."""

    def __init__(self, model_type: str = "xgb"):
        self.model_type    = model_type
        self.scaler        = StandardScaler()
        self.is_trained    = False
        self.feature_names = None
        self._init_model()

    # ── Model initialisation ──────────────────────────────────────────────

    def _init_model(self):
        if self.model_type == "xgb":
            try:
                from xgboost import XGBClassifier
                self.model = XGBClassifier(
                    n_estimators     = config.XGB_N_ESTIMATORS,
                    max_depth        = config.XGB_MAX_DEPTH,
                    learning_rate    = config.XGB_LEARNING_RATE,
                    subsample        = config.XGB_SUBSAMPLE,
                    colsample_bytree = config.XGB_COLSAMPLE_BYTREE,
                    eval_metric      = "logloss",
                    random_state     = config.RANDOM_STATE,
                    verbosity        = 0,
                )
                return
            except ImportError:
                print("  XGBoost not installed — pip install xgboost")
                print("  Falling back to Random Forest")
                self.model_type = "rf"

        if self.model_type == "rf":
            self.model = RandomForestClassifier(
                n_estimators = config.RF_N_ESTIMATORS,
                max_depth    = config.RF_MAX_DEPTH,
                class_weight = "balanced",
                random_state = config.RANDOM_STATE,
                n_jobs       = -1,
            )
        else:  # lr
            self.model = LogisticRegression(
                max_iter     = 1000,
                class_weight = "balanced",
                random_state = config.RANDOM_STATE,
            )

    # ── Label generation ──────────────────────────────────────────────────

    @staticmethod
    def prepare_training_labels(classification_maps, years, features_df=None):
        """
        Create ecologically grounded binary labels for future mangrove loss.

        Priority:
          1. features_df available → ecological stress conditions.
          2. Fallback → observed loss between last two years, spatially dilated.
        """
        from scipy.ndimage import binary_dilation

        years_list = sorted(years)
        if len(years_list) < 2:
            print("Need at least 2 years for training labels")
            return None

        h, w = list(classification_maps.values())[0].shape

        # ── Method 1: feature-derived ──────────────────────────────────────
        if features_df is not None:
            is_mg    = features_df["current_mangrove"].values.astype(bool)
            ndvi_tr  = features_df["ndvi_trend"].values
            dist_urb = features_df["distance_to_urban"].values
            loss_cnt = features_df["previous_loss_count"].values

            conditions = [
                ndvi_tr  < -0.02,
                dist_urb < 20,
                loss_cnt > 0,
            ]
            if "aquaculture_proximity" in features_df.columns:
                conditions.append(features_df["aquaculture_proximity"].values < 15)
            if "mangrove_fragmentation" in features_df.columns:
                conditions.append(features_df["mangrove_fragmentation"].values > 0.5)

            at_risk = is_mg & np.stack(conditions, axis=1).any(axis=1)
            labels  = at_risk.reshape(h, w).astype(int)
            print(f"  Feature-derived labels: {labels.sum()} at-risk pixels "
                  f"({labels.mean() * 100:.1f}%)")
            return labels

        # ── Method 2: observed spatial loss ───────────────────────────────
        y1, y2       = years_list[-2], years_list[-1]
        m1, m2       = classification_maps[y1], classification_maps[y2]
        recent_loss  = ((m1 == 1) & (m2 == 0)).astype(int)
        loss_dilated = binary_dilation(recent_loss, iterations=3).astype(int)
        labels       = (loss_dilated & (m2 == 1).astype(int))
        print(f"  Observed-loss labels: {labels.sum()} at-risk pixels "
              f"({labels.mean() * 100:.1f}%)")
        return labels

    # ── Training utilities ────────────────────────────────────────────────

    @staticmethod
    def _apply_smote(X, y):
        """Balance classes with SMOTE if imbalanced-learn is available."""
        if not config.USE_SMOTE:
            return X, y
        pos = int(y.sum())
        if pos < 6:
            print("  SMOTE skipped: fewer than 6 positive samples")
            return X, y
        try:
            from imblearn.over_sampling import SMOTE
            k  = min(5, pos - 1)
            sm = SMOTE(random_state=config.RANDOM_STATE, k_neighbors=k)
            X_r, y_r = sm.fit_resample(X, y)
            print(f"  SMOTE: {int(y_r.sum())} pos / {len(y_r)} total "
                  f"(was {pos} / {len(y)})")
            return X_r, y_r
        except ImportError:
            print("  imbalanced-learn not installed — pip install imbalanced-learn")
            return X, y

    def _spatial_cv(self, X, y, shape):
        """
        Compute spatial block CV AUC using a lightweight RF per fold (fast).
        Returns list of per-fold AUC scores.
        """
        from sklearn.preprocessing import StandardScaler as _SS

        cv     = SpatialBlockCV(shape=shape, n_blocks=config.SPATIAL_CV_BLOCKS,
                                random_state=config.RANDOM_STATE)
        scores = []
        for fold_i, (tr_idx, te_idx) in enumerate(cv.split(len(X))):
            y_tr, y_te = y[tr_idx], y[te_idx]
            if y_tr.sum() < 2 or y_te.sum() < 1:
                continue
            sc  = _SS()
            Xtr = sc.fit_transform(X[tr_idx])
            Xte = sc.transform(X[te_idx])
            _m  = RandomForestClassifier(
                n_estimators=50, max_depth=8,
                class_weight="balanced", random_state=42, n_jobs=-1,
            )
            _m.fit(Xtr, y_tr)
            try:
                auc = roc_auc_score(y_te, _m.predict_proba(Xte)[:, 1])
                scores.append(auc)
                print(f"  Fold {fold_i + 1}: AUC = {auc:.3f}")
            except Exception:
                pass

        if scores:
            print(f"  Spatial CV mean AUC = {np.mean(scores):.3f} "
                  f"± {np.std(scores):.3f}")
        return scores

    # ── Main training ─────────────────────────────────────────────────────

    def train(self, features_df, labels_map, test_size=0.2):
        """Train the risk prediction model."""
        if features_df is None or len(features_df) == 0:
            print("No features provided for training")
            return False

        h, w = labels_map.shape
        y    = labels_map.reshape(h * w)
        X    = features_df.values
        self.feature_names = list(features_df.columns)

        # ── Spatial block CV (honest metrics, doesn't affect final model) ──
        print(f"\nSpatial block CV "
              f"({config.SPATIAL_CV_BLOCKS}×{config.SPATIAL_CV_BLOCKS} blocks)...")
        self._spatial_cv(X, y, shape=(h, w))

        # ── Train / test split ─────────────────────────────────────────────
        stratify = y if int(y.sum()) >= 2 else None
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size,
            random_state=config.RANDOM_STATE, stratify=stratify,
        )
        X_train_sc = self.scaler.fit_transform(X_train)
        X_test_sc  = self.scaler.transform(X_test)

        # ── SMOTE ─────────────────────────────────────────────────────────
        X_train_sc, y_train = self._apply_smote(X_train_sc, y_train)

        # ── XGBoost scale_pos_weight (applied after SMOTE so ratio is current) ─
        if self.model_type == "xgb":
            neg, pos = int((y_train == 0).sum()), int((y_train == 1).sum())
            if pos > 0:
                self.model.set_params(scale_pos_weight=min(neg / pos, 20))

        # ── Train ─────────────────────────────────────────────────────────
        print(f"\nTraining {self.model_type.upper()} on {len(X_train)} samples "
              f"({int(y_train.sum())} positive)...")
        self.model.fit(X_train_sc, y_train)
        self.is_trained = True

        # ── Evaluate on held-out test set ──────────────────────────────────
        y_pred = self.model.predict(X_test_sc)
        print(f"\nHeld-out test performance:")
        print(classification_report(y_test, y_pred, zero_division=0))

        if hasattr(self.model, "predict_proba"):
            try:
                auc = roc_auc_score(y_test, self.model.predict_proba(X_test_sc)[:, 1])
                print(f"Hold-out ROC-AUC: {auc:.3f}")
            except Exception:
                pass

        # ── Feature importance ────────────────────────────────────────────
        importances = None
        if hasattr(self.model, "feature_importances_"):
            importances = self.model.feature_importances_
        elif hasattr(self.model, "coef_"):
            importances = np.abs(self.model.coef_[0])

        if importances is not None:
            imp_df = pd.DataFrame({
                "feature":    self.feature_names,
                "importance": importances,
            }).sort_values("importance", ascending=False)
            print(f"\nTop risk factors:\n{imp_df.to_string(index=False)}")

        return True

    # ── Prediction ────────────────────────────────────────────────────────

    def predict_risk(self, features_df, shape=None):
        """Predict loss risk probability for each pixel."""
        if not self.is_trained:
            print("Model not trained yet")
            return None, None

        X_scaled = self.scaler.transform(features_df.values)

        if hasattr(self.model, "predict_proba"):
            risk_proba = self.model.predict_proba(X_scaled)[:, 1]
        else:
            risk_proba = self.model.predict(X_scaled).astype(float)

        risk_map = risk_proba.reshape(shape) if shape else None
        return risk_proba, risk_map

    def classify_risk_zones(self, risk_map):
        """Classify pixels into low / medium / high risk zones."""
        zones = np.zeros_like(risk_map, dtype=int)
        low_t, med_t = config.RISK_THRESHOLDS["low"], config.RISK_THRESHOLDS["medium"]
        zones[(risk_map > low_t) & (risk_map <= med_t)] = 1
        zones[risk_map > med_t]                          = 2

        zone_counts = {
            "low":    int(np.sum(zones == 0)),
            "medium": int(np.sum(zones == 1)),
            "high":   int(np.sum(zones == 2)),
        }
        return zones, zone_counts

    # ── Persistence ───────────────────────────────────────────────────────

    def save_model(self, model_path=None):
        if model_path is None:
            model_path = f"{config.MODELS_DIR}/risk_model.pkl"
        Path(config.MODELS_DIR).mkdir(exist_ok=True)
        with open(model_path, "wb") as f:
            pickle.dump({
                "model":         self.model,
                "scaler":        self.scaler,
                "feature_names": self.feature_names,
                "model_type":    self.model_type,
            }, f)
        print(f"✓ Model saved: {model_path}")

    @staticmethod
    def load_model(model_path):
        with open(model_path, "rb") as f:
            d = pickle.load(f)
        p = RiskPredictor(model_type=d["model_type"])
        p.model         = d["model"]
        p.scaler        = d["scaler"]
        p.feature_names = d["feature_names"]
        p.is_trained    = True
        print(f"✓ Model loaded: {model_path}")
        return p


def run_stage3(engineer, detector):
    """Execute Stage 3 with outputs from previous stages."""
    print("\n" + "=" * 50)
    print("STAGE 3: RISK PREDICTION MODEL")
    print("=" * 50)

    years  = sorted(detector.classification_maps.keys())
    labels = RiskPredictor.prepare_training_labels(
        detector.classification_maps,
        years,
        features_df=engineer.features_df,
    )

    predictor = RiskPredictor(model_type="xgb")

    if engineer.features_df is not None and labels is not None:
        predictor.train(engineer.features_df, labels)

    if engineer.features_df is not None and predictor.is_trained:
        ref_map = detector.classification_maps[years[-1]]
        risk_proba, risk_map = predictor.predict_risk(
            engineer.features_df, shape=ref_map.shape,
        )
        zones, zone_counts = predictor.classify_risk_zones(risk_map)

        print(f"\nRisk Zone Distribution:")
        for z, c in zone_counts.items():
            print(f"  {z.capitalize()} Risk: {c} pixels")

        predictor.save_model()

    return predictor


if __name__ == "__main__":
    print("Run main.py to execute full pipeline")
