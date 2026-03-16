'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import { StatusBadge } from '@/components/status-badge';

interface ExtractedLink {
  id: string;
  anchorText: string | null;
  linkUrl: string;
  finalUrl: string | null;
  httpStatus: number | null;
  statusCategory: string;
  checkedAt: string;
  blogPostCheck: {
    blogPost: {
      blogPostUrl: string;
      supplier: { supplierName: string };
    };
  };
}

interface PaginatedResponse {
  data: ExtractedLink[];
  total: number;
  page: number;
  pageSize: number;
}

export default function LinksPage() {
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

  const { data, isLoading } = useQuery({
    queryKey: ['links', supplierId, statusFilter, page],
    queryFn: () => api.get<PaginatedResponse>(`/links?${params}`),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Lenkestatus</h1>

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
        </select>
      </div>

      {isLoading ? (
        <div className="animate-pulse">Laster...</div>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3">Leverandør</th>
                <th className="text-left px-4 py-3">Bloggpost</th>
                <th className="text-left px-4 py-3">Ankertekst</th>
                <th className="text-left px-4 py-3">Lenke-URL</th>
                <th className="text-left px-4 py-3">Final URL</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">HTTP</th>
                <th className="text-left px-4 py-3">Sjekket</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((link) => (
                <tr key={link.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{link.blogPostCheck?.blogPost?.supplier?.supplierName}</td>
                  <td className="px-4 py-3 max-w-xs truncate">
                    <a href={link.blogPostCheck?.blogPost?.blogPostUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      {link.blogPostCheck?.blogPost?.blogPostUrl}
                    </a>
                  </td>
                  <td className="px-4 py-3">{link.anchorText || '-'}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{link.linkUrl}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{link.finalUrl || '-'}</td>
                  <td className="px-4 py-3"><StatusBadge status={link.statusCategory} /></td>
                  <td className="px-4 py-3">{link.httpStatus ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(link.checkedAt).toLocaleString('no-NO')}</td>
                </tr>
              ))}
              {data?.data.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Ingen lenker ennå</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
