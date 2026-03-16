'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';

interface Supplier {
  id: string;
  supplierName: string;
  supplierCode: string | null;
  primaryEmail: string | null;
  notes: string | null;
}

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get<Supplier[]>('/suppliers'),
  });

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: { supplierName: string; primaryEmail?: string }) =>
      api.post('/suppliers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setShowForm(false);
      setName('');
      setEmail('');
    },
  });

  if (isLoading) return <div className="animate-pulse">Laster leverandører...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Leverandører</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Ny leverandør
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({ supplierName: name, primaryEmail: email || undefined });
          }}
          className="bg-white p-4 rounded shadow mb-6 flex gap-4"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Leverandørnavn"
            className="border rounded px-3 py-2 flex-1"
            required
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-post"
            type="email"
            className="border rounded px-3 py-2 flex-1"
          />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Lagre
          </button>
        </form>
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3">Navn</th>
              <th className="text-left px-4 py-3">Kode</th>
              <th className="text-left px-4 py-3">E-post</th>
              <th className="text-left px-4 py-3">Notater</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{s.supplierName}</td>
                <td className="px-4 py-3 text-gray-500">{s.supplierCode || '-'}</td>
                <td className="px-4 py-3">{s.primaryEmail || '-'}</td>
                <td className="px-4 py-3 text-gray-500">{s.notes || '-'}</td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Ingen leverandører ennå</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
