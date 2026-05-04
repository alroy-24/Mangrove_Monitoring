"use client";

import { useState } from "react";
import { FlaskConical, Leaf, DollarSign, GitBranch, Download } from "lucide-react";
import dynamic from "next/dynamic";

const CarbonTab      = dynamic(() => import("@/components/analytics/carbon-tab"),      { ssr: false });
const EconomicTab    = dynamic(() => import("@/components/analytics/economic-tab"),    { ssr: false });
const CorrelationTab = dynamic(() => import("@/components/analytics/correlation-tab"), { ssr: false });
const DownloadTab    = dynamic(() => import("@/components/analytics/download-tab"),    { ssr: false });

const TABS = [
  {
    key: "carbon",
    label: "Carbon",
    icon: Leaf,
    description: "Carbon stock & sequestration value",
    color: "text-accent",
    activeBg: "bg-accent-light text-accent border-accent",
  },
  {
    key: "economic",
    label: "Economic",
    icon: DollarSign,
    description: "Ecosystem services in ₹ & $",
    color: "text-teal",
    activeBg: "bg-teal-light text-teal border-teal",
  },
  {
    key: "correlations",
    label: "Correlations",
    icon: GitBranch,
    description: "Rainfall, urban growth, population drivers",
    color: "text-blue-600",
    activeBg: "bg-blue-50 text-blue-600 border-blue-300",
  },
  {
    key: "downloads",
    label: "Downloads",
    icon: Download,
    description: "Maps, datasets & reports",
    color: "text-purple-600",
    activeBg: "bg-purple-50 text-purple-600 border-purple-300",
  },
] as const;

type TabKey = typeof TABS[number]["key"];

export default function AnalyticsPage() {
  const [active, setActive] = useState<TabKey>("carbon");
  const current = TABS.find((t) => t.key === active)!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-muted text-sm font-medium mb-1">
          <FlaskConical className="w-4 h-4" /> Analytics
        </div>
        <h1 className="text-2xl font-bold text-foreground">Data & Analytics</h1>
        <p className="text-muted text-sm mt-1">
          Deep-dive into carbon sequestration, ecosystem economics, environmental correlations, and data exports.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(({ key, label, icon: Icon, activeBg, color }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
              active === key
                ? `${activeBg} shadow-sm`
                : "bg-white border-border text-muted hover:text-foreground"
            }`}
          >
            <Icon className={`w-4 h-4 ${active === key ? "" : color}`} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab description */}
      <div className="flex items-center gap-2 text-sm text-muted">
        <current.icon className={`w-4 h-4 ${current.color}`} />
        <span>{current.description}</span>
      </div>

      {/* Tab content */}
      <div>
        {active === "carbon"       && <CarbonTab />}
        {active === "economic"     && <EconomicTab />}
        {active === "correlations" && <CorrelationTab />}
        {active === "downloads"    && <DownloadTab />}
      </div>
    </div>
  );
}
