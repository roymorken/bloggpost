'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/status-badge';

interface QueueCount {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

interface PipelineJob {
  id: string;
  status: string;
  totalBlogPosts: number;
  totalLinks: number;
  totalFlightSearches: number;
  startedAt: string | null;
  finishedAt: string | null;
}

interface UrlCheck {
  id: string;
  url: string;
  status: string;
  httpStatus: number | null;
  responseTimeMs: number | null;
  checkedAt: string;
  supplierName: string;
}

interface LinkExtraction {
  id: string;
  url: string;
  anchorText: string | null;
  status: string;
  checkedAt: string;
}

interface LandingPage {
  id: string;
  status: string;
  durationSeconds: number;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
}

interface FlightSearch {
  id: string;
  route: string;
  price: string | null;
  status: string;
  capturedAt: string;
  error: string | null;
}

interface ReportEntry {
  id: string;
  type: string;
  scope: string;
  supplierName: string;
  generatedAt: string;
  hasFile: boolean;
}

interface EmailEntry {
  id: string;
  to: string[];
  subject: string;
  status: string;
  supplierName: string | null;
  sentAt: string | null;
  error: string | null;
}

interface PipelineStatus {
  queues: QueueCount[];
  jobs: PipelineJob[];
  stages: {
    urlChecks: UrlCheck[];
    linkExtraction: LinkExtraction[];
    landingPages: LandingPage[];
    flightSearches: FlightSearch[];
    reports: ReportEntry[];
    emails: EmailEntry[];
  };
}

const QUEUE_LABELS: Record<string, string> = {
  'url-check': 'URL Check',
  'link-extraction': 'Link Extraction',
  'landing-page': 'Landing Page Browse',
  'flight-search': 'Flight Search',
};

export default function LiveMonitorPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['pipeline-status'],
    queryFn: () => api.get<PipelineStatus>('/pipeline/status'),
    refetchInterval: 3000,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/emails/${id}/approve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pipeline-status'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.post(`/emails/${id}/reject`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pipeline-status'] }),
  });

  if (isLoading) return <div className="animate-pulse">Loading pipeline...</div>;

  const stages = data?.stages;
  const hasActivity = data && (
    data.queues.some((q) => q.active > 0 || q.waiting > 0) ||
    data.jobs.some((j) => j.status === 'running')
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Live Pipeline Monitor</h1>
        {hasActivity && (
          <span className="flex items-center gap-2 text-sm text-green-600">
            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            Processing
          </span>
        )}
      </div>

      {/* Queue overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {data?.queues.map((q) => (
          <div key={q.name} className="bg-white rounded shadow p-4">
            <div className="text-xs text-gray-500 mb-1">{QUEUE_LABELS[q.name] || q.name}</div>
            <div className="flex items-baseline gap-3">
              {q.active > 0 && (
                <span className="text-blue-600 font-bold text-lg">{q.active} active</span>
              )}
              {q.waiting > 0 && (
                <span className="text-yellow-600 text-sm">{q.waiting} waiting</span>
              )}
              {q.active === 0 && q.waiting === 0 && (
                <span className="text-gray-400 text-sm">Idle</span>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {q.completed} done · {q.failed} failed
            </div>
          </div>
        ))}
      </div>

      {/* Jobs */}
      {data?.jobs && data.jobs.length > 0 && (
        <Section title="Jobs">
          {data.jobs.map((j) => (
            <div key={j.id} className="flex items-center gap-4 py-2 border-b text-sm">
              <span className="font-mono text-xs w-20">{j.id.slice(0, 8)}</span>
              <StatusBadge status={j.status} />
              <span>{j.totalBlogPosts} posts</span>
              <span className="text-gray-400">{j.totalLinks} links</span>
              <span className="text-gray-400">{j.totalFlightSearches} searches</span>
              {j.status === 'running' && (
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              )}
            </div>
          ))}
        </Section>
      )}

      {/* 1. URL Checks */}
      {stages?.urlChecks && stages.urlChecks.length > 0 && (
        <Section title="1. URL Checks" count={stages.urlChecks.length}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-3 py-2">Time</th>
                <th className="text-left px-3 py-2">Supplier</th>
                <th className="text-left px-3 py-2">URL</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">HTTP</th>
                <th className="text-left px-3 py-2">ms</th>
              </tr>
            </thead>
            <tbody>
              {stages.urlChecks.map((c) => (
                <tr key={c.id} className={`border-b ${c.status !== 'active' && c.status !== 'redirected' ? 'bg-red-50' : ''}`}>
                  <td className="px-3 py-1.5 text-xs text-gray-500 whitespace-nowrap">{fmt(c.checkedAt)}</td>
                  <td className="px-3 py-1.5 font-medium">{c.supplierName}</td>
                  <td className="px-3 py-1.5 max-w-xs truncate">
                    <a href={c.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{trunc(c.url, 50)}</a>
                  </td>
                  <td className="px-3 py-1.5"><StatusBadge status={c.status} /></td>
                  <td className="px-3 py-1.5 font-mono">{c.httpStatus ?? '-'}</td>
                  <td className="px-3 py-1.5 font-mono">{c.responseTimeMs ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* 2. Link Extraction */}
      {stages?.linkExtraction && stages.linkExtraction.length > 0 && (
        <Section title="2. Link Extraction" count={stages.linkExtraction.length}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-3 py-2">Time</th>
                <th className="text-left px-3 py-2">Link URL</th>
                <th className="text-left px-3 py-2">Anchor</th>
                <th className="text-left px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {stages.linkExtraction.map((l) => (
                <tr key={l.id} className="border-b">
                  <td className="px-3 py-1.5 text-xs text-gray-500 whitespace-nowrap">{fmt(l.checkedAt)}</td>
                  <td className="px-3 py-1.5 max-w-sm truncate">
                    <a href={l.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{trunc(l.url, 50)}</a>
                  </td>
                  <td className="px-3 py-1.5 text-gray-500">{l.anchorText || '-'}</td>
                  <td className="px-3 py-1.5"><StatusBadge status={l.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* 3. Landing Page Browse */}
      {stages?.landingPages && stages.landingPages.length > 0 && (
        <Section title="3. Landing Page Browse" count={stages.landingPages.length}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-3 py-2">Started</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Duration</th>
                <th className="text-left px-3 py-2">Error</th>
              </tr>
            </thead>
            <tbody>
              {stages.landingPages.map((s) => (
                <tr key={s.id} className={`border-b ${s.status === 'browsing' ? 'bg-blue-50' : ''}`}>
                  <td className="px-3 py-1.5 text-xs text-gray-500 whitespace-nowrap">{s.startedAt ? fmt(s.startedAt) : '-'}</td>
                  <td className="px-3 py-1.5">
                    <StatusBadge status={s.status} />
                    {s.status === 'browsing' && <span className="ml-1 w-2 h-2 inline-block rounded-full bg-blue-500 animate-pulse" />}
                  </td>
                  <td className="px-3 py-1.5 font-mono">{s.durationSeconds}s</td>
                  <td className="px-3 py-1.5 text-red-500 text-xs truncate max-w-xs">{s.error || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* 4. Flight Search */}
      {stages?.flightSearches && stages.flightSearches.length > 0 && (
        <Section title="4. Flight Search" count={stages.flightSearches.length}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-3 py-2">Time</th>
                <th className="text-left px-3 py-2">Route</th>
                <th className="text-left px-3 py-2">Price</th>
                <th className="text-left px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {stages.flightSearches.map((f) => (
                <tr key={f.id} className="border-b">
                  <td className="px-3 py-1.5 text-xs text-gray-500 whitespace-nowrap">{fmt(f.capturedAt)}</td>
                  <td className="px-3 py-1.5 font-mono">{f.route}</td>
                  <td className="px-3 py-1.5 font-semibold">{f.price || '-'}</td>
                  <td className="px-3 py-1.5"><StatusBadge status={f.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* 5. Reports */}
      {stages?.reports && stages.reports.length > 0 && (
        <Section title="5. Reports" count={stages.reports.length}>
          {stages.reports.map((r) => (
            <div key={r.id} className="flex items-center gap-4 py-2 border-b text-sm">
              <span className="font-mono text-xs">{r.id.slice(0, 8)}</span>
              <span className="font-medium">{r.supplierName}</span>
              <span className="text-gray-500">{r.scope} / {r.type}</span>
              <span className="text-gray-400 text-xs">{fmt(r.generatedAt)}</span>
              {r.hasFile && <span className="text-green-600 text-xs">PDF ready</span>}
            </div>
          ))}
        </Section>
      )}

      {/* 6. Emails — with approval buttons */}
      {stages?.emails && stages.emails.length > 0 && (
        <Section title="6. Emails" count={stages.emails.length}>
          {stages.emails.map((e) => (
            <div key={e.id} className={`flex items-center gap-4 py-3 border-b text-sm ${e.status === 'awaiting_approval' ? 'bg-yellow-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{e.subject}</div>
                <div className="text-xs text-gray-500">
                  To: {e.to.join(', ')} {e.supplierName && `· ${e.supplierName}`}
                </div>
              </div>
              <StatusBadge status={e.status} />
              {e.sentAt && <span className="text-xs text-gray-400">{fmt(e.sentAt)}</span>}
              {e.error && <span className="text-xs text-red-500">{e.error}</span>}
              {e.status === 'awaiting_approval' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => approveMutation.mutate(e.id)}
                    disabled={approveMutation.isPending}
                    className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve & Send
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(e.id)}
                    disabled={rejectMutation.isPending}
                    className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Empty state */}
      {!data?.jobs.length && (
        <div className="text-center text-gray-400 py-12">
          No pipeline activity yet. Import a file and start a job to see live progress.
        </div>
      )}
    </div>
  );
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded shadow overflow-hidden mb-6">
      <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
        <h2 className="font-semibold">{title}</h2>
        {count !== undefined && <span className="text-xs text-gray-400">({count})</span>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function fmt(date: string) {
  return new Date(date).toLocaleTimeString();
}

function trunc(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + '...' : s;
}
