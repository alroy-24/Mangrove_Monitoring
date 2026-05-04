"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Leaf, Wind, TrendingDown, Car } from "lucide-react";

interface CarbonData {
  yearly: Record<number, {
    area_ha: number;
    carbon_stock_tco2: number;
    annual_seq_tco2: number;
    carbon_value_inr: number;
  }>;
  summary: {
    total_area_ha_2025: number;
    total_carbon_stock_tco2: number;
    annual_sequestration_tco2: number;
    carbon_lost_tco2_since_2020: number;
    equivalent_cars_off_road: number;
    carbon_value_inr_per_year: number;
  };
}

export default function CarbonTab() {
  const [data, setData] = useState<CarbonData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/analytics/carbon")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  if (!data) return <p className="text-muted text-sm">Could not load data — is the backend running?</p>;

  const chartData = Object.entries(data.yearly).map(([yr, v]) => ({
    year: Number(yr),
    "Carbon Stock (tCO₂)": v.carbon_stock_tco2,
    "Annual Seq. (tCO₂)": v.annual_seq_tco2,
    "Area (ha)": v.area_ha,
  }));

  const s = data.summary;

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Leaf className="w-5 h-5" />} label="Total Carbon Stock" value={`${(s.total_carbon_stock_tco2 / 1000).toFixed(1)}k tCO₂`} sub="Above + below ground biomass" color="green" />
        <KpiCard icon={<Wind className="w-5 h-5" />} label="Annual Sequestration" value={`${s.annual_sequestration_tco2.toFixed(0)} tCO₂`} sub="Captured per year (2025)" color="teal" />
        <KpiCard icon={<TrendingDown className="w-5 h-5" />} label="Carbon Lost (2020–25)" value={`${s.carbon_lost_tco2_since_2020.toFixed(0)} tCO₂`} sub="Due to net coverage loss" color="red" />
        <KpiCard icon={<Car className="w-5 h-5" />} label="Cars Equivalent" value={`${s.equivalent_cars_off_road.toFixed(0)}`} sub="Vehicles removed equiv. per yr" color="yellow" />
      </div>

      {/* Carbon value banner */}
      <div className="rounded-xl bg-gradient-to-r from-accent-light to-teal-light border border-accent/20 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-1">Annual Carbon Market Value (2025)</p>
          <p className="text-3xl font-bold text-foreground">
            ₹{(s.carbon_value_inr_per_year / 100000).toFixed(2)} lakh
          </p>
          <p className="text-sm text-muted mt-1">At ₹1,250/tCO₂ — voluntary carbon market rate</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Study area: {s.total_area_ha_2025} ha</p>
          <p className="text-xs text-muted">Pixel resolution: 10m × 10m</p>
          <p className="text-xs text-muted">Ref: Siikamäki et al. 2012</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Carbon stock over time */}
        <div className="card">
          <h3 className="section-title mb-4">Carbon Stock Over Time (tCO₂)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="csGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16A34A" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13 }}
                formatter={(v) => [`${Number(v).toLocaleString()} tCO₂`]} />
              <Area type="monotone" dataKey="Carbon Stock (tCO₂)" stroke="#16A34A" strokeWidth={2.5} fill="url(#csGrad)" dot={{ r: 4, fill: "#16A34A" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Annual sequestration + area */}
        <div className="card">
          <h3 className="section-title mb-4">Annual Sequestration vs Coverage Area</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="left" dataKey="Annual Seq. (tCO₂)" fill="#0D9488" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="Area (ha)" fill="#16A34A" radius={[4, 4, 0, 0]} opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Methodology note */}
      <div className="card bg-blue-50 border-blue-100 text-sm text-blue-700 leading-relaxed">
        <strong>Methodology:</strong> Carbon stock = coverage area (ha) × 900 tC/ha × 3.67 (CO₂/C ratio).
        Annual sequestration = area × 6 tCO₂/ha/yr. Values based on Indo-Pacific mangrove biomass studies
        (Donato et al. 2011, Siikamäki et al. 2012). Carbon price at ₹1,250/tCO₂ (voluntary market, 2024).
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  const colors: Record<string, string> = {
    green:  "bg-accent-light text-accent",
    teal:   "bg-teal-light text-teal",
    red:    "bg-danger-light text-danger",
    yellow: "bg-warning-light text-warning",
  };
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="label">{label}</span>
        <span className={`p-2 rounded-lg ${colors[color]}`}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card h-28 bg-gray-100" />
      ))}
    </div>
  );
}
