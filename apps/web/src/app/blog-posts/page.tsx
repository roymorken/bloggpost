'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import { StatusBadge } from '@/components/status-badge';

interface BlogPostCheck {
  id: string;
  originalUrl: string;
  finalUrl: string | null;
  httpStatus: number | null;
  statusCategory: string;
  responseTimeMs: number | null;
  checkedAt: string;
  errorMessage: string | null;
  blogPost: {
    id: string;
    blogPostUrl: string;
    supplier: { id: string; supplierName: string };
  };
}

interface PaginatedResponse {
  data: BlogPostCheck[];
  total: number;
  page: number;
  pageSize: number;
}

export default function BlogPostsPage() {
  const [supplierId, setSupplierId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get<{ id: string; supplierName: string }[]>('/suppliers'),
  });

  const params = new URLSearchParams();
  if (supplierId) params.set('supplierId', supplierId);
  if (statusFilter) params.set('statusCategory', statusFilter);
  params.set('page', String(page));
  params.set('pageSize', '50');

  const { data, isLoading } = useQuery({
    queryKey: ['blog-post-checks', supplierId, statusFilter, page],
    queryFn: () => api.get<PaginatedResponse>(`/blog-post-checks?${params}`),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Bloggpoststatus</h1>

      <div className="flex gap-4 mb-4">
        <select value={supplierId} onChange={(e) => { setSupplierId(e.target.value); setPage(1); }} className="border rounded px-3 py-2">
          <option value="">Alle leverandører</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.supplierName}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="border rounded px-3 py-2">
          <option value="">Alle statuser</option>
          <option value="active">Aktiv</option>
          <option value="not_found">404</option>
          <option value="redirected">Redirect</option>
          <option value="timeout">Timeout</option>
          <option value="server_error">Serverfeil</option>
        </select>
      </div>

      {isLoading ? (
        <div className="animate-pulse">Laster...</div>
      ) : (
        <>
          <div className="bg-white rounded shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3">Leverandør</th>
                  <th className="text-left px-4 py-3">URL</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">HTTP</th>
                  <th className="text-left px-4 py-3">Responstid</th>
                  <th className="text-left px-4 py-3">Sjekket</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((check) => (
                  <tr key={check.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{check.blogPost?.supplier?.supplierName}</td>
                    <td className="px-4 py-3 max-w-xs truncate">
                      <a href={check.originalUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                        {check.originalUrl}
                      </a>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={check.statusCategory} /></td>
                    <td className="px-4 py-3">{check.httpStatus ?? '-'}</td>
                    <td className="px-4 py-3">{check.responseTimeMs ? `${check.responseTimeMs}ms` : '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(check.checkedAt).toLocaleString('no-NO')}</td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Ingen sjekker ennå</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {data && data.total > data.pageSize && (
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-30">Forrige</button>
              <span className="px-3 py-1">Side {page} av {Math.ceil(data.total / data.pageSize)}</span>
              <button onClick={() => setPage(page + 1)} disabled={page * data.pageSize >= data.total} className="px-3 py-1 border rounded disabled:opacity-30">Neste</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
