'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';

interface Report {
  id: string;
  jobId: string;
  supplierId: string | null;
  reportType: string;
  reportScope: string;
  filePath: string | null;
  generatedAt: string;
}

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [reportType, setReportType] = useState('summary');

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get<{ id: string; supplierName: string }[]>('/suppliers'),
  });

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => api.get<Report[]>('/reports'),
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      api.post('/reports', {
        jobId,
        supplierId: supplierId || undefined,
        reportType,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setJobId('');
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Rapporter</h1>

      <div className="bg-white rounded shadow p-4 mb-6">
        <h2 className="font-semibold mb-3">Generer ny rapport</h2>
        <div className="flex gap-4 flex-wrap">
          <input
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            placeholder="Job ID"
            className="border rounded px-3 py-2"
          />
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="border rounded px-3 py-2">
            <option value="">Alle leverandører (samlet)</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.supplierName}</option>)}
          </select>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="border rounded px-3 py-2">
            <option value="summary">Sammendrag</option>
            <option value="supplier-summary">Leverandørrapport</option>
            <option value="internal-detail">Intern detaljert</option>
            <option value="supplier-friendly">Leverandørvennlig</option>
          </select>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={!jobId || generateMutation.isPending}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Generer
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse">Laster...</div>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3">Rapport ID</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Scope</th>
                <th className="text-left px-4 py-3">Generert</th>
                <th className="text-left px-4 py-3">Last ned</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{r.id.slice(0, 8)}</td>
                  <td className="px-4 py-3">{r.reportType}</td>
                  <td className="px-4 py-3">{r.reportScope}</td>
                  <td className="px-4 py-3">{new Date(r.generatedAt).toLocaleString('no-NO')}</td>
                  <td className="px-4 py-3">
                    {r.filePath ? (
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/reports/${r.id}/download`}
                        className="text-blue-600 hover:underline"
                      >
                        Last ned PDF
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Ingen rapporter ennå</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
