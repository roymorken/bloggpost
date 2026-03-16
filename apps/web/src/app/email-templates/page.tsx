'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';

interface EmailTemplate {
  id: string;
  templateName: string;
  scope: string;
  subjectTemplate: string;
  bodyTemplate: string;
  updatedAt: string;
}

export default function EmailTemplatesPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => api.get<EmailTemplate[]>('/email-templates'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; subjectTemplate: string; bodyTemplate: string }) =>
      api.patch(`/email-templates/${data.id}`, {
        subjectTemplate: data.subjectTemplate,
        bodyTemplate: data.bodyTemplate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      setEditingId(null);
    },
  });

  const startEdit = (template: EmailTemplate) => {
    setEditingId(template.id);
    setEditSubject(template.subjectTemplate);
    setEditBody(template.bodyTemplate);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">E-postmaler</h1>

      <div className="mb-4 bg-blue-50 border border-blue-200 rounded p-4 text-sm">
        <strong>Tilgjengelige variabler:</strong>{' '}
        <code>{'{{supplierName}}'}</code>, <code>{'{{reportDate}}'}</code>,{' '}
        <code>{'{{activeCount}}'}</code>, <code>{'{{errorCount}}'}</code>,{' '}
        <code>{'{{notFoundCount}}'}</code>, <code>{'{{lowestPrice}}'}</code>,{' '}
        <code>{'{{highestPrice}}'}</code>
      </div>

      {isLoading ? (
        <div className="animate-pulse">Laster...</div>
      ) : (
        <div className="space-y-4">
          {templates.map((t) => (
            <div key={t.id} className="bg-white rounded shadow p-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="font-semibold">{t.templateName}</h3>
                  <span className="text-xs text-gray-500">Scope: {t.scope}</span>
                </div>
                {editingId !== t.id && (
                  <button
                    onClick={() => startEdit(t)}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    Rediger
                  </button>
                )}
              </div>

              {editingId === t.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Emne</label>
                    <input
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Innhold</label>
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={8}
                      className="w-full border rounded px-3 py-2 font-mono text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateMutation.mutate({ id: t.id, subjectTemplate: editSubject, bodyTemplate: editBody })}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Lagre
                    </button>
                    <button onClick={() => setEditingId(null)} className="px-4 py-2 border rounded hover:bg-gray-100">
                      Avbryt
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm"><strong>Emne:</strong> {t.subjectTemplate}</p>
                  <pre className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                    {t.bodyTemplate}
                  </pre>
                </div>
              )}
            </div>
          ))}
          {templates.length === 0 && (
            <p className="text-gray-400 text-center py-8">Ingen maler ennå</p>
          )}
        </div>
      )}
    </div>
  );
}
