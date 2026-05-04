# Mangrove Monitor — Project Context File
*Use this document as the primary reference for writing a formal project report.*

---

## 1. Project Title

**Mangrove Monitor: A Full-Stack Geospatial ML System for Mangrove Loss Prediction and Ecosystem Risk Analysis along the Vasai–Konkan Coastline, Maharashtra**

---

## 2. Problem Statement

Mangrove forests along India's Konkan coast are rapidly declining due to urban encroachment, coastal development, and climate variability. These ecosystems provide critical services — carbon sequestration, coastal storm protection, fisheries habitat, and biodiversity support — yet their monitoring relies heavily on manual field surveys that are slow, expensive, and geographically limited.

The core challenge: **can satellite imagery and machine learning automate the detection of mangrove change and predict which areas are at highest risk of loss, at scale, across a 400 km coastline?**

---

## 3. Objectives

1. Automate year-by-year mangrove classification using real-world reference data (Global Mangrove Watch v3.0) and ecologically grounded synthetic generation.
2. Detect spatial and temporal change (loss and gain) across the 2020–2025 period.
3. Engineer 9 geospatial risk features and train an XGBoost classifier with SMOTE balancing and spatial block cross-validation.
4. Provide explainability via SHAP values for each individual prediction.
5. Quantify the economic and carbon value of the monitored ecosystem.
6. Deliver findings through an interactive, production-quality web application.

---

## 4. Study Area

| Parameter | Value |
|-----------|-------|
| Region | Vasai–Konkan Coast, Maharashtra, India |
| Extent | ~400 km coastline |
| Latitude Bounds | 15.5°N – 19.5°N |
| Longitude Bounds | 72.7°E – 73.9°E |
| Key Locations | Vasai-Virar, Alibag, Ratnagiri, Sindhudurg |
| Grid Resolution | 256 × 256 pixels (65,536 total) |
| Pixel Size | ~10 m × 10 m = 0.01 ha/pixel |
| Satellite Source | Sentinel-2 (European Space Agency) |

---

## 5. Dataset and Satellite Data

### 5a. Global Mangrove Watch (GMW v3.0) — Primary Data Source

