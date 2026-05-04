"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Map as MapIcon, Layers, Play, Pause,
  Globe, Satellite, Sun, Square, X,
} from "lucide-react";
import MangroveMap from "@/components/mangrove-map";
import { api } from "@/lib/api";
import type { Basemap } from "@/components/leaflet-map-inner";
import type { ZoneBounds, ZoneReport } from "@/lib/api";

const YEARS = [2020, 2021, 2023, 2025];

const SPEEDS = [
  { label: "0.5×", ms: 3000 },
  { label: "1×",   ms: 1500 },
  { label: "2×",   ms: 750  },
];

const BASEMAPS: { key: Basemap; label: string; icon: React.ReactNode }[] = [
  { key: "osm",   label: "Street",    icon: <Globe className="w-3.5 h-3.5" /> },
  { key: "carto", label: "Clean",     icon: <Sun className="w-3.5 h-3.5" /> },
  { key: "esri",  label: "Satellite", icon: <Satellite className="w-3.5 h-3.5" /> },
];

function riskTextColor(level: string) {
  if (level === "High")   return "text-danger";
  if (level === "Medium") return "text-warning";
  return "text-accent";
}

function riskCardClass(level: string) {
  if (level === "High")   return "border-danger/30 bg-red-50";
  if (level === "Medium") return "border-warning/30 bg-amber-50";
  return "border-accent/30 bg-green-50";
}

