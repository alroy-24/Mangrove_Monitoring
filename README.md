<div align="center">

# Mangrove Monitor
### Vasai–Konkan Coast, Maharashtra

**A production-grade geospatial AI platform for real-time mangrove monitoring,  
risk prediction, and ecosystem-services valuation along 400 km of India's Konkan coastline.**

---

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![XGBoost](https://img.shields.io/badge/XGBoost-Classifier-FF6600?style=for-the-badge)
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)

![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=for-the-badge&logo=leaflet&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-Charts-8884d8?style=for-the-badge)
![SHAP](https://img.shields.io/badge/SHAP-Explainability-blue?style=for-the-badge)
![GMW](https://img.shields.io/badge/Global_Mangrove_Watch-v3.0-2d7a2d?style=for-the-badge)

</div>

---

## Dashboard

![Mangrove Monitor — Dashboard with KPI cards and 5-year coverage trend](docs/screenshots/dashboard.png.png)

> **22.1 % coverage · −0.19 % 5-year change · 0.2 % high-risk area · 95 % model accuracy** — at a glance from the hero dashboard.

---

## Interactive Map

![Leaflet interactive map of Vasai–Konkan coastline with mangrove overlays and draw-zone risk report](docs/screenshots/map.png.png)

> Leaflet map of the full Vasai–Konkan coastline with transparent RGBA mangrove overlays, year selector (2020 / 2021 / 2023 / 2025), time-lapse animation (0.5× / 1× / 2×), risk layer toggle, and three basemaps (Street / Clean / Satellite).

---

## Draw-Area Prediction

One of the most powerful features of the map: **click and drag any rectangular zone** on the coastline to fire an instant risk query against the backend. The Zone Risk Report panel (visible at the bottom of the map screenshot above) returns a full breakdown for that custom area in real time.

| Field | What it shows |
|---|---|
| **Area** | Size of your selected zone in hectares |
| **Dominant Risk** | Majority risk class (Low / Medium / High) across pixels in the zone |
| **Carbon Stock** | Estimated tCO₂ stored in the selected zone |
| **Annual Value** | Ecosystem services value (₹/yr) for the zone |
| **Risk Distribution** | Bar showing the Low / Medium / High pixel split within the zone |

> In the screenshot the drawn zone returns **Medium risk**, covering **0.8 ha**, holding **2.3k tCO₂** of carbon stock, worth **₹1.6L/yr** in ecosystem services — all computed on the fly from the XGBoost risk model output without a page reload.

This allows conservationists and field researchers to **interrogate any sub-region of the coast** without needing GIS software or scripting knowledge.

---

## Risk Analysis

![Risk Analysis — donut chart, probability heatmap, and classified risk zone map](docs/screenshots/risk.png.png)

> XGBoost predicts per-pixel loss probability across all 65,536 pixels. **96.8 % Low · 3.1 % Medium · 0.2 % High (120 critical pixels)**. Visualised as a continuous heatmap (RdYlGn_r) and a discrete risk-zone classification map.

---

## Live Prediction & SHAP Explainability

![Live Prediction — 9 feature sliders, risk badge, input summary panel](docs/screenshots/predict.png.png)

![SHAP waterfall chart — per-feature contribution to risk prediction](docs/screenshots/shap.png.png)

> Adjust 9 ecological sliders and hit **Predict Risk** — XGBoost returns a probability and risk badge in real time. The SHAP waterfall chart below explains exactly why: here *Current Mangrove* pushes risk up by +6.17 while *Aquaculture Distance* (−4.28) and *Fragmentation* (−2.01) pull it down.

---

## Data & Analytics

The Analytics module provides a four-tab deep-dive into carbon accounting, ecosystem economics, environmental driver correlations, and data exports.

### Carbon Sequestration

![Carbon tab — total stock, annual sequestration, carbon lost, cars equivalent, carbon market value chart](docs/screenshots/carbon.png.png)

> **478.2k tCO₂** total above- and below-ground carbon stock. The mangroves sequester **869 tCO₂/yr**, equivalent to removing **395 cars** from the road annually. Net coverage loss since 2020 has cost **1,817 tCO₂** — worth ₹22.7 lakh at Gold Standard voluntary-market rates (₹1,250/tCO₂).

| Metric | Value |
|---|---|
| Total carbon stock (2025) | 478,200 tCO₂ |
| Annual sequestration | 869 tCO₂/yr |
| Carbon lost (2020–25) | 1,817 tCO₂ |
| Cars-equivalent offset | 395 vehicles/yr |
| Annual carbon market value | **₹10.86 lakh/yr** |

---

### Ecosystem Economics

![Economic tab — ₹3.73 Cr total annual value, service breakdown cards, stacked bar chart, and service-mix pie chart](docs/screenshots/analytics.png.png)

> The 144.78 ha of remaining mangroves provide **₹3.73 Cr/yr** in ecosystem services. Fisheries and coastal protection account for the bulk; 5-year net loss has eroded **₹1.42 lakh/yr** in permanent services — captured in the stacked bar chart and service-mix donut.

| Ecosystem Service | Rate (₹/ha/yr) | 2025 Value |
|---|---|---|
| Fisheries & nursery habitat | ₹1,50,000 | **₹2.17 Cr** |
| Coastal protection | ₹80,000 | **₹1.16 Cr** |
| Carbon market | ₹7,500 | **₹10.9 L** |
| Biodiversity & recreation | ₹20,000 | **₹29.0 L** |
| **Total** | | **₹3.73 Cr/yr** |
| Value lost (2020–25) | | ₹1.42 lakh/yr |

---

### Environmental Driver Correlations

![Correlations tab — rainfall vs gain, urban growth vs loss, population density vs loss, NDVI health vs coverage](docs/screenshots/correlations.png.png)

> Four environmental drivers are strongly correlated with mangrove dynamics across the Konkan coast. Monthly monsoon rainfall drives regeneration (r = 0.94), while urban expansion and population density are the dominant loss predictors (r = 0.97 and 0.96). NDVI health tracks overall coverage trends at r = 0.82.

| Driver | Correlation (r) | Strength |
|---|---|---|
| Rainfall → Mangrove Gain | **0.94** | Very Strong |
| Urban Growth → Loss | **0.97** | Very Strong |
| Population Density → Loss | **0.96** | Very Strong |
| NDVI Health → Coverage | **0.82** | Strong |

---

## Key Results

<div align="center">

| Metric | Value |
|---|---|
| Study area | 400 km Vasai–Konkan coastline |
| Analysis grid | 256 × 256 px @ 10 m resolution (~6.5 km²) |
| Mangrove coverage (2025) | **22.1 %** — 14,478 px — 144.78 ha |
| 5-year net change | **−0.19 %** (−55 pixels) |
| High-risk pixels | **120** (0.2 % of study area) |
| Model accuracy | **96 %** |
| ROC-AUC | **0.931** |
| F1-Score | **0.955** |
| Top risk driver | NDVI Trend (26.2 % feature importance) |
| Annual carbon sequestration | 869 tCO₂/yr — **₹10.86 lakh/yr** |
| Total ecosystem services | **₹3.73 Cr/yr** |

</div>

---

## System Architecture

```mermaid
graph TD
    GMW["🛰️ Global Mangrove Watch v3.0\nZenodo · GDAL vsicurl · 2020 baseline"]

    subgraph ML["Four-Stage ML Pipeline"]
        S1["Stage 1 — Change Detection\nNDVI · NDWI · binary maps · 2020–2025"]
        S2["Stage 2 — Feature Engineering\n9 features × 65,536 pixel vectors"]
        S3["Stage 3 — Risk Prediction\nXGBoost 300 trees · SMOTE · Spatial Block CV"]
        S4["Stage 4 — Output Generation\n18 PNG maps · features.csv · summary_report.txt"]
        S1 --> S2 --> S3 --> S4
    end

    subgraph BE["Backend — FastAPI :8000"]
        API["15+ REST Endpoints\n/predict · /coverage · /risk-summary\n/analytics · /map-image · /download"]
    end

    subgraph FE["Frontend — Next.js 14 :3000"]
        D["Dashboard\nKPI cards · trend chart"]
        M["Interactive Map\nLeaflet · overlays · draw-zone"]
        P["Live Prediction\nSHAP waterfall · sliders"]
        A["Analytics\nCarbon · Economy · Correlations"]
        C["Change Detection\nperiod maps · timeline"]
        R["Risk Analysis\nheatmap · donut chart"]
    end

    GMW --> S1
    S4 --> API
    API --> D & M & P & A & C & R
```

---

## ML Pipeline Flow

```mermaid
flowchart LR
    A["🛰️ GMW v3.0\n2020 Baseline\n+ Synthetic\nProgression"] --> B

    subgraph STAGE1["Stage 1"]
        B["Change Detection\nNDVI · NDWI\nbinary maps"]
    end

    subgraph STAGE2["Stage 2"]
        C["Feature Engineering\n9 features\n65,536 pixels"]
    end

    subgraph STAGE3["Stage 3"]
        D["SMOTE\nBalancing"]
        E["XGBoost\n300 trees\ndepth 6 · lr 0.05"]
        F["Spatial Block CV\n4×4 grid\nautocorrelation-safe"]
        D --> E --> F
    end

    subgraph STAGE4["Stage 4"]
        G["18 PNG Maps\nRGBA overlays\nCSV · report"]
    end

    B --> C --> D
    F --> G
    E --> H["SHAP\nTreeExplainer\nper-feature impact"]
```

---

## Features

### Dashboard Pages (7 total)

| Page | What you get |
|---|---|
| **Dashboard** | Hero KPIs, 5-year coverage trend chart, quick-navigation cards |
| **Interactive Map** | Leaflet map — year selector, time-lapse (0.5×/1×/2×), risk layer toggle, draw-zone → instant zone risk report, 3 basemaps |
| **Change Detection** | Period-by-period loss/gain maps (2020→2021, 2021→2023, 2023→2025); annotated timeline bar chart |
| **Risk Analysis** | Continuous risk heatmap; zone-distribution donut (Low / Medium / High); classified risk zones map |
| **Live Prediction** | 9-slider XGBoost inference; risk probability badge; SHAP waterfall chart |
| **Model Info** | Algorithm details, spatial CV methodology, performance metric cards, feature importance bar chart |
| **Analytics** | Carbon · Economic · Correlations · Downloads — four tabbed deep-dives |

### ML Pipeline (4 Stages)

| Stage | Description |
|---|---|
| **Change Detection** | Loads GMW v3.0 binary extent maps; generates per-year NDVI/NDWI arrays; detects loss/gain pixels between periods |
| **Feature Engineering** | Extracts 9 ecologically motivated geospatial risk features across all 65,536 pixel vectors |
| **Risk Prediction** | XGBoost binary classifier with SMOTE class-balancing and 4×4 spatial block cross-validation |
| **Output Generation** | 18 PNG maps + transparent RGBA Leaflet overlays + `features.csv` + `summary_report.txt` + `risk_model.pkl` |

---

## Project Structure

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
│   │   ├── gmw_loader.py           # GMW v3.0 + realistic synthetic fallback
│   │   └── data_handler.py
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
├── docs/screenshots/               # App screenshots used in this README
├── run.bat                         # One-click launcher — both servers + browser
├── generate_logbook.py             # DOCX formal-submission report generator
└── PROJECT_CONTEXT.md              # 589-line comprehensive specification
```

---

## Tech Stack

<div align="center">

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · Recharts · Leaflet.js · Axios |
| **Backend** | FastAPI · Uvicorn · Python 3.10+ |
| **Machine Learning** | XGBoost · scikit-learn · imbalanced-learn (SMOTE) · SHAP (TreeExplainer) |
| **Geospatial** | Rasterio · GDAL · Global Mangrove Watch v3.0 · NumPy · Pandas · SciPy |
| **Visualisation** | Matplotlib · Seaborn · Recharts · Leaflet |
| **Data source** | Zenodo — GMW v3.0 streamed via GDAL `vsicurl` |

</div>

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+

### One-click launch (Windows)

```bat
run.bat
```

Opens two terminals (FastAPI on `:8000`, Next.js on `:3000`) and launches the browser automatically.

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
# → http://localhost:3000
```

**ML pipeline** (run once to train the model and generate all maps)
```bash
cd mangrove_loss_prediction
python main.py
```

---

## API Reference

Base URL: `http://localhost:8000`

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/coverage` | GET | Mangrove coverage % per year |
| `/api/changes` | GET | Loss/gain pixel counts per period |
| `/api/risk-summary` | GET | Risk zone distribution |
| `/api/features` | GET | Feature statistics from `features.csv` |
| `/api/model-info` | GET | Algorithm, metrics, importances |
| `/api/predict` | POST | 9-feature vector → risk probability + SHAP |
| `/api/map-image/{type}` | GET | Serve generated PNG maps |
| `/api/analytics/carbon` | GET | Carbon stock & sequestration |
| `/api/analytics/economic` | GET | Ecosystem services valuation (₹/yr) |
| `/api/analytics/correlations` | GET | Environmental driver correlations |
| `/api/risk-zone-query` | POST | Bounding box → custom zone risk report |
| `/api/download/features-csv` | GET | Download `features.csv` |
| `/api/download/summary-report` | GET | Download text report |
| `/api/download/map-png/{type}` | GET | Download any map PNG |

### `/api/predict` — request & response

```json
// POST /api/predict
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

```json
// Response
{
  "probability": 73.4,
  "risk_level": "High",
  "color": "#DC2626",
  "recommendation": "Immediate intervention recommended...",
  "shap_values": { "ndvi_trend": -0.31, "aquaculture_proximity": 0.18 },
  "expected_value": 0.042,
  "shap_available": true
}
```

---

## ML Model Details

### Configuration

- **Algorithm**: XGBoost Classifier — `n_estimators=300`, `max_depth=6`, `learning_rate=0.05`
- **Fallback**: Random Forest (if XGBoost unavailable)
- **Class balancing**: SMOTE (handles ~90 % non-risk majority)
- **Validation**: 4×4 spatial block cross-validation (prevents autocorrelation leakage)

### 9 Input Features

| # | Feature | Ecological Meaning |
|---|---|---|
| 1 | NDVI Trend | Canopy health slope over 5 years |
| 2 | Distance to Urban | Anthropogenic pressure gradient |
| 3 | Distance to Coastline | Storm surge exposure |
| 4 | Previous Loss Count | Disturbance recurrence |
| 5 | Water Proximity (NDWI mean) | Salinity / inundation proxy |
| 6 | Current Mangrove Status | Binary presence / absence |
| 7 | Aquaculture Proximity | Shrimp / fish pond encroachment risk |
| 8 | Elevation Proxy | Tidal flat vulnerability |
| 9 | Mangrove Fragmentation | Edge vs. interior pixel classification |

### Performance

<div align="center">

| Metric | Score |
|---|---|
| Accuracy | **96 %** |
| ROC-AUC | **0.931** |
| Precision | **0.96** |
| Recall | **0.95** |
| F1-Score | **0.955** |

</div>

### Feature Importances

```
NDVI Trend             ████████████████████████████  26.2 %
Aquaculture Distance   ███████████████████           19.8 %
Distance to Urban      █████████████████             17.5 %
Water Proximity        ████████████                  12.3 %
Mangrove Fragmentation ██████████                    10.1 %
Others                 █████████████                 14.1 %
```

---

## Data Sources

| Source | Description |
|---|---|
| **Global Mangrove Watch v3.0** | Binary mangrove extent rasters (Zenodo, 2020 baseline, GDAL `vsicurl`) |
| **Synthetic progression** | Year-on-year loss at 0.5 %/yr, calibrated to Konkan coast rates (2020–2025) |
| **Urban masks** | Vasai, Alibag, Ratnagiri, Sindhudurg boundaries |
| **Aquaculture zones** | 7 synthetic shrimp/fish pond polygons near creek mouths |
| **Elevation proxy** | Coastal gradient + Gaussian creek-mouth patches |

---

## Generated Outputs

`mangrove_loss_prediction/outputs/`

| File | Description |
|---|---|
| `mangrove_map_<year>.png` | Binary classification map (forest green = mangrove) |
| `mangrove_map_<year>_overlay.png` | Transparent RGBA overlay for Leaflet |
| `change_map_<y1>_<y2>.png` | Loss (red) / gain (green) per period |
| `risk_heatmap.png` | Continuous risk probability (RdYlGn_r colormap) |
| `risk_zones.png` | Discrete Low / Medium / High classification |
| `change_timeline.png` | Bar chart: loss, gain, net per period |
| `features.csv` | 65,536 rows × 9 features (full pixel dataset) |
| `summary_report.txt` | Human-readable results summary |
| `models/risk_model.pkl` | Trained XGBoost + StandardScaler (pickle) |

---

## Configuration

`mangrove_loss_prediction/config.py`

```python
STUDY_AREA         = "Vasai–Konkan Coast, Maharashtra"
LATITUDE_BOUNDS    = (15.5, 19.5)
LONGITUDE_BOUNDS   = (72.7, 73.9)
YEARS              = [2020, 2021, 2023, 2025]
GRID_SIZE          = 256          # pixels per side
RESOLUTION_M       = 10           # metres per pixel
USE_SMOTE          = True
SPATIAL_CV_BLOCKS  = 4
NDVI_THRESHOLD     = 0.5
XGB_N_ESTIMATORS   = 300
XGB_MAX_DEPTH      = 6
XGB_LEARNING_RATE  = 0.05
```

---

## Notes

- **Stateless backend** — all endpoints serve pre-computed outputs or live model inference; no database required.
- **Typed API client** — `frontend/lib/api.ts` provides end-to-end TypeScript types for all 15+ endpoints.
- **Formal reporting** — `generate_logbook.py` produces a DOCX report for academic or government submission.
- **Production CORS** — update `allow_origins` in `backend/api.py` when deploying beyond localhost.

---

## License

Academic research and conservation advocacy. GMW data is subject to its open-data licence. All other code: MIT.

---

<div align="center">

*Built with Python · FastAPI · Next.js · XGBoost · and a commitment to protecting  
one of India's most vital coastal ecosystems.*

</div>
