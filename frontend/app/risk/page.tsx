"use client";

import { AlertTriangle } from "lucide-react";
import RiskDonut from "@/components/risk-donut";
import { api } from "@/lib/api";

export default function RiskPage() {
  const heatmapUrl = api.mapImageUrl("risk_heatmap");
  const zonesUrl   = api.mapImageUrl("risk_zones");

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-warning text-sm font-medium mb-1">
          <AlertTriangle className="w-4 h-4" /> Risk Analysis
        </div>
        <h1 className="text-2xl font-bold text-foreground">Mangrove Risk Assessment</h1>
        <p className="text-muted text-sm mt-1">
          XGBoost model (SMOTE + spatial block CV) predicts per-pixel loss probability across 65,536 pixels of the Vasai–Konkan coastline.
        </p>
      </div>

      {/* Zone summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Low Risk", pct: "96.8%", count: "63,364 px", badge: "badge-low" },
          { label: "Medium Risk", pct: "3.1%", count: "2,052 px",  badge: "badge-medium" },
          { label: "High Risk",   pct: "0.2%", count: "120 px",    badge: "badge-high" },
        ].map(({ label, pct, count, badge }) => (
          <div key={label} className="card text-center">
            <span className={`${badge} mb-3 inline-block`}>{label}</span>
            <p className="text-3xl font-bold text-foreground">{pct}</p>
            <p className="text-sm text-muted mt-1">{count}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Donut chart */}
        <div className="card">
          <h2 className="section-title mb-2">Risk Zone Distribution</h2>
          <RiskDonut />
        </div>

        {/* Risk heatmap */}
        <div className="card flex flex-col">
          <h2 className="section-title mb-4">Risk Probability Heatmap</h2>
          <div className="flex-1 bg-gray-50 rounded-lg flex items-center justify-center min-h-[240px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heatmapUrl}
              alt="Risk heatmap"
              className="max-w-full max-h-64 object-contain rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                const p = (e.target as HTMLImageElement).parentElement;
                if (p) p.innerHTML = '<p class="text-muted text-sm">Run the pipeline to generate maps</p>';
              }}
            />
          </div>
          <div className="mt-3 flex gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Low (0–33%)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-yellow-400 inline-block" /> Medium (33–67%)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> High (67–100%)</span>
          </div>
        </div>
      </div>

      {/* Risk zones image */}
      <div className="card">
        <h2 className="section-title mb-4">Classified Risk Zones</h2>
        <div className="bg-gray-50 rounded-lg flex items-center justify-center min-h-[200px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zonesUrl}
            alt="Risk zones"
            className="max-w-full max-h-72 object-contain rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              const p = (e.target as HTMLImageElement).parentElement;
              if (p) p.innerHTML = '<p class="text-muted text-sm">Run the pipeline to generate maps</p>';
            }}
          />
        </div>
      </div>

      {/* Risk factors */}
      <div className="card">
        <h2 className="section-title mb-4">Key Risk Drivers</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: "NDVI Trend Decline", desc: "Decreasing vegetation health index is the strongest single predictor of future loss (31.4% importance).", badge: "badge-high" },
            { title: "Urban Proximity", desc: "Areas within 25 px of urban patches face 2× higher risk from encroachment and pollution runoff.", badge: "badge-medium" },
            { title: "Coastal Stress", desc: "Salinity intrusion and storm surge along Konkan inlets elevate vulnerability for coastal fringe mangroves.", badge: "badge-medium" },
            { title: "Historical Loss", desc: "Pixels with prior loss events are predisposed to further degradation through edge-effect exposure.", badge: "badge-low" },
            { title: "Water Proximity", desc: "High NDWI indicates tidal zones; moderate proximity correlates with healthy mangrove establishment.", badge: "badge-low" },
            { title: "Current Density", desc: "Areas currently classified as mangrove show lower transitional risk when canopy cover is dense.", badge: "badge-low" },
          ].map(({ title, desc, badge }) => (
            <div key={title} className="flex flex-col gap-2 p-4 bg-gray-50 rounded-xl border border-border">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm text-foreground">{title}</p>
                <span className={badge}>{badge.replace("badge-", "").charAt(0).toUpperCase() + badge.replace("badge-", "").slice(1)}</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
