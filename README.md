# Mangrove Monitor — Vasai–Konkan Coast

> **A production-grade geospatial AI platform for real-time mangrove monitoring, risk prediction, and ecosystem valuation along the 400 km Konkan coastline of Maharashtra, India.**

---

## Overview

Mangrove Monitor integrates satellite remote sensing, machine learning, and an interactive web dashboard to detect, predict, and visualise mangrove loss across the Vasai–Konkan coast (lat 15.5°–19.5° N, lon 72.7°–73.9° E). The system ingests Global Mangrove Watch v3.0 data, runs a four-stage ML pipeline, and surfaces results through a Next.js dashboard with live predictions, SHAP explainability, interactive Leaflet maps, and full ecosystem-services valuation in Indian Rupees.

---

## Key Results at a Glance

| Metric | Value |
|---|---|
| Study area | 400 km Vasai–Konkan coastline |
| Analysis grid | 256 × 256 pixels @ 10 m resolution (~6.5 km²) |
| Mangrove coverage (2025) | **22.1 %** — 14,478 px — 144.78 ha |
| 5-year net change | **−0.19 %** (−55 pixels) |
| High-risk pixels | **120** (0.2 % of study area) |
| Model accuracy | **96 %** |
| ROC-AUC | **0.931** |
| F1-Score | **0.955** |
| Top risk driver | NDVI Trend (26.2 % importance) |
| Annual carbon sequestration | 868.7 tCO₂/yr (**₹10.86 lakh/yr**) |
| Total ecosystem services | **₹3.72 Cr/yr** |

---

## Features

### ML Pipeline (4 Stages)

| Stage | What it does |
|---|---|
| **Change Detection** | Loads GMW v3.0 binary extent maps for 2020, 2021, 2023, 2025; generates NDVI/NDWI per year; detects loss/gain pixels between consecutive periods |
| **Feature Engineering** | Extracts 9 geospatial risk features per pixel across the full 65,536-vector grid (NDVI trend, urban distance, coast distance, aquaculture proximity, elevation proxy, fragmentation, and more) |
| **Risk Prediction** | XGBoost classifier (300 trees, depth 6, lr = 0.05) with SMOTE class-balancing and 4×4 spatial block cross-validation to prevent autocorrelation leakage |
| **Output Generation** | 18 PNG maps, transparent RGBA overlays, `features.csv` (65k rows), `summary_report.txt`, and a serialised `risk_model.pkl` |

### Interactive Dashboard (7 Pages)

| Page | Highlights |
|---|---|
| **Dashboard** | Hero KPIs, coverage trend chart, quick-navigation cards |
| **Interactive Map** | Leaflet map with year selector, time-lapse animation (0.5×/1×/2×), risk layer toggle, draw-zone tool → instant risk report, 3 basemaps |
| **Change Detection** | Period-by-period loss/gain maps (2020→2021, 2021→2023, 2023→2025); annotated timeline bar chart |
| **Risk Analysis** | Continuous risk heatmap overlay; zone-distribution donut chart (Low 96.8 %, Medium 3.1 %, High 0.2 %) |
| **Live Prediction** | 9-slider real-time XGBoost inference; risk probability badge; SHAP waterfall chart showing per-feature contribution |
| **Model Info** | Algorithm details, spatial CV methodology, performance metrics, feature importance bar chart |
| **Analytics** | Carbon stock & sequestration; ecosystem-services breakdown (fisheries, coastal protection, carbon market, biodiversity); environmental correlations; CSV/PNG/report downloads |

---

## Architecture

