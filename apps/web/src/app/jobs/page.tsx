'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import { StatusBadge } from '@/components/status-badge';

interface Job {
  id: string;
  importBatchId: string;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  totalBlogPosts: number;
  totalLinks: number;
  totalFlightSearches: number;
  createdAt: string;
}

export default function JobsPage() {
  const queryClient = useQueryClient();
  const [batchId, setBatchId] = useState('');

  const createMutation = useMutation({
    mutationFn: (importBatchId: string) =>
      api.post<Job>('/jobs', { importBatchId, autoGenerateReports: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setBatchId('');
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Jobber</h1>

      <div className="bg-white rounded shadow p-4 mb-6">
        <h2 className="font-semibold mb-2">Start ny jobb</h2>
        <div className="flex gap-4">
          <input
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            placeholder="Import Batch ID"
            className="border rounded px-3 py-2 flex-1"
          />
          <button
            onClick={() => createMutation.mutate(batchId)}
            disabled={!batchId || createMutation.isPending}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Start jobb
          </button>
        </div>
        {createMutation.isError && (
          <p className="text-red-600 text-sm mt-2">{createMutation.error.message}</p>
        )}
      </div>

      <p className="text-gray-500 text-sm">Jobbhistorikk vises her når jobber er startet.</p>
    </div>
  );
}
