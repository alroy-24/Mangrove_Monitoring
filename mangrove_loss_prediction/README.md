# Mangrove Loss Prediction System

Mini-project for spatiotemporal change detection and risk prediction of mangrove loss in Mumbai/Thane Creek (2020-2025).

## Project Structure

```
mangrove_loss_prediction/
├── config.py                    # Configuration settings
├── main.py                      # Main pipeline runner
├── requirements.txt             # Python dependencies
├── data/                        # Satellite data (Sentinel-2)
├── outputs/                     # Generated maps and reports
├── models/                      # Trained ML models
├── utils/
│   ├── __init__.py
│   └── data_handler.py         # Data loading & utilities
└── src/
    ├── stage1_change_detection/
    │   ├── __init__.py
    │   └── detector.py         # NDVI computation, mangrove classification
    ├── stage2_feature_engineering/
    │   ├── __init__.py
    │   └── feature_extractor.py # Risk factor extraction
    ├── stage3_risk_model/
    │   ├── __init__.py
    │   └── predictor.py        # ML model training & prediction
    └── stage4_outputs/
        ├── __init__.py
        └── visualizer.py       # Maps & visualizations
```

## Architecture

**Pipeline Flow:**
```
Satellite Data → Preprocessing → Change Detection → Feature Extraction → ML Model → Risk Map
```

### 4 Stages

#### Stage 1: Spatiotemporal Change Detection
- Input: Sentinel-2 (2020, 2021, 2023, 2025)
- Compute NDVI per year
- Classify mangrove (RF / NDVI threshold)
- Detect loss, gain areas
- Output: Year-wise classification maps

#### Stage 2: Feature Engineering
- Distance to urban areas (OSM)
- Distance to coastline
- NDVI trend (slope over time)
- Previous loss occurrence
- Salinity/water proximity (NDWI)
- Output: Pixel-level feature vectors

#### Stage 3: Risk Prediction
- Model: Random Forest / Logistic Regression
- Input: Features from Stage 2
- Output: Loss probability per pixel
- Classification: Low/Medium/High risk zones

#### Stage 4: Final Outputs
- Historical loss maps
- Current mangrove health maps
- Future risk heatmap
- Risk zone classification
- Timeline visualization
- Summary report

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run Pipeline
```bash
python main.py
```

### 3. View Outputs
Generated files in `./outputs/`:
- `mangrove_map_*.png` - Mangrove classification for each year
- `change_map_*.png` - Loss/gain maps
- `risk_heatmap.png` - Future risk probability
- `risk_zones.png` - Risk zone classification
- `change_timeline.png` - Temporal trend
- `summary_report.txt` - Text report

## Key Technologies

- **Geospatial**: Rasterio, GeoPandas, Shapely
- **ML/Data**: Scikit-learn, NumPy, Pandas
- **Visualization**: Matplotlib, Seaborn
- **Satellite Data**: Sentinel-2 (via Earth Engine or local storage)

## Configuration

Edit `config.py` to adjust:
- Study area bounds
- Years of analysis
- NDVI thresholds
- Risk classification thresholds
- Model hyperparameters

## Status: 40% Implementation

Completed:
- ✅ Project structure
- ✅ Stage 1: Change detection pipeline
- ✅ Stage 2: Feature engineering module
- ✅ Stage 3: Risk prediction model
- ✅ Stage 4: Output visualization
- ✅ Configuration & utilities

Ready for:
- Real Sentinel-2 data integration (GEE API)
- Model validation on historical data
- Hyperparameter tuning
- Production deployment

## Future Enhancements

- [ ] Integration with Google Earth Engine
- [ ] Deep learning (U-Net) for classification
- [ ] Time series analysis (LSTM)
- [ ] Web dashboard with Folium/Streamlit
- [ ] Automated data pipeline
- [ ] Uncertainty quantification

---

**Author**: Mini Project  
**Created**: 2026  
**License**: MIT
