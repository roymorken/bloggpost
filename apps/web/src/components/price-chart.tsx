'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PriceDataPoint {
  date: string;
  route: string;
  price: number;
  currency: string;
}

const ROUTE_COLORS: Record<string, string> = {
  'NYC→BOS': '#2563eb',
  'NYC→MIA': '#16a34a',
  'NYC→LAX': '#dc2626',
  'WAS→PAR': '#9333ea',
};

export function PriceChart({ data }: { data: PriceDataPoint[] }) {
  // Group by date, with separate keys per route
  const routes = [...new Set(data.map((d) => d.route))];
  const dateMap = new Map<string, Record<string, number>>();

  for (const point of data) {
    const existing = dateMap.get(point.date) || {};
    existing[point.route] = point.price;
    dateMap.set(point.date, existing);
  }

  const chartData = Array.from(dateMap.entries())
    .map(([date, values]) => ({ date, ...values }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (chartData.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Legend />
        {routes.map((route) => (
          <Line
            key={route}
            type="monotone"
            dataKey={route}
            stroke={ROUTE_COLORS[route] || '#666'}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
