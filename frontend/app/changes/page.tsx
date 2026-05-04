"use client";

import { useState } from "react";
import { TrendingDown } from "lucide-react";
import ChangeChart from "@/components/change-chart";
import { api } from "@/lib/api";

const PERIODS = [
  { key: "2020-2021", label: "2020 → 2021", change_map: "change_map_2020_2021", loss: 312, gain: 324, net: 12, net_pct: 0.02 },
  { key: "2021-2023", label: "2021 → 2023", change_map: "change_map_2021_2023", loss: 285, gain: 353, net: 68, net_pct: 0.10 },
  { key: "2023-2025", label: "2023 → 2025", change_map: "change_map_2023_2025", loss: 398, gain: 263, net: -135, net_pct: -0.21 },
];

export default function ChangesPage() {
  const [period, setPeriod] = useState(PERIODS[2]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-accent text-sm font-medium mb-1">
          <TrendingDown className="w-4 h-4" /> Change Detection
        </div>
        <h1 className="text-2xl font-bold text-foreground">Mangrove Change Detection</h1>
        <p className="text-muted text-sm mt-1">Loss and gain analysis across three consecutive periods.</p>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 flex-wrap">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
              period.key === p.key
                ? "bg-accent text-white border-accent"
                : "bg-white border-border text-muted hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="label mb-1">Loss</p>
          <p className="text-2xl font-bold text-danger">−{period.loss} px</p>
        </div>
        <div className="card text-center">
          <p className="label mb-1">Gain</p>
          <p className="text-2xl font-bold text-accent">+{period.gain} px</p>
        </div>
        <div className="card text-center">
          <p className="label mb-1">Net Change</p>
          <p className={`text-2xl font-bold ${period.net >= 0 ? "text-accent" : "text-danger"}`}>
            {period.net >= 0 ? "+" : ""}{period.net} px
          </p>
        </div>
        <div className="card text-center">
          <p className="label mb-1">Net %</p>
          <p className={`text-2xl font-bold ${period.net_pct >= 0 ? "text-accent" : "text-danger"}`}>
            {period.net_pct >= 0 ? "+" : ""}{period.net_pct.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="card">
          <h2 className="section-title mb-4">Loss vs Gain — All Periods</h2>
          <ChangeChart />
        </div>

        {/* Change map image */}
        <div className="card flex flex-col">
          <h2 className="section-title mb-4">Change Map — {period.label}</h2>
          <div className="flex-1 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center min-h-[240px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={api.mapImageUrl(period.change_map)}
              alt={`Change map ${period.label}`}
              className="max-w-full max-h-64 object-contain rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                const parent = (e.target as HTMLImageElement).parentElement;
                if (parent) parent.innerHTML = '<p class="text-muted text-sm">Image not found — run pipeline first</p>';
              }}
            />
          </div>
          <div className="mt-4 flex gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Loss</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Gain</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-300 inline-block" /> No change</span>
          </div>
        </div>
      </div>

      {/* Summary table */}
      <div className="card overflow-x-auto">
        <h2 className="section-title mb-4">All Periods Summary</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left pb-3 font-semibold text-muted">Period</th>
              <th className="text-right pb-3 font-semibold text-muted">Loss (px)</th>
              <th className="text-right pb-3 font-semibold text-muted">Gain (px)</th>
              <th className="text-right pb-3 font-semibold text-muted">Net (px)</th>
              <th className="text-right pb-3 font-semibold text-muted">Net (%)</th>
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((p) => (
              <tr key={p.key} className="border-b border-border last:border-0">
                <td className="py-3 font-medium text-foreground">{p.label}</td>
                <td className="py-3 text-right text-danger">−{p.loss}</td>
                <td className="py-3 text-right text-accent">+{p.gain}</td>
                <td className={`py-3 text-right font-medium ${p.net >= 0 ? "text-accent" : "text-danger"}`}>
                  {p.net >= 0 ? "+" : ""}{p.net}
                </td>
                <td className={`py-3 text-right font-medium ${p.net_pct >= 0 ? "text-accent" : "text-danger"}`}>
                  {p.net_pct >= 0 ? "+" : ""}{p.net_pct.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
