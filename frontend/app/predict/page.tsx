"use client";

import { useState } from "react";
import { Activity, ChevronRight, Info } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Cell,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";

type RiskLevel = "Low" | "Medium" | "High";

const BADGE: Record<RiskLevel, string> = {
  Low:    "badge-low",
  Medium: "badge-medium",
  High:   "badge-high",
};

const COLOR: Record<RiskLevel, string> = {
  Low:    "border-accent bg-accent-light text-accent",
  Medium: "border-warning bg-warning-light text-warning",
  High:   "border-danger bg-danger-light text-danger",
};

const FEATURE_LABELS: Record<string, string> = {
  ndvi_trend:              "NDVI Trend",
  distance_to_urban:       "Dist. to Urban",
  distance_to_coast:       "Dist. to Coast",
  previous_loss_count:     "Prev. Loss Count",
  water_proximity:         "Water Proximity",
  current_mangrove:        "Current Mangrove",
  aquaculture_proximity:   "Aquaculture Dist.",
  elevation_proxy:         "Elevation Risk",
  mangrove_fragmentation:  "Fragmentation",
};

interface PredictResult {
  probability: number;
  risk_level: RiskLevel;
  recommendation: string;
  shap_values: Record<string, number>;
  expected_value: number;
  shap_available: boolean;
}

interface Slider {
  key: keyof FormState;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  description: string;
}

interface FormState {
  ndvi_trend: number;
  distance_to_urban: number;
  distance_to_coast: number;
  previous_loss_count: number;
  water_proximity: number;
  current_mangrove: number;
  aquaculture_proximity: number;
  elevation_proxy: number;
  mangrove_fragmentation: number;
}

const SLIDERS: Slider[] = [
  { key: "ndvi_trend",             label: "NDVI Trend",              min: -0.5, max: 0.5,  step: 0.01, unit: "",     description: "Change in vegetation health index over time (negative = declining canopy health)." },
  { key: "distance_to_urban",      label: "Distance to Urban",       min: 0,    max: 200,  step: 1,    unit: " px",  description: "Pixel distance to nearest urban area. Lower = more encroachment pressure." },
  { key: "distance_to_coast",      label: "Distance to Coast",       min: 0,    max: 200,  step: 1,    unit: " px",  description: "Distance to coastline. Very low values may indicate tidal stress." },
  { key: "previous_loss_count",    label: "Previous Loss Count",     min: 0,    max: 5,    step: 1,    unit: "",     description: "Number of times this pixel experienced mangrove loss historically." },
  { key: "water_proximity",        label: "Water Proximity (NDWI)",  min: -1,   max: 1,    step: 0.01, unit: "",     description: "Normalised Difference Water Index. Higher = closer to water / salinity exposure." },
  { key: "current_mangrove",       label: "Current Mangrove",        min: 0,    max: 1,    step: 1,    unit: "",     description: "Is this pixel currently classified as mangrove? (1 = yes, 0 = no)" },
  { key: "aquaculture_proximity",  label: "Aquaculture Distance",    min: 0,    max: 100,  step: 1,    unit: " px",  description: "Distance to nearest shrimp/fish pond zone. Lower = higher pollution & habitat conversion pressure." },
  { key: "elevation_proxy",        label: "Elevation Risk",          min: 0,    max: 1,    step: 0.01, unit: "",     description: "Low-elevation tidal risk proxy (0 = high ground / inland, 1 = low-lying estuarine flood zone)." },
  { key: "mangrove_fragmentation", label: "Fragmentation",           min: 0,    max: 1,    step: 1,    unit: "",     description: "Is this an edge / isolated patch pixel? (1 = exposed edge, 0 = interior canopy). Edge pixels lose cover faster." },
];

const DEFAULTS: FormState = {
  ndvi_trend: 0,
  distance_to_urban: 50,
  distance_to_coast: 30,
  previous_loss_count: 0,
  water_proximity: 0.2,
  current_mangrove: 1,
  aquaculture_proximity: 30,
  elevation_proxy: 0.4,
  mangrove_fragmentation: 0,
};

// ── SHAP chart ────────────────────────────────────────────────────────────────

function ShapTooltip({ active, payload }: { active?: boolean; payload?: { value: number }[] }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div className="bg-white border border-border rounded-lg px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-foreground">{v > 0 ? "+" : ""}{v.toFixed(4)}</p>
      <p className="text-muted">{v > 0 ? "Increases risk" : "Reduces risk"}</p>
    </div>
  );
}

