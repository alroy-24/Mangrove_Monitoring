"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const data = [
  { year: 2020, coverage: 22.1 },
  { year: 2021, coverage: 22.2 },
  { year: 2023, coverage: 22.3 },
  { year: 2025, coverage: 22.1 },
];

export default function CoverageChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="covGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#16A34A" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
        <YAxis
          domain={[21.8, 22.5]}
          tick={{ fontSize: 12, fill: "#64748B" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{ border: "1px solid #E2E8F0", borderRadius: "8px", fontSize: 13 }}
          formatter={(v) => [`${v}%`, "Coverage"]}
        />
        <Area
          type="monotone"
          dataKey="coverage"
          stroke="#16A34A"
          strokeWidth={2.5}
          fill="url(#covGrad)"
          dot={{ fill: "#16A34A", strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
