"""
Configuration settings for Mangrove Loss Prediction project
"""

# Study Area
STUDY_AREA = "Vasai–Konkan Coast, Maharashtra"
LATITUDE_BOUNDS = (15.5, 19.5)
LONGITUDE_BOUNDS = (72.7, 73.9)

# Temporal Configuration
START_YEAR = 2020
END_YEAR = 2025
YEARS = [2020, 2021, 2023, 2025]

# Satellite Data
SATELLITE = "Sentinel-2"
BAND_CONFIG = {
    "red": 3,
    "green": 2,
    "blue": 1,
    "nir": 4,
    "swir": 11
}

# NDVI Thresholds
NDVI_THRESHOLD_MANGROVE = 0.5  # Classify as mangrove if NDVI > threshold
NDVI_THRESHOLD_VEGETATION = 0.4

# Classification Settings
RF_N_ESTIMATORS = 100
RF_MAX_DEPTH = 20
RANDOM_STATE = 42

# XGBoost settings
XGB_N_ESTIMATORS     = 300
XGB_MAX_DEPTH        = 6
XGB_LEARNING_RATE    = 0.05
XGB_SUBSAMPLE        = 0.8
XGB_COLSAMPLE_BYTREE = 0.8

# Training enhancements
USE_SMOTE         = True  # SMOTE class balancing (requires imbalanced-learn)
SPATIAL_CV_BLOCKS = 4     # N for N×N spatial block cross-validation grid

# Feature Engineering
DISTANCE_BUFFER_URBAN = 5000  # meters
DISTANCE_BUFFER_COAST = 10000  # meters

# Risk Classification
RISK_THRESHOLDS = {
    "low": 0.33,
    "medium": 0.67,
    "high": 1.0
}

# File Paths
DATA_DIR = "./data"
OUTPUT_DIR = "./outputs"
MODELS_DIR = "./models"

# Global Mangrove Watch (GMW v3.0) settings
GMW_CACHE_DIR = "./data/gmw_cache"   # cached clipped arrays go here
USE_GMW_DATA  = True                  # set False to skip network attempt entirely