```
mangroves/
├── mangrove_loss_prediction/       # ML pipeline
│   ├── main.py                     # Four-stage orchestrator
│   ├── config.py                   # Study area, years, model hyperparameters
│   ├── src/
│   │   ├── stage1_change_detection/detector.py
│   │   ├── stage2_feature_engineering/feature_extractor.py
│   │   ├── stage3_risk_model/predictor.py
│   │   └── stage4_outputs/visualizer.py
│   ├── utils/
│   │   ├── gmw_loader.py           # GMW v3.0 loader + realistic synthetic generator
│   │   └── data_handler.py         # Geometry helpers
│   ├── data/gmw_cache/             # Cached .npy rasters
│   ├── models/risk_model.pkl       # Trained XGBoost + StandardScaler
│   └── outputs/                    # 18 PNGs, features.csv, summary_report.txt
│
├── backend/
│   ├── api.py                      # FastAPI — 15+ REST endpoints, port 8000
│   └── requirements.txt
│
├── frontend/
│   ├── app/                        # Next.js 14 App Router (7 pages)
│   ├── components/                 # 12+ reusable React/TypeScript components
│   ├── lib/api.ts                  # Typed Axios API client
│   ├── tailwind.config.ts          # Custom design tokens
│   └── package.json
│
├── run.bat                         # One-click launcher (opens both servers + browser)
├── generate_logbook.py             # DOCX formal-submission report generator
└── PROJECT_CONTEXT.md              # 589-line comprehensive specification
```

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Recharts, Leaflet.js / react-leaflet, Axios |
| **Backend** | FastAPI, Uvicorn, Python 3.10+ |
| **Machine Learning** | XGBoost, scikit-learn, imbalanced-learn (SMOTE), SHAP (TreeExplainer) |
| **Data / Geospatial** | NumPy, Pandas, SciPy, Rasterio, GDAL, Global Mangrove Watch v3.0 |
| **Visualisation** | Matplotlib, Seaborn, Recharts (5+ chart types), Leaflet |
| **Data source** | Zenodo — GMW v3.0 (2020 baseline, streamed via GDAL vsicurl) |

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Windows (for `run.bat`; see manual steps below for Linux/macOS)

### One-click launch (Windows)

```bat
run.bat
```

This opens two terminal windows — one for the FastAPI backend (port 8000) and one for the Next.js frontend (port 3000) — and automatically opens `http://localhost:3000` in your browser.

### Manual launch

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn api:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

**ML pipeline** (run once to generate maps and train the model)
```bash
cd mangrove_loss_prediction
python main.py
```

---

## API Reference

