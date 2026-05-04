"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell,
} from "recharts";
import { Fish, Shield, TreePine, Sparkles } from "lucide-react";

interface EconData {
  yearly: Record<number, {
    area_ha: number;
    fisheries_inr: number;
    coastal_protection_inr: number;
    carbon_market_inr: number;
    biodiversity_inr: number;
    total_inr: number;
    total_usd: number;
  }>;
  summary: {
    total_annual_value_inr: number;
    annual_lost_value_inr: number;
    fisheries_value_inr: number;
    coastal_protection_inr: number;
  };
  esv_per_ha: Record<string, number>;
}

const SERVICE_META = [
  { key: "fisheries_inr",         label: "Fisheries",          color: "#16A34A", icon: Fish },
  { key: "coastal_protection_inr",label: "Coastal Protection", color: "#0D9488", icon: Shield },
  { key: "carbon_market_inr",     label: "Carbon Market",      color: "#2563EB", icon: TreePine },
  { key: "biodiversity_inr",      label: "Biodiversity",       color: "#7C3AED", icon: Sparkles },
];

export default function EconomicTab() {
  const [data, setData] = useState<EconData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/analytics/economic")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />;
  if (!data) return <p className="text-muted text-sm">Could not load data.</p>;

  const s = data.summary;
  const stackedData = Object.entries(data.yearly).map(([yr, v]) => ({
    year: Number(yr),
    "Fisheries":          v.fisheries_inr / 100000,
    "Coastal Protection": v.coastal_protection_inr / 100000,
    "Carbon Market":      v.carbon_market_inr / 100000,
    "Biodiversity":       v.biodiversity_inr / 100000,
  }));

  const pieData = SERVICE_META.map(({ key, label, color }) => ({
    name: label,
    value: data.esv_per_ha[key.replace("_inr", "")],
    color,
  }));

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="rounded-xl bg-gradient-to-r from-green-50 via-teal-50 to-blue-50 border border-border p-6">
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="text-center sm:text-left">
            <p className="label mb-1">Total Annual Value (2025)</p>
            <p className="text-4xl font-bold text-foreground">
              ₹{(s.total_annual_value_inr / 10000000).toFixed(2)} Cr
            </p>
            <p className="text-sm text-muted mt-1">Ecosystem services provided</p>
          </div>
          <div className="text-center">
            <p className="label mb-1">Fisheries Support</p>
            <p className="text-3xl font-bold text-accent">
              ₹{(s.fisheries_value_inr / 10000000).toFixed(2)} Cr
            </p>
            <p className="text-sm text-muted mt-1">Sustaining local fishing communities</p>
          </div>
          <div className="text-center sm:text-right">
            <p className="label mb-1">Value Lost (2020–25)</p>
            <p className="text-3xl font-bold text-danger">
              ₹{(s.annual_lost_value_inr / 1000).toFixed(1)}k / yr
            </p>
            <p className="text-sm text-muted mt-1">Due to net mangrove loss</p>
          </div>
        </div>
      </div>

      {/* Service breakdown cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SERVICE_META.map(({ key, label, color, icon: Icon }) => {
          const val2025 = data.yearly[2025][key as keyof typeof data.yearly[2025]] as number;
          const perHa   = data.esv_per_ha[key.replace("_inr", "")];
          return (
            <div key={key} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <span className="label text-[10px]">{label}</span>
                <span className="p-2 rounded-lg" style={{ background: color + "22", color }}><Icon className="w-4 h-4" /></span>
              </div>
              <p className="text-xl font-bold text-foreground">₹{(val2025 / 100000).toFixed(1)}L</p>
              <p className="text-xs text-muted">₹{perHa.toLocaleString()}/ha/yr</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Stacked bar */}
        <div className="card lg:col-span-2">
          <h3 className="section-title mb-4">Ecosystem Value by Service (₹ lakh/yr)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stackedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}L`} />
              <Tooltip contentStyle={{ border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13 }}
                formatter={(v) => [`₹${Number(v).toFixed(1)} lakh`]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {SERVICE_META.map(({ label, color }) => (
                <Bar key={label} dataKey={label} stackId="a" fill={color} radius={label === "Biodiversity" ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie breakdown */}
        <div className="card">
          <h3 className="section-title mb-2">Service Mix</h3>
          <p className="text-xs text-muted mb-3">% of total value per ha</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" labelLine={false}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`₹${Number(v).toLocaleString()}/ha/yr`]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Context */}
      <div className="card bg-amber-50 border-amber-100 text-sm text-amber-800 leading-relaxed">
        <strong>Sources:</strong> Ecosystem service values based on TEEB India estimates for coastal mangroves.
        Fisheries: CMFRI Maharashtra fish landing data. Coastal protection: Barbier et al. 2011 storm-surge
        damage avoidance. Carbon: voluntary market (Gold Standard, 2024). All values in 2024 INR.
      </div>
    </div>
  );
}
