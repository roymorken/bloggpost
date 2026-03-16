'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState, useRef } from 'react';

interface ImportResult {
  importBatchId?: string;
  rowCount: number;
  status: string;
  errors?: string[];
}

export default function ImportsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.upload<ImportResult>('/imports', file),
    onSuccess: (data) => setResult(data),
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
    </div>
  );
}
