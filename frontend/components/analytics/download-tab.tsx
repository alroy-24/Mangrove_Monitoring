"use client";

import { useState } from "react";
import { Download, FileText, Image, Database, Map, CheckCircle, AlertCircle } from "lucide-react";

const BASE = "http://localhost:8000";

interface DownloadItem {
  id: string;
  label: string;
  description: string;
  url: string;
  filename: string;
  size: string;
  icon: React.ReactNode;
  category: "data" | "map" | "report";
}

const DOWNLOADS: DownloadItem[] = [
  {
    id: "features-csv",
    label: "Feature Dataset (CSV)",
    description: "65,536 pixels × 9 features: NDVI trend, urban/coast/aquaculture distances, elevation risk, fragmentation, water proximity, loss count.",
    url: `${BASE}/api/download/features-csv`,
    filename: "mangrove_features_vasai_konkan.csv",
    size: "~4 MB",
    icon: <Database className="w-5 h-5" />,
    category: "data",
  },
  {
    id: "summary-report",
    label: "Pipeline Summary Report (TXT)",
    description: "Full text report: coverage stats, change metrics, model performance, risk summary.",
    url: `${BASE}/api/download/summary-report`,
    filename: "mangrove_summary_report.txt",
    size: "~12 KB",
    icon: <FileText className="w-5 h-5" />,
    category: "report",
  },
  {
    id: "mangrove_map_2025",
    label: "Mangrove Map 2025 (PNG)",
    description: "256×256 px mangrove classification map for 2025. Green = mangrove, dark = non-mangrove.",
    url: `${BASE}/api/download/map-png/mangrove_map_2025`,
    filename: "mangrove_map_2025.png",
    size: "~800 KB",
    icon: <Map className="w-5 h-5" />,
    category: "map",
  },
  {
    id: "mangrove_map_2020",
    label: "Mangrove Map 2020 (PNG)",
    description: "Baseline year classification map for comparison with 2025.",
    url: `${BASE}/api/download/map-png/mangrove_map_2020`,
    filename: "mangrove_map_2020.png",
    size: "~800 KB",
    icon: <Map className="w-5 h-5" />,
    category: "map",
  },
  {
    id: "risk_heatmap",
    label: "Risk Probability Heatmap (PNG)",
    description: "Per-pixel loss probability visualisation. Red = high risk, green = low risk.",
    url: `${BASE}/api/download/map-png/risk_heatmap`,
    filename: "risk_heatmap.png",
    size: "~900 KB",
    icon: <Image className="w-5 h-5" />,
    category: "map",
  },
  {
    id: "risk_zones",
    label: "Risk Zones Map (PNG)",
    description: "Classified risk zones: Low / Medium / High. Suitable for stakeholder presentations.",
    url: `${BASE}/api/download/map-png/risk_zones`,
    filename: "risk_zones.png",
    size: "~850 KB",
    icon: <Image className="w-5 h-5" />,
    category: "map",
  },
  {
    id: "change_map_2023_2025",
    label: "Change Map 2023→2025 (PNG)",
    description: "Loss (red) and gain (green) pixels for the most recent period.",
    url: `${BASE}/api/download/map-png/change_map_2023_2025`,
    filename: "change_map_2023_2025.png",
    size: "~750 KB",
    icon: <Image className="w-5 h-5" />,
    category: "map",
  },
  {
    id: "change_timeline",
    label: "Change Timeline Chart (PNG)",
    description: "Bar chart showing loss/gain/net change across all periods.",
    url: `${BASE}/api/download/map-png/change_timeline`,
    filename: "change_timeline.png",
    size: "~400 KB",
    icon: <Image className="w-5 h-5" />,
    category: "map",
  },
];

const CATEGORIES = [
  { key: "all",    label: "All" },
  { key: "data",   label: "Datasets" },
  { key: "map",    label: "Maps & Charts" },
  { key: "report", label: "Reports" },
] as const;

type Status = "idle" | "downloading" | "done" | "error";

export default function DownloadTab() {
  const [filter, setFilter] = useState<"all" | "data" | "map" | "report">("all");
  const [statuses, setStatuses] = useState<Record<string, Status>>({});

  const setStatus = (id: string, s: Status) =>
    setStatuses((prev) => ({ ...prev, [id]: s }));

  async function handleDownload(item: DownloadItem) {
    setStatus(item.id, "downloading");
    try {
      const res = await fetch(item.url);
      if (!res.ok) throw new Error(`${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.filename;
      a.click();
      URL.revokeObjectURL(url);
      setStatus(item.id, "done");
      setTimeout(() => setStatus(item.id, "idle"), 3000);
    } catch {
      setStatus(item.id, "error");
      setTimeout(() => setStatus(item.id, "idle"), 4000);
    }
  }

  const visible = filter === "all" ? DOWNLOADS : DOWNLOADS.filter((d) => d.category === filter);
  const catColors = { data: "blue", map: "green", report: "purple" } as const;
  const catBg = { data: "bg-blue-50 text-blue-600", map: "bg-accent-light text-accent", report: "bg-purple-50 text-purple-600" };

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="card bg-amber-50 border-amber-100">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-1">Pipeline outputs required</p>
            <p className="text-sm text-amber-700">
              Maps and CSV files are generated by running <code className="bg-amber-100 px-1 rounded">python mangrove_loss_prediction/main.py</code> first.
              Downloads will return 404 until the pipeline has been executed at least once.
            </p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
              filter === key ? "bg-foreground text-white border-foreground" : "bg-white border-border text-muted hover:text-foreground"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Download cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {visible.map((item) => {
          const s = statuses[item.id] ?? "idle";
          return (
            <div key={item.id} className="card flex gap-4 hover:shadow-card-hover transition-shadow">
              <span className={`p-3 rounded-xl flex-shrink-0 h-fit ${catBg[item.category]}`}>
                {item.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm text-foreground leading-tight">{item.label}</p>
                  <span className="text-xs text-muted flex-shrink-0">{item.size}</span>
                </div>
                <p className="text-xs text-muted mt-1 mb-3 leading-relaxed">{item.description}</p>
                <button
                  onClick={() => handleDownload(item)}
                  disabled={s === "downloading"}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    s === "done"        ? "bg-accent-light text-accent" :
                    s === "error"       ? "bg-danger-light text-danger" :
                    s === "downloading" ? "bg-gray-100 text-muted cursor-not-allowed" :
                    "bg-foreground text-white hover:bg-gray-800"
                  }`}
                >
                  {s === "done"        ? <><CheckCircle className="w-3.5 h-3.5" /> Downloaded</> :
                   s === "error"       ? <><AlertCircle className="w-3.5 h-3.5" /> Not found — run pipeline</> :
                   s === "downloading" ? "Downloading…" :
                   <><Download className="w-3.5 h-3.5" /> Download</>}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats footer */}
      <div className="card">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-foreground">{DOWNLOADS.filter(d => d.category === "data").length}</p>
            <p className="label">Datasets</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{DOWNLOADS.filter(d => d.category === "map").length}</p>
            <p className="label">Maps & Charts</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{DOWNLOADS.filter(d => d.category === "report").length}</p>
            <p className="label">Reports</p>
          </div>
        </div>
      </div>
    </div>
  );
}