The FastAPI backend exposes 15+ endpoints at `http://localhost:8000`.

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/coverage` | GET | Mangrove coverage % per year (2020–2025) |
| `/api/changes` | GET | Loss/gain pixel counts per period |
| `/api/risk-summary` | GET | Risk zone distribution |
| `/api/features` | GET | Feature statistics from `features.csv` |
| `/api/model-info` | GET | Algorithm, metrics, feature importances |
| `/api/predict` | POST | 9-feature vector → risk probability + SHAP values |
| `/api/map-image/{type}` | GET | Serve generated PNG maps |
| `/api/analytics/carbon` | GET | Carbon stock & sequestration metrics |
| `/api/analytics/economic` | GET | Ecosystem services valuation (₹/yr) |
| `/api/analytics/correlations` | GET | Environmental driver correlations |
| `/api/risk-zone-query` | POST | Bounding box → custom risk report |
| `/api/download/features-csv` | GET | Download `features.csv` |
| `/api/download/summary-report` | GET | Download `summary_report.txt` |
| `/api/download/map-png/{type}` | GET | Download any generated map PNG |

### Predict endpoint

**Request**
```json
POST /api/predict
{
  "ndvi_trend": -0.05,
  "distance_to_urban": 50,
  "distance_to_coast": 30,
  "previous_loss_count": 0,
  "water_proximity": 0.2,
  "current_mangrove": 1,
  "aquaculture_proximity": 30.0,
  "elevation_proxy": 0.4,
  "mangrove_fragmentation": 0
}
```

**Response**
```json
{
  "probability": 73.4,
  "risk_level": "High",
  "color": "#DC2626",
  "recommendation": "Immediate intervention recommended...",
  "shap_values": { "ndvi_trend": -0.31, "aquaculture_proximity": 0.18, ... },
  "expected_value": 0.042,
  "shap_available": true
}
```

---

## ML Pipeline Details

### Model

- **Algorithm**: XGBoost Classifier (`n_estimators=300`, `max_depth=6`, `learning_rate=0.05`)
- **Fallback**: Random Forest if XGBoost is unavailable
- **Class imbalance**: SMOTE oversampling (handles ~90 % non-risk majority class)
- **Validation**: 4×4 spatial block cross-validation (prevents spatial autocorrelation leakage)

### Features (9 total)

| # | Feature | Ecological meaning |
|---|---|---|
| 1 | NDVI Trend | Canopy health slope over 5 years |
| 2 | Distance to Urban | Anthropogenic pressure gradient |
| 3 | Distance to Coastline | Exposure to storm surge |
| 4 | Previous Loss Count | Disturbance recurrence |
| 5 | Water Proximity (NDWI mean) | Salinity / inundation proxy |
| 6 | Current Mangrove Status | Binary presence/absence |
| 7 | Aquaculture Proximity | Shrimp/fish pond encroachment risk |
| 8 | Elevation Proxy | Tidal flat vulnerability |
| 9 | Mangrove Fragmentation | Edge vs. interior pixel classification |

### Performance

| Metric | Score |
|---|---|
| Accuracy | 96 % |
| ROC-AUC | 0.931 |
| Precision | 0.96 |
| Recall | 0.95 |
| F1-Score | 0.955 |

### Feature importances

| Feature | Importance |
|---|---|
| NDVI Trend | 26.2 % |
| Aquaculture Distance | 19.8 % |
| Distance to Urban | 17.5 % |
| Water Proximity | 12.3 % |
| Mangrove Fragmentation | 10.1 % |
| Others | 14.1 % |

---

## Data Sources

| Source | Description |
|---|---|
| **Global Mangrove Watch v3.0** | Binary mangrove extent rasters (Zenodo, 2020 baseline), streamed via GDAL `vsicurl` |
| **Synthetic progression** | Year-on-year progressive loss calibrated to Konkan coast rates (0.5 %/yr cumulative, 2020–2025) |
| **Urban masks** | Synthetic boundaries for Vasai, Alibag, Ratnagiri, Sindhudurg |
| **Aquaculture zones** | Synthetic shrimp/fish pond polygons near creek mouths (7 sites) |
| **Elevation proxy** | Coastal gradient + Gaussian creek-mouth patches |

---

## Ecosystem Services Valuation

### Carbon

| Metric | Value |
|---|---|
| Carbon stock density | 900 tC/ha |
| Annual sequestration | 6.0 tCO₂/ha/yr |
| Carbon price (Gold Standard 2024) | ₹1,250/tCO₂ |
| 2025 total stock | 477,882 tCO₂ |
| Annual sequestration (2025) | 868.7 tCO₂/yr |
| Annual carbon value | **₹10.86 lakh/yr** |

### Ecosystem Services

| Service | ₹/ha/yr |
|---|---|
| Fisheries & nursery habitat | 1,50,000 |
| Coastal protection | 80,000 |
| Carbon market | 7,500 |
| Biodiversity & recreation | 20,000 |
| **Total (2025)** | **₹3.72 Cr/yr** |

---

## Configuration

Key settings in `mangrove_loss_prediction/config.py`:

```python
STUDY_AREA         = "Vasai–Konkan Coast, Maharashtra"
LATITUDE_BOUNDS    = (15.5, 19.5)
LONGITUDE_BOUNDS   = (72.7, 73.9)
YEARS              = [2020, 2021, 2023, 2025]
GRID_SIZE          = 256
RESOLUTION_M       = 10
USE_SMOTE          = True
SPATIAL_CV_BLOCKS  = 4
NDVI_THRESHOLD     = 0.5
XGB_N_ESTIMATORS   = 300
XGB_MAX_DEPTH      = 6
XGB_LEARNING_RATE  = 0.05
```

---

## Generated Outputs

Running the ML pipeline produces the following in `mangrove_loss_prediction/outputs/`:

| File | Description |
|---|---|
| `mangrove_map_<year>.png` | Binary classification map (forest green = mangrove) |
| `mangrove_map_<year>_overlay.png` | Transparent RGBA overlay for Leaflet |
| `change_map_<y1>_<y2>.png` | Loss (red) / gain (green) change map |
| `risk_heatmap.png` | Continuous risk probability (RdYlGn_r colormap) |
| `risk_zones.png` | Discrete Low / Medium / High risk classification |
| `change_timeline.png` | Bar chart: loss, gain, net per period |
| `features.csv` | 65,536 rows × 9 features (full pixel dataset) |
| `summary_report.txt` | Human-readable results summary |
| `models/risk_model.pkl` | Trained XGBoost + StandardScaler (pickle) |

---

## Project Structure Notes

- The backend is **stateless** — all endpoints serve pre-computed outputs or run live inference against the loaded model; no database is required.
- Frontend API calls are typed end-to-end via `frontend/lib/api.ts`.
- The `generate_logbook.py` script produces a formal DOCX report suitable for academic or government submission.
- CORS is configured for `localhost:3000`; update `backend/api.py` for production deployments.

---

## License

This project was developed for academic research and conservation advocacy. Data derived from Global Mangrove Watch is subject to its respective open-data licence. All other code is released under the MIT License.

---

*Built with Python, FastAPI, Next.js, XGBoost, and a commitment to protecting one of India's most vital coastal ecosystems.*