**Source:** JAXA / Zenodo record 6894273 (https://zenodo.org/record/6894273)
**Coverage:** Annual binary mangrove extent GeoTIFFs, 1996–2020.

The pipeline attempts to stream-clip the real GMW GeoTIFF over GDAL `vsicurl` (no full download required). On success, the clipped array is cached as `data/gmw_cache/gmw_<year>_base.npy`. On network/GDAL failure, it falls back to `RealisticMangroveGenerator`.

**Two-level cache:**
- `gmw_<gmw_year>_base.npy` — raw clipped raster (real or synthetic base)
- `gmw_<project_year>.npy` — base with year-specific progressive loss applied

### 5b. Realistic Synthetic Fallback (`utils/gmw_loader.py`)

`RealisticMangroveGenerator` encodes 7 real creek/estuary systems from the Konkan coast using Gaussian-weighted spatial patches:

| Creek System | Approx. Latitude | Density |
|---|---|---|
| Thane Creek / Ulhas estuary (Vasai-Virar) | ~19.3°N | 90% |
| Kundalika River / Alibag | ~18.6°N | 72% |
| Savitri River / Bankot | ~17.9°N | 63% |
| Shastri River / Jaigad | ~17.3°N | 56% |
| Ratnagiri harbour | ~17.0°N | 51% |
| Jagbudi creek | ~16.5°N | 45% |
| Terekhol / Sindhudurg | ~15.7°N | 39% |

**Year-on-year progressive loss:** The northern third (Vasai–Thane urban zone) loses mangrove pixels at ~0.5%/yr cumulative, calibrated to published loss rates for Thane Creek. Year 2025 carries a 7.4% cumulative loss vs. the 2015 baseline.

**Consistent NDVI/NDWI generation:** Each year's spectral indices are synthetically derived from the mangrove map with ecologically realistic values (mangrove NDVI: 0.50–0.85; non-mangrove: 0.10–0.60) and a calibrated northern health decline after 2018.

### 5c. Sentinel-2 Spectral Bands (Reference)

| Band Index | Name | Wavelength | Purpose |
|------------|------|------------|---------|
| Band 1 | Blue | ~490 nm | Base reflectance |
| Band 2 | Green | ~560 nm | Vegetation visibility |
| Band 3 | Red | ~665 nm | Chlorophyll absorption |
| Band 4 | NIR | ~842 nm | NDVI computation |
| Band 11 | SWIR | ~1610 nm | Water/soil distinction |

**Derived Indices:**
- **NDVI** (Normalized Difference Vegetation Index) = (NIR − Red) / (NIR + Red)
- **NDWI** (Normalized Difference Water Index) = (Green − NIR) / (Green + NIR)

**Temporal Coverage:** 2020, 2021, 2023, 2025 (4 acquisition years)

---

## 6. System Architecture

```
mangroves/
├── mangrove_loss_prediction/           ← ML Pipeline (Python)
│   ├── main.py                         ← Orchestrator: runs all 4 stages
│   ├── config.py                       ← Bounds, thresholds, model params
│   ├── src/
│   │   ├── stage1_change_detection/    ← GMW-backed classification + change maps
│   │   ├── stage2_feature_engineering/ ← 9-feature geospatial extraction
│   │   ├── stage3_risk_model/          ← XGBoost + SMOTE + spatial block CV
│   │   └── stage4_outputs/             ← PNG maps + transparent RGBA overlays
│   ├── utils/
│   │   ├── gmw_loader.py               ← GMW v3.0 loader + RealisticMangroveGenerator
│   │   └── data_handler.py             ← Geometry helpers
│   ├── data/gmw_cache/                 ← Cached .npy mangrove rasters
│   ├── models/                         ← Trained model (risk_model.pkl)
│   └── outputs/                        ← Generated PNGs, CSVs, reports
├── backend/
│   └── api.py                          ← FastAPI REST server (port 8000)
└── frontend/
    ├── app/                            ← Next.js 14 App Router pages
    └── components/                     ← React UI components
```

**Technology Stack:**

| Layer | Technology |
|-------|-----------|
| ML / Data Pipeline | Python 3.10+, NumPy, SciPy, Pandas, scikit-learn, XGBoost |
| Class Balancing | imbalanced-learn (SMOTE) |
| Explainability | SHAP (TreeExplainer) |
| Backend API | FastAPI, Uvicorn |
| Frontend Framework | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS (custom design tokens) |
| Charts | Recharts (bar, area, pie, scatter, waterfall) |
| Maps | Leaflet.js via react-leaflet v4 |
| Map Tiles | OpenStreetMap, CartoDB, ESRI World Imagery |
| Communication | REST JSON API over HTTP |

---

## 7. ML Pipeline — Four Stages

### Stage 1: Change Detection (`stage1_change_detection/detector.py`)

**Process:**
1. Load binary mangrove maps for each year via `GMWDataLoader` (real GMW or ecologically calibrated synthetic fallback).
2. Generate per-year consistent NDVI and NDWI arrays via `RealisticMangroveGenerator`.
3. Store classification maps in `self.classification_maps[year]`, NDVI in `self.ndvi_maps[year]`, NDWI in `self.ndwi_maps[year]`.
4. For each consecutive year pair, compute:
   - **Loss pixels:** mangrove in year₁, non-mangrove in year₂
   - **Gain pixels:** non-mangrove in year₁, mangrove in year₂
   - **Net change:** gain − loss

**Output:** Binary classification maps per year (NumPy `.npy` arrays), change metrics, NDVI/NDWI maps passed to Stage 2.

**Coverage results (2020–2025):**

| Year | Coverage % | Mangrove Pixels |
|------|-----------|----------------|
| 2020 | 22.1% | 14,533 |
| 2021 | 22.2% | 14,545 |
| 2023 | 22.3% | 14,613 |
| 2025 | 22.1% | 14,478 |

**Change metrics:**

| Period | Loss (px) | Gain (px) | Net Change |
|--------|-----------|-----------|-----------|
| 2020→2021 | 312 | 324 | +12 (+0.02%) |
| 2021→2023 | 285 | 353 | +68 (+0.10%) |
| 2023→2025 | 398 | 263 | −135 (−0.21%) |
| **5-Year Total** | **995** | **940** | **−55 (−0.19%)** |

---

### Stage 2: Feature Engineering (`stage2_feature_engineering/feature_extractor.py`)

Nine features are extracted per pixel (65,536 total feature vectors):

| # | Feature | Description | Method |
|---|---------|-------------|--------|
| 1 | `ndvi_trend` | Rate of NDVI change over the study period | Linear slope (last − first NDVI / years) |
| 2 | `distance_to_urban` | Distance to nearest urban patch | `scipy.ndimage.distance_transform_edt` |
| 3 | `distance_to_coast` | Distance to coastline | `distance_transform_edt` on coastline mask |
| 4 | `previous_loss_count` | Number of times pixel experienced loss | Sum across all loss period maps |
| 5 | `water_proximity` | Mean NDWI across years (salinity proxy) | Mean of real NDWI stack from Stage 1 |
| 6 | `current_mangrove` | Binary: is pixel mangrove in reference year | Direct from Stage 1 classification map |
| 7 | `aquaculture_proximity` | Distance to nearest shrimp/fish pond zone | `distance_transform_edt` on 7 synthetic aquaculture zones near creek mouths |
| 8 | `elevation_proxy` | Low-elevation coastal risk (0=inland, 1=tidal flat) | Exponential coastal gradient + creek-mouth Gaussian patches |
| 9 | `mangrove_fragmentation` | Edge vs. interior pixel (1=exposed edge, 0=canopy interior) | Binary erosion (2 iterations); edge = mangrove − eroded |

**Urban and Coastline Masks:** Synthetic masks simulate four Konkan coastal towns (Vasai, Alibag, Ratnagiri, Sindhudurg) and a west-facing shoreline with creek inlets.

**Aquaculture Zones:** 7 synthetic rectangular zones placed just inland of each creek mouth, representing typical shrimp/fish pond locations on the Konkan coast.

**Elevation Proxy:** Derived purely from geography — exponential coastal distance decay combined with Gaussian-weighted creek-mouth depressions, representing the real pattern of low-lying tidal flats at estuary mouths.

**Fragmentation:** Computed via `scipy.ndimage.binary_erosion(iterations=2)`. Edge pixels are statistically more vulnerable than interior canopy to salt intrusion and storm damage.

**Output:** `features.csv` — 65,536 rows × 9 feature columns.

---

### Stage 3: Risk Prediction Model (`stage3_risk_model/predictor.py`)

**Model:** XGBoost Classifier (default; falls back to Random Forest if XGBoost not installed)

**Configuration:**

| Parameter | Value |
|-----------|-------|
| Algorithm | XGBoost Classifier |
| n_estimators | 300 trees |
| max_depth | 6 |
| learning_rate | 0.05 |
| subsample | 0.8 |
| colsample_bytree | 0.8 |
| class_weight | `scale_pos_weight` (auto from class ratio) |
| Feature scaling | StandardScaler |
| Train / Test Split | 80% / 20% (stratified) |

**Class Balancing — SMOTE:**
Before training, SMOTE (Synthetic Minority Over-sampling Technique) resamples the minority at-risk class to achieve a balanced training set. This prevents the model from being dominated by the majority (not-at-risk) class, which represents ~90% of mangrove pixels. `k_neighbors = min(5, n_positive − 1)` to handle small positive counts.

**Cross-Validation — Spatial Block CV:**
A custom `SpatialBlockCV` class partitions the 256×256 raster into a 4×4 grid (16 tiles). Each of 4 folds holds out one column-strip of tiles as the test set. This prevents spatial autocorrelation leakage — adjacent pixels share spectral characteristics, so standard random k-fold inflates AUC scores by ~5–10% compared to spatial CV. A lightweight RF (50 trees) is used per fold for speed; the final model is XGBoost trained on the full 80% split.

**Training Labels — Ecological Stress Conditions:**
Labels are derived from feature-based ecological stress rather than random assignment:

```
at_risk = current_mangrove AND (
    ndvi_trend < −0.02         OR   # declining canopy health
    distance_to_urban < 20     OR   # encroachment pressure
    previous_loss_count > 0    OR   # historically lost pixels
    aquaculture_proximity < 15 OR   # near fish/shrimp ponds
    mangrove_fragmentation > 0.5    # isolated edge pixel
)
```

Fallback (when features unavailable): observed loss between the two most recent years, dilated by 3 pixels to neighbouring current-mangrove pixels.

**Performance Metrics:**

| Metric | Score |
|--------|-------|
| Accuracy | 96% |
| ROC-AUC | 0.931 |
| Precision | 0.96 |
| Recall | 0.95 |
| F1-Score | 0.955 |

**Feature Importances (post-training, descending):**

| Feature | Importance |
|---------|-----------|
| NDVI Trend | 26.2% |
| Aquaculture Distance | 19.8% |
| Distance to Urban | 17.5% |
| Elevation Risk | 14.2% |
| Current Mangrove Status | 9.8% |
| Fragmentation | 7.1% |
| Distance to Coast | 3.4% |
| Previous Loss Count | 1.4% |
| Water Proximity | 0.6% |

**Risk Classification Thresholds:**
- Low Risk: probability < 0.33
- Medium Risk: 0.33 ≤ probability < 0.67
- High Risk: probability ≥ 0.67

**Risk Zone Distribution (full study area):**

| Zone | Pixels | % of Area |
|------|--------|-----------|
| Low | 63,364 | 96.8% |
| Medium | 2,052 | 3.1% |
| High | 120 | 0.2% |

**Output:** Per-pixel risk probability map, risk zone classification map, trained model serialised to `models/risk_model.pkl`.

---

### Stage 4: Output Generation (`stage4_outputs/visualizer.py`)

Generates all visual and data artifacts:

**Matplotlib PNG maps (for dashboard display):**
- `mangrove_map_<year>.png` — binary classification maps per year
- `change_map_<year1>_<year2>.png` — loss/gain side-by-side per period
- `risk_heatmap.png` — continuous risk probability heatmap (RdYlGn_r colormap)
- `risk_zones.png` — discrete low/medium/high risk zone map
- `change_timeline.png` — grouped bar chart of loss/gain/net over time

**Transparent RGBA PNG overlays (for Leaflet `ImageOverlay`):**
- `mangrove_map_<year>_overlay.png` — mangrove pixels rendered as #16A34A (alpha=210), all else transparent
- `change_map_<year1>_<year2>_overlay.png` — loss=red (DC2626), gain=green (16A34A), rest transparent
- `risk_heatmap_overlay.png` — RdYlGn_r colormap, alpha proportional to risk score (low-risk mostly transparent)
- `risk_zones_overlay.png` — green/amber/red zones with distinct alpha levels

These overlays use `PIL.Image.fromarray(rgba, mode="RGBA")` so non-mangrove pixels are fully transparent, allowing the basemap tiles (OSM/CartoDB/ESRI) to show through underneath.

**Data files:**
- `features.csv` — full 65,536 × 9 feature dataset
- `summary_report.txt` — text report with all metrics

---

## 8. Backend API (`backend/api.py`)

Built with **FastAPI**, running on **port 8000**. Loads pre-generated outputs at startup (no pipeline re-execution on request). SHAP explainability is computed live on `/api/predict` calls if the `shap` package is installed.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/coverage` | GET | Mangrove coverage % per year |
| `/api/changes` | GET | Loss/gain pixel counts per period |
| `/api/risk-summary` | GET | Risk zone distribution |
| `/api/features` | GET | Feature statistics from features.csv |
| `/api/model-info` | GET | Model config, metrics, feature importances |
| `/api/predict` | POST | 9-feature input → risk level + probability + SHAP values |
| `/api/map-image/{type}` | GET | Serve any generated PNG (including overlay variants) |
| `/api/analytics/carbon` | GET | Carbon stock and sequestration per year |
| `/api/analytics/economic` | GET | Ecosystem services value per year |
| `/api/analytics/correlations` | GET | Rainfall, urban growth, population correlation data |
| `/api/risk-zone-query` | POST | Bounding box → risk report for custom drawn zone |
| `/api/download/features-csv` | GET | Download features.csv |
| `/api/download/summary-report` | GET | Download text report |
| `/api/download/map-png/{type}` | GET | Download any generated PNG |

**`/api/predict` request body (9 fields):**
```json
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

**`/api/predict` response includes:**
- `probability` — risk % (0–100)
- `risk_level` — "Low" / "Medium" / "High"
- `recommendation` — contextual conservation advice
- `shap_values` — per-feature SHAP contribution dict (if `shap` package installed, else proxy values)
- `expected_value` — model baseline probability
- `shap_available` — boolean indicating whether true SHAP was computed

**SHAP computation:** `shap.TreeExplainer(model).shap_values(X_scaled)` — uses `sv[1][0]` for the positive (at-risk) class. Falls back to a `feature_importances_ × scaled_input` proxy when `shap` is unavailable.

**CORS:** Configured to allow `localhost:3000`.

---

## 9. Frontend Web Application (`frontend/`)

Built with **Next.js 14 App Router**, **TypeScript**, and **Tailwind CSS**.

**Design System:**
- Background: `#F8FAFC` (off-white)
- Cards: `#FFFFFF` with `#E2E8F0` border
- Accent (forest green): `#16A34A`
- Teal: `#0D9488`
- Danger: `#DC2626`
- Warning: `#D97706`
- Muted text: `#64748B`

**Pages:**

| Route | Description |
|-------|-------------|
| `/` | Dashboard — hero, 4 KPI stat cards, coverage trend chart, quick navigation |
| `/map` | Interactive Leaflet map with transparent overlays, time-lapse, basemap toggle, draw-zone tool |
| `/changes` | Period-by-period change detection charts and maps |
| `/risk` | Risk heatmap, zone distribution donut chart, risk factor cards |
| `/predict` | 9-slider prediction form with live ML result + SHAP explainability waterfall chart |
| `/model` | Model info, metrics cards, feature importance bar chart |
| `/analytics` | 4-tab analytics: Carbon, Economic, Correlations, Downloads |

---

## 10. Interactive Map Features

| Feature | Implementation |
|---------|---------------|
| Year selector | Toggle between 2020/2021/2023/2025 mangrove overlays |
| Transparent overlays | RGBA PNG overlays: mangrove pixels coloured, all else fully transparent so basemap shows through |
| Time-lapse animation | Play/Pause + 0.5×/1×/2× speed — auto-cycles years via `setInterval` |
| Risk layer toggle | Switches overlay to risk probability heatmap (RdYlGn_r, alpha ∝ risk) |
| Basemap toggle | Street (OpenStreetMap), Clean (CartoDB), Satellite (ESRI World Imagery) |
| Draw Zone tool | Click-and-drag rectangle → POST to `/api/risk-zone-query` → instant risk report card |
| Click popup | Click any point to see lat/lng coordinates |

**Key Technical Notes:**
- react-leaflet v4 is used (not v5) — v5 introduced breaking changes ("render is not a function").
- The `InvalidateSize` component calls `map.invalidateSize()` after 100ms to force tile loading inside a Next.js dynamic import.
- Leaflet CSS is imported in `globals.css`, not inside client components.
- `ImageOverlay` uses `opacity={1.0}` since the RGBA images manage their own per-pixel alpha.
- A `key={basemap}` prop on `TileLayer` forces remount on basemap change to clear old tiles.

---

## 11. SHAP Explainability (`frontend/app/predict/page.tsx`)

After each prediction, a horizontal bar chart visualises the SHAP contribution of every feature:

- **Red bars** (positive SHAP): feature pushes risk upward from the baseline
- **Green bars** (negative SHAP): feature pushes risk downward
- Bars are sorted by absolute value (most influential at top)
- A reference line at x=0 marks the baseline
- A legend row below the chart shows exact values
- Tooltip shows the precise SHAP value on hover

The info callout explains: *"The sum of all SHAP bars + the baseline equals the final prediction."*

When the trained model (`risk_model.pkl`) is absent or `shap` is not installed, the system falls back to a proxy using feature importances × scaled input direction.

---

## 12. Ecosystem Services Valuation

Carbon and economic metrics are computed in real-time from pixel counts using literature-sourced values for the Konkan coast:

**Carbon metrics:**
| Constant | Value | Source |
|---------|-------|--------|
| Pixel area | 0.01 ha | 10m × 10m Sentinel-2 |
| Carbon stock | 900 tC/ha | IPCC tropical mangrove estimate |
| CO₂ conversion | 3.67 tCO₂/tC | Molecular weight ratio |
| Annual sequestration | 6.0 tCO₂/ha/yr | Literature average |
| Carbon price | ₹1,250/tCO₂ | Gold Standard voluntary market, 2024 |

**2025 carbon summary:**
- Total area: 144.78 ha
- Carbon stock: ~477,882 tCO₂
- Annual sequestration: 868.7 tCO₂/yr
- Carbon value: ₹10.86 lakh/yr

**Ecosystem service values (₹/ha/year):**

| Service | Rate | Annual Value (2025) |
|---------|------|-------------------|
| Fisheries | ₹1,50,000/ha | ₹2.17 Cr |
| Coastal Protection | ₹80,000/ha | ₹1.16 Cr |
| Carbon Market | ₹7,500/ha | ₹10.86 L |
| Biodiversity | ₹20,000/ha | ₹28.96 L |
| **Total** | **₹2,57,500/ha** | **~₹3.72 Cr/yr** |

---

## 13. Correlation Analysis

Data is synthetic but ecologically calibrated for the Konkan region:

| Correlation | Coefficient (r) | Interpretation |
|-------------|----------------|----------------|
| Rainfall vs. Mangrove Gain | 0.94 | Monsoon recovery drives regrowth |
| Urban Growth Rate vs. Loss Rate | 0.97 | Strongest driver of loss |
| Population Density vs. 5-yr Loss % | 0.96 | High-density zones lose more |
| NDVI Mean vs. Coverage | 0.82 | Health index tracks extent |

---

## 14. Live Prediction System

Users can enter 9 parameters via sliders and get an instant ML risk assessment with SHAP explainability:

| Input Parameter | Range | Unit | Ecological Basis |
|----------------|-------|------|-----------------|
| NDVI Trend | −0.5 to +0.5 | Index/yr | Declining canopy health signal |
| Distance to Urban | 0 to 200 | Pixels | Encroachment proximity |
| Distance to Coast | 0 to 200 | Pixels | Tidal stress exposure |
| Previous Loss Count | 0 to 5 | Occurrences | Recurrence risk |
| Water Proximity (NDWI) | −1.0 to +1.0 | Index | Salinity / flooding risk |
| Current Mangrove Status | 0 or 1 | Binary | Baseline condition |
| Aquaculture Distance | 0 to 100 | Pixels | Shrimp/fish pond pressure |
| Elevation Risk | 0 to 1 | Proxy | Tidal inundation vulnerability |
| Fragmentation | 0 or 1 | Binary | Edge exposure (0=interior, 1=edge) |

**Output:** Risk probability (%), risk level badge (Low/Medium/High), contextual recommendation, and a SHAP waterfall chart explaining the contribution of each feature.

When `risk_model.pkl` is absent, a weighted heuristic computes a proxy score using all 9 features at calibrated weights.

---

## 15. How to Run

### Prerequisites
- Python 3.10+
- Node.js 18+

### Step 1 — Install ML pipeline dependencies
```bash
cd mangrove_loss_prediction
pip install numpy pandas scipy scikit-learn matplotlib seaborn pillow tqdm xgboost imbalanced-learn rasterio
```

### Step 2 — Install backend dependencies
```bash
cd ../backend
pip install fastapi "uvicorn[standard]" shap
```

### Step 3 — Install frontend dependencies
```bash
cd ../frontend
npm install --legacy-peer-deps
```

### Step 4 — Generate pipeline outputs (required for real maps and trained model)
```bash
cd ../mangrove_loss_prediction
# Windows: set PYTHONUTF8=1 to avoid Unicode errors in terminal
$env:PYTHONUTF8="1"   # PowerShell
python main.py
```
This runs all 4 stages, generates 18 PNG files (9 matplotlib + 9 transparent overlays), `features.csv`, `summary_report.txt`, and `models/risk_model.pkl`.

### Step 5 — Start both servers (Windows)
```bat
run.bat
```
Opens two terminal windows: backend on `http://localhost:8000`, frontend on `http://localhost:3000`.

### Step 6 — Open in browser
Navigate to `http://localhost:3000`

---

## 16. Key Results Summary

| Metric | Value |
|--------|-------|
| Study area | 400 km coastline, Vasai to Sindhudurg |
| Temporal coverage | 2020–2025 (4 years) |
| Total pixels analysed | 65,536 (256×256 grid) |
| Mangrove coverage (2025) | 22.1% (14,478 pixels, 144.78 ha) |
| 5-year net change | −55 pixels (−0.19%) |
| High-risk pixels | 120 (0.2% of total) |
| Model algorithm | XGBoost (300 trees, depth 6, lr=0.05) |
| Class balancing | SMOTE |
| Validation | Spatial Block CV (4×4 grid) |
| Model accuracy | 96% |
| ROC-AUC score | 0.931 |
| F1-Score | 0.955 |
| Features | 9 (NDVI trend, urban, coast, loss history, NDWI, current status, aquaculture, elevation, fragmentation) |
| Annual ecosystem value | ~₹3.72 Crore |
| Carbon stock (2025) | ~4.77 lakh tCO₂ |
| Annual sequestration | ~869 tCO₂/yr |
| Top risk driver | NDVI Trend (26.2% importance) |
| Second risk driver | Aquaculture Proximity (19.8%) |
| Third risk driver | Distance to Urban (17.5%) |

---

## 17. Limitations and Future Work

**Current Limitations:**
- Mangrove maps use real GMW v3.0 as the base but year-specific change (2021, 2023, 2025) is applied synthetically via calibrated loss rates — not from live satellite downloads
- Urban and coastline masks are hand-crafted approximations; aquaculture zones are synthetic proxies
- Elevation proxy is computed geometrically (coastal gradient + creek depressions), not from real DEM data
- Correlation and economic data is literature-calibrated but not from live field observations

**Planned Extensions:**
1. Integrate live Sentinel-2 data via Google Earth Engine API or ESA Copernicus Hub
2. Replace synthetic urban masks with OSM building footprint data
3. Replace elevation proxy with SRTM 30m DEM or ICESat-2 coastal elevation data
4. Add real aquaculture polygon data from Karnataka/Maharashtra GIS portals
5. Implement monthly temporal composites for seasonality analysis
6. Add XGBoost hyperparameter tuning via Optuna
7. Deploy on cloud (AWS/GCP) with scheduled pipeline re-runs

---

## 18. References

- Barbier, E.B. et al. (2011). The value of estuarine and coastal ecosystem services. *Ecological Monographs*, 81(2), 169–193.
- CMFRI (2022). *Marine Fisheries Census — Maharashtra*. Central Marine Fisheries Research Institute.
- Gold Standard Foundation (2024). *Voluntary Carbon Market Pricing — Mangrove Blue Carbon*.
- IPCC (2013). *Wetlands Supplement to the 2006 IPCC Guidelines for National GHG Inventories*.
- JAXA / Zenodo (2022). *Global Mangrove Watch v3.0 annual dataset*, record 6894273.
- Lundberg, S.M. & Lee, S.I. (2017). A unified approach to interpreting model predictions. *NeurIPS 30*.
- Chawla, N.V. et al. (2002). SMOT: Synthetic Minority Over-sampling Technique. *JAIR*, 16, 321–357.
- Roberts, D.R. et al. (2017). Cross-validation strategies for data with temporal, spatial, hierarchical, or phylogenetic structure. *Ecography*, 40(8), 913–929.
- Pham, T.D. et al. (2019). Mangrove ecosystem services: A systematic review and resilience assessment. *Forests*, 10(7), 578.
- Sentinel-2 MSI Level-2A Product Specification, ESA, 2021.
- TEEB India Initiative (2018). *Ecosystem services valuation for coastal and marine ecosystems of India*.
