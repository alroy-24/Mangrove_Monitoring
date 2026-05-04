"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

const data = [
  { period: "2020→2021", loss: -312, gain: 324 },
  { period: "2021→2023", loss: -285, gain: 353 },
  { period: "2023→2025", loss: -398, gain: 263 },
];

export default function ChangeChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="period" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.abs(v)}px`} />
        <Tooltip
          contentStyle={{ border: "1px solid #E2E8F0", borderRadius: "8px", fontSize: 13 }}
          formatter={(v) => [`${Math.abs(Number(v))} pixels`]}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <ReferenceLine y={0} stroke="#E2E8F0" />
        <Bar dataKey="gain" name="Gain" fill="#16A34A" radius={[4, 4, 0, 0]} />
        <Bar dataKey="loss" name="Loss" fill="#DC2626" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