function ShapChart({ shapValues, expectedValue, shapeAvailable }: {
  shapValues: Record<string, number>;
  expectedValue: number;
  shapeAvailable: boolean;
}) {
  const data = Object.entries(shapValues)
    .map(([key, value]) => ({ feature: FEATURE_LABELS[key] ?? key, value, key }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  const maxAbs = Math.max(...data.map((d) => Math.abs(d.value)), 0.001);
  const domain: [number, number] = [-maxAbs * 1.2, maxAbs * 1.2];

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-title">Why this prediction?</p>
          <p className="text-xs text-muted mt-0.5">
            {shapeAvailable
              ? `SHAP values — each bar shows how much a feature pushed the risk away from the baseline (${(expectedValue * 100).toFixed(1)}%).`
              : "Feature contributions — approximate SHAP-like values computed from model weights."}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs shrink-0 mt-0.5">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-danger inline-block" />
            <span className="text-muted">Increases risk</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-accent inline-block" />
            <span className="text-muted">Reduces risk</span>
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={290}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 130 }}>
          <XAxis
            type="number"
            domain={domain}
            tickFormatter={(v) => Number(v).toFixed(3)}
            tick={{ fontSize: 11, fill: "#64748B" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="feature"
            width={125}
            tick={{ fontSize: 12, fill: "#1E293B" }}
            axisLine={false}
            tickLine={false}
          />
          <ReferenceLine x={0} stroke="#CBD5E1" strokeWidth={1.5} />
          <Tooltip content={<ShapTooltip />} cursor={{ fill: "#F1F5F9" }} />
          <Bar dataKey="value" radius={[3, 3, 3, 3]} maxBarSize={22}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.value > 0 ? "#DC2626" : "#16A34A"}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="border-t border-border pt-3 flex flex-wrap gap-x-6 gap-y-1.5">
        {data.map(({ key, feature, value }) => (
          <div key={key} className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: value > 0 ? "#DC2626" : "#16A34A" }}
            />
            <span className="text-muted">{feature}:</span>
            <span className={`font-semibold tabular-nums ${value > 0 ? "text-danger" : "text-accent"}`}>
              {value > 0 ? "+" : ""}{value.toFixed(4)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PredictPage() {
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [result, setResult] = useState<PredictResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FormState, val: number) =>
    setForm((f) => ({ ...f, [key]: val }));

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Backend returned " + res.status);
      setResult(await res.json());
    } catch {
      setError("Could not reach the API. Make sure the backend is running on port 8000.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-teal text-sm font-medium mb-1">
          <Activity className="w-4 h-4" /> Risk Prediction
        </div>
        <h1 className="text-2xl font-bold text-foreground">Predict Mangrove Loss Risk</h1>
        <p className="text-muted text-sm mt-1">
          Adjust the nine feature sliders to represent a specific site, then run the ML model (XGBoost + SMOTE) to get an instant risk assessment with SHAP explainability.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Sliders */}
        <div className="lg:col-span-3 card space-y-5">
          <h2 className="section-title">Site Parameters</h2>
          {SLIDERS.map(({ key, label, min, max, step, unit, description }) => (
            <div key={key}>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-foreground">{label}</label>
                <span className="text-sm font-semibold text-accent tabular-nums">
                  {form[key]}{unit}
                </span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={form[key]}
                onChange={(e) => set(key, parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-accent"
              />
              <p className="text-xs text-muted mt-1 leading-relaxed">{description}</p>
            </div>
          ))}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {loading ? "Predicting…" : <><ChevronRight className="w-4 h-4" /> Predict Risk</>}
          </button>
        </div>

        {/* Result cards */}
        <div className="lg:col-span-2 space-y-4">
          {error && (
            <div className="card border-danger bg-danger-light text-danger text-sm">{error}</div>
          )}

          {result ? (
            <>
              <div className={`card border-2 ${COLOR[result.risk_level]} text-center`}>
                <p className="label mb-2">Risk Level</p>
                <p className="text-5xl font-bold mb-1">{result.probability}%</p>
                <span className={`${BADGE[result.risk_level]} text-sm`}>{result.risk_level} Risk</span>
              </div>

              <div className="card">
                <p className="label mb-2">Recommendation</p>
                <p className="text-sm text-foreground leading-relaxed">{result.recommendation}</p>
              </div>

              <div className="card">
                <p className="label mb-3">Input Summary</p>
                <div className="space-y-2">
                  {SLIDERS.map(({ key, label, unit }) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted">{label}</span>
                      <span className="font-medium text-foreground tabular-nums">{form[key]}{unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="card border-2 border-dashed border-border text-center py-12">
              <Activity className="w-10 h-10 text-muted mx-auto mb-3" />
              <p className="text-muted text-sm">Adjust the parameters and click <strong>Predict Risk</strong> to see results.</p>
            </div>
          )}
        </div>
      </div>

      {/* SHAP explainability — full width, only shown after prediction */}
      {result?.shap_values && (
        <ShapChart
          shapValues={result.shap_values}
          expectedValue={result.expected_value}
          shapeAvailable={result.shap_available}
        />
      )}

      {/* SHAP explainer callout */}
      {result && (
        <div className="card bg-slate-50 border-slate-200 flex gap-3">
          <Info className="w-4 h-4 text-muted shrink-0 mt-0.5" />
          <p className="text-xs text-muted leading-relaxed">
            <strong className="text-foreground">How to read SHAP values:</strong> Each bar shows how much that feature
            pushed the model&apos;s output away from the average prediction ({(result.expected_value * 100).toFixed(1)}%).
            Red bars push the risk <em>up</em>; green bars push it <em>down</em>. The sum of all bars + the baseline equals the final prediction.
          </p>
        </div>
      )}
    </div>
  );
}
