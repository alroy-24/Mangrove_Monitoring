import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  color?: "green" | "yellow" | "red" | "blue" | "default";
}

const colorMap = {
  green:   "bg-accent-light text-accent",
  yellow:  "bg-warning-light text-warning",
  red:     "bg-danger-light text-danger",
  blue:    "bg-blue-50 text-blue-600",
  default: "bg-gray-100 text-muted",
};

export default function StatCard({ label, value, sub, icon, color = "default" }: StatCardProps) {
  return (
    <div className="card flex flex-col gap-3 hover:shadow-card-hover transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <span className="label">{label}</span>
        {icon && (
          <span className={`p-2 rounded-lg ${colorMap[color]}`}>{icon}</span>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
        {sub && <p className="text-sm text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
