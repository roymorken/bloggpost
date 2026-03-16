'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/status-badge';

interface ImportResult {
  importBatchId?: string;
  rowCount: number;
  status: string;
  errors?: string[];
}

interface ImportJob {
  id: string;
  status: string;
  totalBlogPosts: number;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

interface ImportBatch {
  id: string;
  filename: string;
  fileType: string;
  rowCount: number;
  status: string;
  createdAt: string;
  jobs: ImportJob[];
}

export default function ImportsPage() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const { data: batches, isLoading } = useQuery({
    queryKey: ['imports'],
    queryFn: () => api.get<ImportBatch[]>('/imports'),
    refetchInterval: 5000,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.upload<ImportResult>('/imports', file),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['imports'] });
    },
  });

  const handleUpload = () => {
    const file = fileRef.current?.files?.[0];
    if (file) uploadMutation.mutate(file);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Import</h1>

      <div className="bg-white rounded shadow p-6 mb-6">
        <h2 className="font-semibold mb-4">Last opp fil (CSV/XLS/XLSX)</h2>
        <p className="text-sm text-gray-500 mb-4">
          Filen må inneholde kolonnene <code>supplier_name</code> og <code>blog_post_url</code>.
          Valgfrie kolonner: <code>supplier_email</code>, <code>title</code>, <code>date</code>, <code>notes</code>.
        </p>
        <div className="flex gap-4">
          <input ref={fileRef} type="file" accept=".csv,.xls,.xlsx" className="border rounded px-3 py-2" />
          <button
            onClick={handleUpload}
            disabled={uploadMutation.isPending}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {uploadMutation.isPending ? 'Laster opp...' : 'Last opp'}
          </button>
        </div>
      </div>

      {uploadMutation.isError && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-6 text-red-700">
          Feil: {uploadMutation.error.message}
        </div>
      )}

      {result && (
        <div className={`rounded p-4 mb-6 ${result.status === 'validated' ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <h3 className="font-semibold mb-2">
            {result.status === 'validated' ? 'Import vellykket' : 'Valideringsfeil'}
          </h3>
          <p>Rader: {result.rowCount}</p>
          {result.importBatchId && <p>Batch ID: <code>{result.importBatchId}</code></p>}
          {result.errors && result.errors.length > 0 && (
            <ul className="mt-2 list-disc list-inside text-sm">
              {result.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* Import history */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold">Importhistorikk</h2>
        </div>
        {isLoading ? (
          <div className="p-6 text-gray-400">Laster...</div>
        ) : batches && batches.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Fil</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Rader</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Importert</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Jobber</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{batch.filename}</div>
                    <div className="text-xs text-gray-400 font-mono">{batch.id.slice(0, 8)}</div>
                  </td>
                  <td className="px-4 py-3">{batch.rowCount}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={batch.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(batch.createdAt).toLocaleString('no-NO')}
                  </td>
                  <td className="px-4 py-3">
                    {batch.jobs.length > 0 ? (
                      <div className="space-y-1">
                        {batch.jobs.map((job) => (
                          <Link
                            key={job.id}
                            href={`/live`}
                            className="flex items-center gap-2 text-xs hover:underline"
                          >
                            <StatusBadge status={job.status} />
                            <span className="font-mono">{job.id.slice(0, 8)}</span>
                            <span className="text-gray-400">
                              {job.totalBlogPosts} poster
                            </span>
                            {job.status === 'running' && (
                              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            )}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">Ingen jobb startet</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-gray-400 text-sm">Ingen importer ennå</div>
        )}
      </div>
    </div>
  );
}
