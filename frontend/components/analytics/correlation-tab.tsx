"use client";

import { useEffect, useState } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Area, AreaChart,
  BarChart, Bar, ReferenceLine,
} from "recharts";

interface CorrData {
  rainfall_vs_gain: { month: string; rainfall_mm: number; gain_px: number }[];
  urban_vs_loss:    { district: string; urban_growth_pct: number; loss_px_yr: number }[];
  pop_density_vs_loss: { zone: string; pop_density: number; loss_pct_5yr: number }[];
  ndvi_trend:       { year: number; ndvi_mean: number; ndvi_min: number; ndvi_max: number }[];
  correlation_coefficients: Record<string, number>;
}

const R_COLOR: Record<number, string> = {};
function rLabel(r: number) {
  if (r >= 0.9) return { label: "Very Strong", color: "#16A34A" };
  if (r >= 0.7) return { label: "Strong",      color: "#0D9488" };
  if (r >= 0.5) return { label: "Moderate",    color: "#D97706" };
  return           { label: "Weak",         color: "#DC2626" };
}

export default function CorrelationTab() {
  const [data, setData] = useState<CorrData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/analytics/correlations")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />;
  if (!data) return <p className="text-muted text-sm">Could not load data.</p>;

  const cc = data.correlation_coefficients;

  return (
    <div className="space-y-6">
      {/* Correlation summary chips */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: "rainfall_gain",   label: "Rainfall → Gain",          r: cc.rainfall_gain },
          { key: "urban_loss",      label: "Urban Growth → Loss",       r: cc.urban_loss },
          { key: "population_loss", label: "Pop. Density → Loss",       r: cc.population_loss },
          { key: "ndvi_coverage",   label: "NDVI Health → Coverage",    r: cc.ndvi_coverage },
        ].map(({ label, r }) => {
          const { label: strength, color } = rLabel(r);
          return (
            <div key={label} className="card text-center">
              <p className="label mb-2">{label}</p>
              <p className="text-3xl font-bold" style={{ color }}>{r.toFixed(2)}</p>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block"
                style={{ background: color + "22", color }}>{strength}</span>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Rainfall vs Gain — bar */}
        <div className="card">
          <h3 className="section-title mb-1">Monthly Rainfall vs Mangrove Gain</h3>
          <p className="text-xs text-muted mb-4">Konkan monsoon drives regrowth · r = {cc.rainfall_gain}</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.rainfall_vs_gain}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="rain" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${v}mm`} />
              <YAxis yAxisId="gain" orientation="right" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${v}px`} />
              <Tooltip contentStyle={{ border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12 }} />
              <Bar yAxisId="rain" dataKey="rainfall_mm" name="Rainfall (mm)" fill="#3B82F6" radius={[3, 3, 0, 0]} opacity={0.7} />
              <Bar yAxisId="gain" dataKey="gain_px"    name="Gain (px)"     fill="#16A34A" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* NDVI trend */}
        <div className="card">
          <h3 className="section-title mb-1">Regional NDVI Health Trend</h3>
          <p className="text-xs text-muted mb-4">Mean vegetation index with min–max band · r = {cc.ndvi_coverage}</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.ndvi_trend}>
              <defs>
                <linearGradient id="ndviGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16A34A" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0.3, 0.85]} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="ndvi_max"  stroke="transparent" fill="url(#ndviGrad)" />
              <Line type="monotone" dataKey="ndvi_mean" stroke="#16A34A" strokeWidth={2.5} dot={{ r: 4, fill: "#16A34A" }} name="Mean NDVI" />
              <Line type="monotone" dataKey="ndvi_min"  stroke="#DC2626" strokeWidth={1.5} strokeDasharray="4 3" dot={false} name="Min NDVI" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Urban expansion vs loss — scatter */}
        <div className="card">
          <h3 className="section-title mb-1">Urban Growth Rate vs Mangrove Loss</h3>
          <p className="text-xs text-muted mb-4">District-level · r = {cc.urban_loss}</p>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="urban_growth_pct" name="Urban Growth (%/yr)" type="number"
                tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${v}%`} />
              <YAxis dataKey="loss_px_yr" name="Loss (px/yr)" type="number"
                tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{ border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12 }}
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = data.urban_vs_loss.find(
                    (x) => x.urban_growth_pct === payload[0]?.value
                  );
                  return (
                    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
                      <p style={{ fontWeight: 600 }}>{d?.district}</p>
                      <p style={{ color: "#64748B" }}>Urban growth: {d?.urban_growth_pct}%/yr</p>
                      <p style={{ color: "#DC2626" }}>Loss: {d?.loss_px_yr} px/yr</p>
                    </div>
                  );
                }}
              />
              <Scatter data={data.urban_vs_loss} dataKey="loss_px_yr" fill="#DC2626" opacity={0.8} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Population density vs loss — scatter */}
        <div className="card">
          <h3 className="section-title mb-1">Population Density vs 5-Year Loss</h3>
          <p className="text-xs text-muted mb-4">Zone-level · r = {cc.population_loss}</p>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="pop_density" name="Pop/km²" type="number"
                tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="loss_pct_5yr" name="Loss % (5yr)" type="number"
                tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${v}%`} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{ border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12 }}
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = data.pop_density_vs_loss.find(
                    (x) => x.pop_density === payload[0]?.value
                  );
                  return (
                    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
                      <p style={{ fontWeight: 600 }}>{d?.zone}</p>
                      <p style={{ color: "#64748B" }}>Density: {d?.pop_density}/km²</p>
                      <p style={{ color: "#DC2626" }}>5yr Loss: {d?.loss_pct_5yr}%</p>
                    </div>
                  );
                }}
              />
              <Scatter data={data.pop_density_vs_loss} dataKey="loss_pct_5yr" fill="#D97706" opacity={0.8} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card bg-blue-50 border-blue-100 text-sm text-blue-700 leading-relaxed">
        <strong>Note:</strong> Correlation data for urban expansion and population density is calibrated to
        published district-level patterns for the Vasai–Konkan coastline (not live sensor data). Rainfall data represents average
        monthly patterns for the Konkan region (IMD). Production deployment would integrate real IMD, Census, and
        UDRI urban growth datasets.
      </div>
    </div>
  );
}
