"use client";

import { Info, CheckCircle } from "lucide-react";
import FeatureImportanceChart from "@/components/feature-importance-chart";

const METRICS = [
  { label: "Accuracy",  value: "96.0%", color: "text-accent" },
  { label: "ROC-AUC",   value: "0.931", color: "text-teal" },
  { label: "Precision", value: "96.0%", color: "text-accent" },
  { label: "Recall",    value: "95.0%", color: "text-teal" },
  { label: "F1 Score",  value: "0.955", color: "text-accent" },
];

const CONFIG = [
  { param: "Algorithm",         value: "XGBoost Classifier" },
  { param: "Estimators",        value: "300 trees" },
  { param: "Max Depth",         value: "6" },
  { param: "Learning Rate",     value: "0.05" },
  { param: "Class Balancing",   value: "SMOTE" },
  { param: "Cross-Validation",  value: "Spatial Block CV (4×4)" },
  { param: "Train/Test Split",  value: "80% / 20%" },
  { param: "Feature Scaling",   value: "StandardScaler" },
  { param: "Training Samples",  value: "~52,428 pixels" },
  { param: "Features",          value: "9 per pixel" },
];

export default function ModelPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-muted text-sm font-medium mb-1">
          <Info className="w-4 h-4" /> Model Information
        </div>
        <h1 className="text-2xl font-bold text-foreground">ML Model Details</h1>
        <p className="text-muted text-sm mt-1">
          XGBoost classifier trained on GMW v3.0 mangrove data with SMOTE class balancing and spatial block cross-validation for the Vasai–Konkan study area.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {METRICS.map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className="label mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Configuration table */}
        <div className="card">
          <h2 className="section-title mb-4">Model Configuration</h2>
          <table className="w-full text-sm">
            <tbody>
              {CONFIG.map(({ param, value }) => (
                <tr key={param} className="border-b border-border last:border-0">
                  <td className="py-2.5 text-muted">{param}</td>
                  <td className="py-2.5 font-medium text-foreground text-right">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Feature importance */}
        <div className="card">
          <h2 className="section-title mb-4">Feature Importances</h2>
          <FeatureImportanceChart />
        </div>
      </div>

      {/* Interpretation */}
      <div className="card">
        <h2 className="section-title mb-4">Model Interpretation</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: "NDVI Trend (26.2%)", desc: "The rate of vegetation health change is the strongest predictor. Declining NDVI over consecutive years strongly signals upcoming canopy loss." },
            { title: "Aquaculture Distance (19.8%)", desc: "Proximity to shrimp and fish pond zones reflects direct habitat conversion pressure — the second-largest driver of mangrove loss on the Konkan coast." },
            { title: "Distance to Urban (17.5%)", desc: "Proximity to urban areas reflects encroachment, pollution, and land-use conversion. Vasai-Virar's rapid growth makes this critical in the northern zone." },
            { title: "Elevation Risk (14.2%)", desc: "Low-lying tidal flats are more vulnerable to sea-level rise, storm surge, and tidal inundation — especially at creek mouths." },
            { title: "Fragmentation (7.1%)", desc: "Isolated edge pixels lose canopy cover ~3× faster than interior pixels due to greater exposure to salt spray, desiccation, and wave action." },
            { title: "Current Status (9.8%)", desc: "Whether a pixel is currently classified as mangrove provides baseline context; existing cover indicates some ecological resilience." },
          ].map(({ title, desc }) => (
            <div key={title} className="flex gap-3 p-4 bg-gray-50 rounded-xl border border-border">
              <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-foreground mb-1">{title}</p>
                <p className="text-xs text-muted leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="card bg-blue-50 border-blue-100">
        <h2 className="section-title mb-2 text-blue-800">Production Notes</h2>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside leading-relaxed">
          <li>Classification maps use <strong>GMW v3.0</strong> (Global Mangrove Watch, JAXA) as the real-data base; year-on-year changes for 2021–2025 are applied via calibrated loss rates.</li>
          <li>Urban, coastline, and aquaculture masks are synthetic proxies; replace with OSM building footprints, real coastline GeoJSON, and state GIS aquaculture data in production.</li>
          <li>Elevation proxy should be replaced with SRTM 30m DEM or ICESat-2 coastal elevation data for production deployments.</li>
          <li>Model should be retrained annually as new GMW layers become available.</li>
        </ul>
      </div>
    </div>
  );
}
