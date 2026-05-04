const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

export type CoverageYear = {
  coverage_pct: number;
  mangrove_px: number;
  total_px: number;
};

export type CoverageResponse = {
  years: number[];
  data: Record<number, CoverageYear>;
  region: string;
  lat_bounds: [number, number];
  lng_bounds: [number, number];
};

export type ChangePeriod = {
  loss_px: number;
  gain_px: number;
  net_change_px: number;
  net_change_pct: number;
};

export type ChangesResponse = { periods: Record<string, ChangePeriod> };

export type RiskZone = { count: number; pct: number };
export type RiskSummaryResponse = {
  zones: { low: RiskZone; medium: RiskZone; high: RiskZone };
  total_pixels: number;
  summary: string;
};

export type FeatureStats = Record<string, Record<string, number>>;
export type FeaturesResponse = {
  columns: string[];
  stats: FeatureStats;
  row_count: number;
};

export type FeatureImportance = { feature: string; importance: number };
export type ModelInfoResponse = {
  algorithm: string;
  n_estimators: number;
  max_depth: number;
  metrics: Record<string, number>;
  feature_importances: FeatureImportance[];
};

export type PredictRequest = {
  ndvi_trend: number;
  distance_to_urban: number;
  distance_to_coast: number;
  previous_loss_count: number;
  water_proximity: number;
  current_mangrove: number;
};

export type PredictResponse = {
  probability: number;
  risk_level: "Low" | "Medium" | "High";
  color: string;
  recommendation: string;
  inputs: PredictRequest;
};

export type ZoneBounds = {
  lat_min: number;
  lat_max: number;
  lng_min: number;
  lng_max: number;
};

export type ZoneReport = {
  zone: ZoneBounds;
  total_pixels: number;
  area_ha: number;
  risk_distribution: {
    low:    { pixels: number; pct: number };
    medium: { pixels: number; pct: number };
    high:   { pixels: number; pct: number };
  };
  dominant_risk: "Low" | "Medium" | "High";
  carbon_stock_tco2: number;
  annual_value_inr: number;
};

export const api = {
  coverage:      () => get<CoverageResponse>("/api/coverage"),
  changes:       () => get<ChangesResponse>("/api/changes"),
  riskSummary:   () => get<RiskSummaryResponse>("/api/risk-summary"),
  features:      () => get<FeaturesResponse>("/api/features"),
  modelInfo:     () => get<ModelInfoResponse>("/api/model-info"),
  predict:       (body: PredictRequest) => post<PredictResponse>("/api/predict", body),
  riskZoneQuery: (body: ZoneBounds) => post<ZoneReport>("/api/risk-zone-query", body),
  mapImageUrl:   (type: string) => `${BASE}/api/map-image/${type}`,
};
