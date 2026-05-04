import Link from "next/link";
import { Leaf, Map, TrendingDown, AlertTriangle, Activity, Info, ArrowRight, FlaskConical } from "lucide-react";
import StatCard from "@/components/stat-card";
import CoverageChart from "@/components/coverage-chart";

const QUICK_LINKS = [
  {
    href: "/map",
    icon: Map,
    title: "Interactive Map",
    desc: "Explore mangrove coverage over the Vasai–Konkan coastline with year-by-year overlays.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    href: "/changes",
    icon: TrendingDown,
    title: "Change Detection",
    desc: "View loss/gain maps and temporal trends across 2020–2025.",
    color: "bg-accent-light text-accent",
  },
  {
    href: "/risk",
    icon: AlertTriangle,
    title: "Risk Analysis",
    desc: "Probability heatmap and zone classification for the entire study region.",
    color: "bg-warning-light text-warning",
  },
  {
    href: "/analytics",
    icon: FlaskConical,
    title: "Analytics",
    desc: "Carbon sequestration value, economic impact, correlations, and data downloads.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    href: "/predict",
    icon: Activity,
    title: "Predict Risk",
    desc: "Enter site-specific parameters to get an instant ML-powered risk prediction.",
    color: "bg-teal-light text-teal",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-accent-light via-white to-teal-light border border-border p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-accent text-sm font-semibold">
            <Leaf className="w-4 h-4" />
            Vasai–Konkan Coast, Maharashtra
          </div>
          <h1 className="text-3xl font-bold text-foreground leading-tight">
            Mangrove Monitor
          </h1>
          <p className="text-muted max-w-xl text-sm leading-relaxed">
            Satellite-driven ML system tracking mangrove coverage, detecting change, and predicting ecosystem risk
            along 400 km of Maharashtra&apos;s Konkan coastline (2020–2025).
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {["GMW v3.0", "XGBoost + SMOTE", "2020–2025", "256×256 px"].map((tag) => (
              <span key={tag} className="text-xs bg-white border border-border text-muted px-2.5 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <Link href="/predict" className="btn-primary flex items-center gap-2 self-start md:self-center whitespace-nowrap">
          Try Prediction <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Mangrove Coverage 2025"
          value="22.1%"
          sub="14,478 px of 65,536 total"
          icon={<Leaf className="w-4 h-4" />}
          color="green"
        />
        <StatCard
          label="5-Year Net Change"
          value="−0.19%"
          sub="−55 pixels 2020→2025"
          icon={<TrendingDown className="w-4 h-4" />}
          color="yellow"
        />
        <StatCard
          label="High-Risk Area"
          value="0.2%"
          sub="120 pixels flagged critical"
          icon={<AlertTriangle className="w-4 h-4" />}
          color="red"
        />
        <StatCard
          label="Model Accuracy"
          value="95%"
          sub="ROC-AUC: 0.906"
          icon={<Info className="w-4 h-4" />}
          color="blue"
        />
      </div>

      {/* Coverage chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Coverage Trend (2020–2025)</h2>
          <Link href="/changes" className="text-sm text-accent hover:underline">
            View changes →
          </Link>
        </div>
        <CoverageChart />
      </div>

      {/* Quick links */}
      <div>
        <h2 className="section-title mb-4">Explore</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_LINKS.map(({ href, icon: Icon, title, desc, color }) => (
            <Link
              key={href}
              href={href}
              className="card hover:shadow-card-hover transition-shadow duration-200 group flex flex-col gap-3"
            >
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </span>
              <div>
                <p className="font-semibold text-foreground text-sm group-hover:text-accent transition-colors">{title}</p>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">{desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors mt-auto" />
            </Link>
          ))}
        </div>
      </div>

      {/* Pipeline overview */}
      <div className="card">
        <h2 className="section-title mb-4">Analysis Pipeline</h2>
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { step: "01", title: "Change Detection", desc: "Annual mangrove maps from Global Mangrove Watch v3.0 (JAXA), with year-on-year loss tracking." },
            { step: "02", title: "Feature Engineering", desc: "9 geospatial features: NDVI trend, urban/coast/aquaculture distance, elevation, fragmentation, and more." },
            { step: "03", title: "Risk Prediction", desc: "XGBoost with SMOTE and spatial block CV predicts per-pixel loss probability with SHAP explainability." },
            { step: "04", title: "Visualisation", desc: "Interactive maps, transparent overlays, charts, and actionable risk zone outputs." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex flex-col gap-2">
              <span className="text-2xl font-bold text-accent-light">{step}</span>
              <p className="font-semibold text-sm text-foreground">{title}</p>
              <p className="text-xs text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
