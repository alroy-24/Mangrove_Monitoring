"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { PieLabelRenderProps } from "recharts";

const data = [
  { name: "Low Risk",    value: 96.8, color: "#16A34A" },
  { name: "Medium Risk", value: 3.1,  color: "#D97706" },
  { name: "High Risk",   value: 0.2,  color: "#DC2626" },
];

const RADIAN = Math.PI / 180;
function renderLabel(props: PieLabelRenderProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if ((percent ?? 0) < 0.05) return null;
  const r = (Number(innerRadius) + Number(outerRadius)) * 0.5;
  const x = Number(cx) + r * Math.cos(-Number(midAngle) * RADIAN);
  const y = Number(cy) + r * Math.sin(-Number(midAngle) * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${((percent ?? 0) * 100).toFixed(1)}%`}
    </text>
  );
}

export default function RiskDonut() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          dataKey="value"
          labelLine={false}
          label={renderLabel}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ border: "1px solid #E2E8F0", borderRadius: "8px", fontSize: 13 }}
          formatter={(v) => [`${v}%`]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
