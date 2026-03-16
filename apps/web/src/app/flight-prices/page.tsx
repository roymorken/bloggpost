'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import { StatusBadge } from '@/components/status-badge';
import { PriceChart } from '@/components/price-chart';

interface FlightResult {
  id: string;
  origin: string;
  destination: string;
  departDate: string;
  returnDate: string;
  priceAmount: string | null;
  currency: string | null;
  providerName: string | null;
  status: string;
  capturedAt: string;
  landingPageUrl: string | null;
  supplier: { id: string; supplierName: string };
  blogPost: { id: string; blogPostUrl: string };
}

interface PaginatedResponse {
  data: FlightResult[];
  total: number;
  page: number;
  pageSize: number;
}

const ROUTES = ['', 'NYC-BOS', 'NYC-MIA', 'NYC-LAX', 'WAS-PAR'];

export default function FlightPricesPage() {
  const [supplierId, setSupplierId] = useState('');
  const [route, setRoute] = useState('');
  const [page, setPage] = useState(1);
  const [showChart, setShowChart] = useState(true);

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get<{ id: string; supplierName: string }[]>('/suppliers'),
  });

  const params = new URLSearchParams();
  if (supplierId) params.set('supplierId', supplierId);
  if (route) params.set('route', route);
  params.set('page', String(page));
  params.set('pageSize', '50');

  const { data, isLoading } = useQuery({
    queryKey: ['flight-prices', supplierId, route, page],
    queryFn: () => api.get<PaginatedResponse>(`/flight-prices?${params}`),
  });

  const priceData = (data?.data || [])
    .filter((r) => r.priceAmount !== null)
    .map((r) => ({
      date: new Date(r.capturedAt).toLocaleDateString('no-NO'),
      route: `${r.origin}→${r.destination}`,
      price: parseFloat(r.priceAmount!),
      currency: r.currency || 'USD',
    }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Flypriser</h1>

      <div className="flex gap-4 mb-4 items-center">
        <select value={supplierId} onChange={(e) => { setSupplierId(e.target.value); setPage(1); }} className="border rounded px-3 py-2">
          <option value="">Alle leverandører</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.supplierName}</option>)}
        </select>
        <select value={route} onChange={(e) => { setRoute(e.target.value); setPage(1); }} className="border rounded px-3 py-2">
          <option value="">Alle ruter</option>
          {ROUTES.filter(Boolean).map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button
          onClick={() => setShowChart(!showChart)}
          className="ml-auto px-3 py-2 border rounded hover:bg-gray-100"
        >
          {showChart ? 'Skjul graf' : 'Vis graf'}
        </button>
      </div>

      {showChart && priceData.length > 0 && (
        <div className="bg-white rounded shadow p-4 mb-6">
          <h2 className="font-semibold mb-4">Prishistorikk</h2>
          <PriceChart data={priceData} />
        </div>
      )}

      {isLoading ? (
        <div className="animate-pulse">Laster...</div>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3">Leverandør</th>
                <th className="text-left px-4 py-3">Rute</th>
                <th className="text-left px-4 py-3">Avreise</th>
                <th className="text-left px-4 py-3">Retur</th>
                <th className="text-right px-4 py-3">Pris</th>
                <th className="text-left px-4 py-3">Valuta</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Innhentet</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{r.supplier?.supplierName}</td>
                  <td className="px-4 py-3 font-mono">{r.origin}→{r.destination}</td>
                  <td className="px-4 py-3">{r.departDate}</td>
                  <td className="px-4 py-3">{r.returnDate}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {r.priceAmount ? parseFloat(r.priceAmount).toLocaleString('no-NO', { minimumFractionDigits: 2 }) : '-'}
                  </td>
                  <td className="px-4 py-3">{r.currency || '-'}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{new Date(r.capturedAt).toLocaleString('no-NO')}</td>
                </tr>
              ))}
              {data?.data.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Ingen flypriser ennå</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
