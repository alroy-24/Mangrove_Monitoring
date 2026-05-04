"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const data = [
  { feature: "NDVI Trend",          importance: 26.2 },
  { feature: "Aquaculture Dist.",   importance: 19.8 },
  { feature: "Dist. to Urban",      importance: 17.5 },
  { feature: "Elevation Risk",      importance: 14.2 },
  { feature: "Current Status",      importance: 9.8  },
  { feature: "Fragmentation",       importance: 7.1  },
  { feature: "Dist. to Coast",      importance: 3.4  },
  { feature: "Prev. Loss Count",    importance: 1.4  },
  { feature: "Water Proximity",     importance: 0.6  },
];

const COLORS = ["#16A34A", "#0D9488", "#16A34A", "#0D9488", "#16A34A", "#0D9488", "#64748B", "#94A3B8", "#CBD5E1"];

export default function FeatureImportanceChart() {
  return (
    <ResponsiveContainer width="100%" height={340}>
      <BarChart layout="vertical" data={data} margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 12, fill: "#64748B" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <YAxis
          type="category"
          dataKey="feature"
          tick={{ fontSize: 12, fill: "#64748B" }}
          axisLine={false}
          tickLine={false}
          width={120}
        />
        <Tooltip
          contentStyle={{ border: "1px solid #E2E8F0", borderRadius: "8px", fontSize: 13 }}
          formatter={(v) => [`${v}%`, "Importance"]}
        />
        <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