export default function MapPage() {
  const [year, setYear]           = useState(2025);
  const [showRisk, setShowRisk]   = useState(false);
  const [basemap, setBasemap]     = useState<Basemap>("osm");
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedIdx, setSpeedIdx]   = useState(1);
  const [drawMode, setDrawMode]   = useState(false);
  const [zoneReport, setZoneReport] = useState<ZoneReport | null>(null);
  const [zoneLoading, setZoneLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Time-lapse loop
  useEffect(() => {
    if (isPlaying) {
      const ms = SPEEDS[speedIdx].ms;
      intervalRef.current = setInterval(() => {
        setYear(prev => {
          const idx = YEARS.indexOf(prev);
          return YEARS[(idx + 1) % YEARS.length];
        });
        setShowRisk(false);
      }, ms);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, speedIdx]);

  const handleZoneSelect = useCallback(async (bounds: ZoneBounds) => {
    setZoneLoading(true);
    setZoneReport(null);
    try {
      const data = await api.riskZoneQuery(bounds);
      setZoneReport(data);
    } catch {
      // silently fail; user can retry
    } finally {
      setZoneLoading(false);
      setDrawMode(false);
    }
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-accent text-sm font-medium mb-1">
          <MapIcon className="w-4 h-4" /> Interactive Map
        </div>
        <h1 className="text-2xl font-bold text-foreground">Vasai–Konkan Mangrove Map</h1>
        <p className="text-muted text-sm mt-1">
          Pan, zoom, animate years, switch basemaps, or draw a zone to get an instant risk report.
        </p>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap gap-3 items-center">

        {/* Year selector */}
        <div className="flex items-center gap-1 bg-white border border-border rounded-xl p-1">
          {YEARS.map((y) => (
            <button
              key={y}
              onClick={() => { setYear(y); setShowRisk(false); setIsPlaying(false); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                year === y && !showRisk
                  ? "bg-accent text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {y}
            </button>
          ))}
        </div>

        {/* Time-lapse controls */}
        <div className="flex items-center gap-1 bg-white border border-border rounded-xl p-1">
          <button
            onClick={() => setIsPlaying(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isPlaying ? "bg-accent text-white" : "text-muted hover:text-foreground"
            }`}
          >
            {isPlaying
              ? <><Pause className="w-3.5 h-3.5" /> Pause</>
              : <><Play  className="w-3.5 h-3.5" /> Play</>
            }
          </button>
          {SPEEDS.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setSpeedIdx(i)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                speedIdx === i
                  ? "bg-gray-100 text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Risk layer toggle */}
        <button
          onClick={() => { setShowRisk(v => !v); setIsPlaying(false); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
            showRisk
              ? "bg-warning text-white border-warning"
              : "bg-white border-border text-muted hover:text-foreground"
          }`}
        >
          <Layers className="w-4 h-4" />
          Risk Layer
        </button>

        {/* Basemap selector */}
        <div className="flex items-center gap-1 bg-white border border-border rounded-xl p-1">
          {BASEMAPS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setBasemap(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                basemap === key
                  ? "bg-foreground text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Draw zone */}
        <button
          onClick={() => { setDrawMode(v => !v); setZoneReport(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
            drawMode
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white border-border text-muted hover:text-foreground"
          }`}
        >
          <Square className="w-4 h-4" />
          {drawMode ? "Cancel Draw" : "Draw Zone"}
        </button>
      </div>

      {/* Status banners */}
      {isPlaying && (
        <div className="flex items-center gap-2 text-sm text-accent font-medium bg-accent-light border border-accent/20 rounded-xl px-4 py-2.5">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse flex-shrink-0" />
          Time-lapse playing — Year <strong>{year}</strong> · {SPEEDS[speedIdx].label} speed · Click any year to stop
        </div>
      )}
      {drawMode && !isPlaying && (
        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
          <Square className="w-4 h-4 flex-shrink-0" />
          Click once to anchor your zone, click again to complete it — an instant risk report will appear below.
        </div>
      )}

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-border shadow-card">
        <MangroveMap
          selectedYear={year}
          showRisk={showRisk}
          basemap={basemap}
          drawMode={drawMode}
          onZoneSelect={handleZoneSelect}
        />
      </div>

      {/* Zone risk report */}
      {(zoneLoading || zoneReport) && (
        <div className={`card border ${zoneReport ? riskCardClass(zoneReport.dominant_risk) : "border-border"}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Square className="w-4 h-4 text-accent" />
              Zone Risk Report
            </h3>
            <button
              onClick={() => setZoneReport(null)}
              className="text-muted hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {zoneLoading ? (
            <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ) : zoneReport && (
            <div className="space-y-4">
              {/* KPI row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="label mb-1">Area</p>
                  <p className="font-bold text-foreground text-lg">{zoneReport.area_ha.toFixed(1)} ha</p>
                  <p className="text-xs text-muted">{zoneReport.total_pixels.toLocaleString()} pixels</p>
                </div>
                <div>
                  <p className="label mb-1">Dominant Risk</p>
                  <p className={`font-bold text-2xl ${riskTextColor(zoneReport.dominant_risk)}`}>
                    {zoneReport.dominant_risk}
                  </p>
                </div>
                <div>
                  <p className="label mb-1">Carbon Stock</p>
                  <p className="font-bold text-foreground text-lg">
                    {zoneReport.carbon_stock_tco2 >= 1000
                      ? `${(zoneReport.carbon_stock_tco2 / 1000).toFixed(1)}k`
                      : zoneReport.carbon_stock_tco2.toFixed(0)} tCO₂
                  </p>
                </div>
                <div>
                  <p className="label mb-1">Annual Value</p>
                  <p className="font-bold text-foreground text-lg">
                    ₹{(zoneReport.annual_value_inr / 100000).toFixed(1)}L/yr
                  </p>
                </div>
              </div>

              {/* Stacked risk bar */}
              <div>
                <p className="label mb-2">Risk Distribution</p>
                <div className="flex rounded-full overflow-hidden h-3 gap-px bg-gray-100">
                  <div
                    style={{ width: `${zoneReport.risk_distribution.low.pct}%` }}
                    className="bg-accent transition-all duration-500"
                    title={`Low: ${zoneReport.risk_distribution.low.pct}%`}
                  />
                  <div
                    style={{ width: `${zoneReport.risk_distribution.medium.pct}%` }}
                    className="bg-warning transition-all duration-500"
                    title={`Medium: ${zoneReport.risk_distribution.medium.pct}%`}
                  />
                  <div
                    style={{ width: `${zoneReport.risk_distribution.high.pct}%` }}
                    className="bg-danger transition-all duration-500"
                    title={`High: ${zoneReport.risk_distribution.high.pct}%`}
                  />
                </div>
                <div className="flex gap-4 mt-1.5 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-accent inline-block" />
                    Low {zoneReport.risk_distribution.low.pct}%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-warning inline-block" />
                    Med {zoneReport.risk_distribution.medium.pct}%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-danger inline-block" />
                    High {zoneReport.risk_distribution.high.pct}%
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted">
                Zone bounds: {zoneReport.zone.lat_min.toFixed(2)}–{zoneReport.zone.lat_max.toFixed(2)}°N,{" "}
                {zoneReport.zone.lng_min.toFixed(2)}–{zoneReport.zone.lng_max.toFixed(2)}°E
              </p>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="card flex flex-wrap gap-6">
        <div>
          <p className="label mb-2">Mangrove Layer</p>
          <div className="flex items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-600 inline-block" /> Mangrove Forest</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-300 inline-block" /> Water / Creek</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-200 inline-block" /> Non-Mangrove</span>
          </div>
        </div>
        <div>
          <p className="label mb-2">Risk Layer</p>
          <div className="flex items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Low Risk</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-yellow-400 inline-block" /> Medium Risk</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> High Risk</span>
          </div>
        </div>
        <div className="text-xs text-muted ml-auto self-center">
          Source: GMW v3.0 (JAXA) · Binary classification · {year}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Study Area",      value: "Vasai to Sindhudurg", sub: "~400 km coastline" },
          { label: "Lat / Lng Bounds",value: "15.5–19.5°N",         sub: "72.7–73.9°E" },
          { label: "Data Source",     value: "GMW v3.0 (JAXA)", sub: "Pre-classified binary raster" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="card text-center">
            <p className="label mb-1">{label}</p>
            <p className="font-semibold text-foreground">{value}</p>
            <p className="text-xs text-muted">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
