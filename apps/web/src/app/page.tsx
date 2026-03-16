'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface DashboardSummary {
  totalSuppliers: number;
  totalBlogPosts: number;
  activeBlogPosts: number;
  notFoundBlogPosts: number;
  brokenLinks: number;
  recentPrices: { id: string; origin: string; destination: string; priceAmount: string | null; currency: string | null; capturedAt: string }[];
  recentJobs: { id: string; status: string; totalBlogPosts: number; createdAt: string }[];
}

export default function DashboardPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardSummary>('/dashboard/summary'),
    refetchInterval: 10_000,
  });

  if (isLoading) return <div className="animate-pulse">Laster dashboard...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="Leverandører" value={summary?.totalSuppliers ?? 0} />
        <StatCard label="Bloggposter" value={summary?.totalBlogPosts ?? 0} />
        <StatCard label="Aktive" value={summary?.activeBlogPosts ?? 0} color="green" />
        <StatCard label="404" value={summary?.notFoundBlogPosts ?? 0} color="red" />
        <StatCard label="Ødelagte lenker" value={summary?.brokenLinks ?? 0} color="red" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-3">Siste jobber</h2>
          {summary?.recentJobs && summary.recentJobs.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {summary.recentJobs.map((j) => (
                <li key={j.id} className="flex justify-between items-center py-1 border-b">
                  <span className="font-mono text-xs">{j.id.slice(0, 8)}</span>
                  <span className={j.status === 'completed' ? 'text-green-600' : j.status === 'running' ? 'text-blue-600' : 'text-gray-500'}>
                    {j.status}
                  </span>
                  <span className="text-gray-400">{new Date(j.createdAt).toLocaleString('no-NO')}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">Ingen jobber ennå</p>
          )}
        </div>

        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold mb-3">Siste priser</h2>
          {summary?.recentPrices && summary.recentPrices.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {summary.recentPrices.map((p) => (
                <li key={p.id} className="flex justify-between items-center py-1 border-b">
                  <span className="font-mono">{p.origin}→{p.destination}</span>
                  <span className="font-semibold">
                    {p.priceAmount ? `${parseFloat(p.priceAmount).toLocaleString('no-NO')} ${p.currency}` : '-'}
                  </span>
                  <span className="text-gray-400 text-xs">{new Date(p.capturedAt).toLocaleString('no-NO')}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">Ingen priser ennå</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  const colorClass = color === 'green' ? 'text-green-600' : color === 'red' ? 'text-red-600' : 'text-gray-900';
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`text-3xl font-bold ${colorClass}`}>{value}</div>
    </div>
  );
}
