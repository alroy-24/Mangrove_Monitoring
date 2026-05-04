"""
Streamlit Web App for Mangrove Loss Prediction
Interactive dashboard for visualization and analysis
"""

import streamlit as st
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from PIL import Image
from pathlib import Path
import config

# Page configuration
st.set_page_config(
    page_title="Mangrove Loss Prediction",
    page_icon="🌿",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Sidebar navigation
st.sidebar.title("Navigation")
page = st.sidebar.radio(
    "Go to:",
    ["Home", "Mangrove Maps", "Change Detection", "Risk Analysis", "Feature Data", "Model Info", "Predict Risk"]
)

# ============================================
# HOME PAGE
# ============================================
if page == "Home":
    st.title("🌿 MANGROVE LOSS PREDICTION SYSTEM")
    st.markdown("### Mumbai / Thane Creek (2020-2025)")
    
    st.divider()
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.info("""
        **📊 Stage 1: Change Detection**
        
        Identifies mangrove loss & gain areas across 4 years
        """)
    
    with col2:
        st.info("""
        **🔍 Stage 2: Feature Engineering**
        
        Extracts 6 risk factors: urban proximity, coastline distance, NDVI trend, etc.
        """)
    
    with col3:
        st.info("""
        **🎯 Stage 3: Risk Prediction**
        
        ML model predicts future mangrove loss probability
        """)
    
    st.divider()
    
    st.subheader("📈 Quick Stats")
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Study Period", "2020-2025")
    with col2:
        st.metric("Satellite", "Sentinel-2")
    with col3:
        st.metric("Region", "Mumbai/Thane")
    with col4:
        st.metric("Area", "256×256 px")
    
    st.divider()
    
    st.subheader("🚀 How It Works")
    st.write("""
    **3-Stage Pipeline:**
    
    1. **Stage 1** → Analyze satellite images year-by-year using NDVI index
    2. **Stage 2** → Extract risk factors (urban distance, water proximity, historical losses)
    3. **Stage 3** → Train Random Forest to predict future loss probability
    
    **View the results:**
    - 📍 **Mangrove Maps** — Year-wise coverage visualization
    - 📉 **Change Detection** — Loss & gain areas highlighted
    - 🔥 **Risk Analysis** — Future threat prediction & zones
    - 🎯 **Predict Risk** — Interactive predictions for custom scenarios
    - 📊 **Feature Data** — Download extracted features
    - ℹ️ **Model Info** — Performance metrics & feature importance
    """)

# ============================================
# MANGROVE MAPS PAGE
# ============================================
elif page == "Mangrove Maps":
    st.title("🌿 Mangrove Coverage Maps")
    
    years = [2020, 2021, 2023, 2025]
    
    # Create year selection
    selected_year = st.selectbox("Select Year:", years)
    
    # Load and display image
    img_path = f"outputs/mangrove_map_{selected_year}.png"
    if Path(img_path).exists():
        img = Image.open(img_path)
        st.image(img, width=800, caption=f"Mangrove Coverage - {selected_year}")
        
        # Year statistics
        st.subheader("Year Statistics")
        col1, col2 = st.columns(2)
        
        with col1:
            if selected_year == 2020:
                st.metric("Coverage", "22.3%", "14,628 pixels")
            elif selected_year == 2021:
                st.metric("Coverage", "22.2%", "14,517 pixels")
            elif selected_year == 2023:
                st.metric("Coverage", "22.2%", "14,570 pixels")
            else:
                st.metric("Coverage", "22.1%", "14,498 pixels")
        
        with col2:
            st.info("Green areas = Mangrove | White areas = Non-mangrove")
    else:
        st.warning(f"Image not found: {img_path}")
    
    st.divider()
    
    # Show all years side-by-side
    st.subheader("All Years Comparison")
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        if Path("outputs/mangrove_map_2020.png").exists():
            st.image(Image.open("outputs/mangrove_map_2020.png"), caption="2020")
    with col2:
        if Path("outputs/mangrove_map_2021.png").exists():
            st.image(Image.open("outputs/mangrove_map_2021.png"), caption="2021")
    with col3:
        if Path("outputs/mangrove_map_2023.png").exists():
            st.image(Image.open("outputs/mangrove_map_2023.png"), caption="2023")
    with col4:
        if Path("outputs/mangrove_map_2025.png").exists():
            st.image(Image.open("outputs/mangrove_map_2025.png"), caption="2025")

# ============================================
# CHANGE DETECTION PAGE
# ============================================
elif page == "Change Detection":
    st.title("📉 Change Detection: Loss & Gain")
    
    periods = ["2020→2021", "2021→2023", "2023→2025"]
    selected_period = st.selectbox("Select Period:", periods)
    
    # Map period to file
    period_map = {
        "2020→2021": ("outputs/change_map_2020_2021.png", 2020, 2021),
        "2021→2023": ("outputs/change_map_2021_2023.png", 2021, 2023),
        "2023→2025": ("outputs/change_map_2023_2025.png", 2023, 2025)
    }
    
    img_path, year1, year2 = period_map[selected_period]
    
    if Path(img_path).exists():
        img = Image.open(img_path)
        st.image(img, width=800, caption=f"Loss (Red) & Gain (Green): {year1}→{year2}")
        
        # Statistics
        st.subheader("Period Metrics")
        col1, col2, col3 = st.columns(3)
        
        with col1:
            if selected_period == "2020→2021":
                st.metric("Loss", "11,332 px", "-69%")
            elif selected_period == "2021→2023":
                st.metric("Loss", "11,333 px", "+75%")
            else:
                st.metric("Loss", "11,359 px", "+51%")
        
        with col2:
            if selected_period == "2020→2021":
                st.metric("Gain", "11,221 px", "+68%")
            elif selected_period == "2021→2023":
                st.metric("Gain", "11,386 px", "+76%")
            else:
                st.metric("Gain", "11,287 px", "+50%")
        
        with col3:
            if selected_period == "2020→2021":
                st.metric("Net Change", "-111 px", "Slight Loss")
            elif selected_period == "2021→2023":
                st.metric("Net Change", "+53 px", "Slight Gain")
            else:
                st.metric("Net Change", "-72 px", "Slight Loss")
    
    st.divider()
    
    # Timeline
    st.subheader("Change Timeline")
    if Path("outputs/change_timeline.png").exists():
        st.image(Image.open("outputs/change_timeline.png"), width=900)

# ============================================
# RISK ANALYSIS PAGE
# ============================================
elif page == "Risk Analysis":
    st.title("🔥 Future Risk Prediction")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Risk Heatmap")
        if Path("outputs/risk_heatmap.png").exists():
            st.image(Image.open("outputs/risk_heatmap.png"))
            st.caption("Probability of mangrove loss (Red=High, Green=Low)")
    
    with col2:
        st.subheader("Risk Zones")
        if Path("outputs/risk_zones.png").exists():
            st.image(Image.open("outputs/risk_zones.png"))
            st.caption("RED=High | YELLOW=Medium | GREEN=Low Risk")
    
    st.divider()
    
    st.subheader("Risk Zone Distribution")
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.success("🟢 **Low Risk**\n\n63,364 pixels (96.8%)")
    
    with col2:
        st.warning("🟡 **Medium Risk**\n\n2,052 pixels (3.1%)")
    
    with col3:
        st.error("🔴 **High Risk**\n\n120 pixels (0.2%)")

# ============================================
# FEATURE DATA PAGE
# ============================================
elif page == "Feature Data":
    st.title("📊 Feature Engineering Data")
    
    # Load features CSV
    if Path("outputs/features.csv").exists():
        features_df = pd.read_csv("outputs/features.csv")
        
        st.subheader("Extracted Features (65,536 pixels)")
        st.write(f"Shape: {features_df.shape[0]} pixels × {features_df.shape[1]} features")
        
        # Display statistics
        st.subheader("Feature Statistics")
        st.dataframe(features_df.describe().round(4))
        
        st.divider()
        
        # Feature correlations
        st.subheader("Feature Heatmap")
        fig, ax = plt.subplots(figsize=(10, 8))
        corr_matrix = features_df.corr()
        im = ax.imshow(corr_matrix, cmap='coolwarm', aspect='auto', vmin=-1, vmax=1)
        
        ax.set_xticks(range(len(corr_matrix.columns)))
        ax.set_yticks(range(len(corr_matrix.columns)))
        ax.set_xticklabels(corr_matrix.columns, rotation=45, ha='right')
        ax.set_yticklabels(corr_matrix.columns)
        
        plt.colorbar(im, ax=ax, label='Correlation')
        plt.tight_layout()
        st.pyplot(fig)
        
        st.divider()
        
        # Download button
        csv = features_df.to_csv(index=False)
        st.download_button(
            label="📥 Download Features CSV",
            data=csv,
            file_name="mangrove_features.csv",
            mime="text/csv"
        )
    else:
        st.warning("Features file not found")

# ============================================
# MODEL INFO PAGE
# ============================================
elif page == "Model Info":
    st.title("ℹ️ Model Information & Performance")
    
    st.subheader("Model Configuration")
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Model Type", "Random Forest")
    with col2:
        st.metric("Estimators", "100")
    with col3:
        st.metric("Max Depth", "20")
    with col4:
        st.metric("Training Samples", "52,428")
    
    st.divider()
    
    st.subheader("Performance Metrics")
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Accuracy", "95%", "on test set")
    with col2:
        st.metric("ROC-AUC", "0.906", "excellent")
    with col3:
        st.metric("Precision", "95%", "class 0")
    
    st.divider()
    
    st.subheader("Feature Importance")
    
    importance_data = {
        'Feature': [
            'NDVI Trend',
            'Distance to Urban',
            'Current Mangrove',
            'Distance to Coast',
            'Previous Loss Count',
            'Water Proximity'
        ],
        'Importance': [0.3135, 0.2500, 0.2354, 0.1946, 0.0065, 0.0000]
    }
    importance_df = pd.DataFrame(importance_data)
    
    fig, ax = plt.subplots(figsize=(10, 6))
    bars = ax.barh(importance_df['Feature'], importance_df['Importance'], color='#1f4d2d')
    ax.set_xlabel('Importance Score', fontsize=11)
    ax.set_title('Feature Importance in Risk Prediction', fontsize=12, fontweight='bold')
    ax.set_xlim(0, 0.35)
    
    # Add value labels
    for i, (bar, val) in enumerate(zip(bars, importance_df['Importance'])):
        ax.text(val + 0.01, i, f'{val:.1%}', va='center')
    
    plt.tight_layout()
    st.pyplot(fig)
    
    st.divider()
    
    st.subheader("Model Interpretation")
    st.write("""
    **Key Findings:**
    
    1. **NDVI Trend (31.4%)** — Most important! Declining vegetation is the strongest predictor of future loss
    2. **Distance to Urban (25%)** — Urbanization pressure is critical
    3. **Current Mangrove Status (23.5%)** — Being a mangrove now matters
    4. **Distance to Coast (19.5%)** — Coastal proximity affects loss risk
    5. **Previous Loss (0.65%)** — Historical loss has minimal impact
    6. **Water Proximity (0%)** — No predictive value in this model
    """)
    
    st.divider()
    
    st.subheader("Summary Report")
    if Path("outputs/summary_report.txt").exists():
        with open("outputs/summary_report.txt", "r", encoding="utf-8") as f:
            report_text = f.read()
        st.text(report_text)

# ============================================
# PREDICT RISK PAGE (Interactive)
# ============================================
elif page == "Predict Risk":
    st.title("🎯 Interactive Risk Prediction")
    
    st.write("""
    **Enter feature values below to predict the risk of mangrove loss at a specific location.**
    
    The model will analyze these factors and give you a loss probability score.
    """)
    
    st.divider()
    
    # Create two columns for inputs
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("📍 Location Features")
        
        ndvi_trend = st.slider(
            "NDVI Trend (vegetation decline)",
            min_value=-0.5, max_value=0.5, value=0.0, step=0.01,
            help="Negative = declining vegetation | Positive = improving"
        )
        
        dist_urban = st.slider(
            "Distance to Urban Areas (pixels)",
            min_value=0, max_value=200, value=60, step=5,
            help="Lower distance = closer to city = more pressure"
        )
        
        dist_coast = st.slider(
            "Distance to Coastline (pixels)",
            min_value=0, max_value=200, value=80, step=5,
            help="Lower distance = more water stress"
        )
    
    with col2:
        st.subheader("🕐 Historical Data")
        
        prev_loss = st.slider(
            "Previous Loss Count (years)",
            min_value=0, max_value=5, value=0, step=1,
            help="How many times was mangrove lost here before?"
        )
        
        water_proximity = st.slider(
            "Water Proximity (NDWI)",
            min_value=-1.0, max_value=1.0, value=0.0, step=0.1,
            help="Higher = closer to water/higher salinity"
        )
        
        is_mangrove = st.radio(
            "Current Status",
            options=[0, 1],
            format_func=lambda x: "Non-Mangrove" if x == 0 else "Mangrove",
            help="Is this pixel currently a mangrove?"
        )
    
    st.divider()
    
    # Prediction button
    if st.button("🔮 Predict Risk"):
        # Try to load the model
        try:
            import pickle
            from src.stage3_risk_model.predictor import RiskPredictor
            
            model_path = "models/risk_model.pkl"
            if Path(model_path).exists():
                with open(model_path, 'rb') as f:
                    model_data = pickle.load(f)
                
                predictor = RiskPredictor(model_type=model_data['model_type'])
                predictor.model = model_data['model']
                predictor.scaler = model_data['scaler']
                
                # Create input array
                input_features = np.array([[
                    ndvi_trend,
                    dist_urban,
                    dist_coast,
                    float(prev_loss),
                    water_proximity,
                    float(is_mangrove)
                ]])
                
                # Scale and predict
                input_scaled = predictor.scaler.transform(input_features)
                risk_probability = predictor.model.predict_proba(input_scaled)[0, 1]
                
                # Determine risk level
                if risk_probability <= 0.33:
                    risk_level = "🟢 LOW RISK"
                    color = "#28a745"
                elif risk_probability <= 0.67:
                    risk_level = "🟡 MEDIUM RISK"
                    color = "#ffc107"
                else:
                    risk_level = "🔴 HIGH RISK"
                    color = "#dc3545"
                
                # Display results
                st.divider()
                st.subheader("Prediction Results")
                
                col1, col2 = st.columns([2, 1])
                
                with col1:
                    if risk_probability > 0.67:
                        st.error(f"**{risk_level}**\n\n{risk_probability:.1%} Loss Probability")
                    elif risk_probability > 0.33:
                        st.warning(f"**{risk_level}**\n\n{risk_probability:.1%} Loss Probability")
                    else:
                        st.success(f"**{risk_level}**\n\n{risk_probability:.1%} Loss Probability")
                
                with col2:
                    st.metric("Risk Score", f"{risk_probability:.3f}", "out of 1.0")
                
                st.divider()
                
                # Detailed explanation
                st.subheader("📊 Prediction Breakdown")
                
                explanation_col1, explanation_col2 = st.columns(2)
                
                with explanation_col1:
                    st.write("**Your Input Values:**")
                    input_df = pd.DataFrame({
                        'Feature': ['NDVI Trend', 'Dist to Urban', 'Dist to Coast', 'Prev Loss', 'Water Proximity', 'Current Mangrove'],
                        'Value': [
                            f"{ndvi_trend:.2f}",
                            f"{dist_urban:.0f} px",
                            f"{dist_coast:.0f} px",
                            f"{prev_loss}",
                            f"{water_proximity:.2f}",
                            "Yes" if is_mangrove else "No"
                        ]
                    })
                    st.dataframe(input_df, hide_index=True)
                
                with explanation_col2:
                    st.write("**Risk Factors Analysis:**")
                    
                    factors = []
                    
                    if ndvi_trend < -0.1:
                        factors.append("⚠️ **Declining vegetation** (main risk)")
                    elif ndvi_trend > 0.1:
                        factors.append("✅ Improving vegetation")
                    else:
                        factors.append("➡️ Stable vegetation")
                    
                    if dist_urban < 50:
                        factors.append("⚠️ **Very close to city** (urbanization pressure)")
                    elif dist_urban < 100:
                        factors.append("⚠️ Moderate urban proximity")
                    else:
                        factors.append("✅ Far from urban areas")
                    
                    if dist_coast < 50:
                        factors.append("⚠️ **Very close to coast** (water stress)")
                    elif dist_coast < 100:
                        factors.append("➡️ Moderate coastal distance")
                    else:
                        factors.append("✅ Far from coastline")
                    
                    if prev_loss > 0:
                        factors.append(f"⚠️ Previous losses recorded ({prev_loss}x)")
                    else:
                        factors.append("✅ No previous losses")
                    
                    if is_mangrove == 1:
                        factors.append("ℹ️ Currently a mangrove")
                    else:
                        factors.append("ℹ️ Currently not a mangrove")
                    
                    for factor in factors:
                        st.write(f"• {factor}")
                
                st.divider()
                
                # Recommendations
                st.subheader("💡 Recommendations")
                
                if risk_probability > 0.67:
                    st.error("""
                    **HIGH RISK - Immediate Action Needed:**
                    - 🚨 Urgent conservation required
                    - Monitor this area closely
                    - Consider protection/restoration measures
                    - Investigate causes of decline
                    """)
                elif risk_probability > 0.33:
                    st.warning("""
                    **MEDIUM RISK - Preventive Monitoring:**
                    - ⚠️ Watch for deterioration
                    - Implement preventive measures
                    - Track NDVI trends regularly
                    - Address contributing factors
                    """)
                else:
                    st.success("""
                    **LOW RISK - Maintain Current Status:**
                    - ✅ Area appears stable
                    - Continue routine monitoring
                    - Preserve current conditions
                    - Document healthy trends
                    """)
            
            else:
                st.error("Model file not found. Run main.py first to train the model.")
        
        except Exception as e:
            st.error(f"Prediction error: {str(e)}")
    
    st.divider()
    
    st.subheader("📚 Feature Guide")
    
    with st.expander("What do these features mean?"):
        st.write("""
        **1. NDVI Trend** (Normalized Difference Vegetation Index)
        - Measures vegetation health change over time
        - Negative = vegetation declining (bad)
        - Positive = vegetation improving (good)
        - Range: -0.5 to 0.5
        
        **2. Distance to Urban Areas**
        - How far from cities/human development
        - Closer = more urbanization pressure = higher risk
        - Measured in pixels (each pixel ≈ 100m in real data)
        
        **3. Distance to Coastline**
        - How far from the coast
        - Closer = more water stress, salinity
        - Mangroves need specific salinity levels
        
        **4. Previous Loss Count**
        - How many times this area experienced loss before
        - Shows pattern of vulnerability
        
        **5. Water Proximity (NDWI)**
        - Normalized Difference Water Index
        - How close to water or waterlogged
        - Can indicate flooding risk
        
        **6. Current Mangrove Status**
        - Whether this pixel is currently a mangrove
        - Mangroves are at risk; non-mangroves are stable
        """)

# ============================================
# FOOTER
# ============================================
st.divider()
st.markdown("""---
**Mangrove Loss Prediction System** | Mumbai/Thane Creek | 2020-2025""")
