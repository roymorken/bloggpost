import { clsx } from 'clsx';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  not_found: 'bg-red-100 text-red-700',
  redirected: 'bg-yellow-100 text-yellow-700',
  timeout: 'bg-orange-100 text-orange-700',
  server_error: 'bg-red-100 text-red-700',
  unknown_error: 'bg-gray-100 text-gray-700',
  blocked: 'bg-purple-100 text-purple-700',
  pending: 'bg-blue-100 text-blue-700',
  no_search_form: 'bg-gray-100 text-gray-600',
  price_found: 'bg-green-100 text-green-700',
  price_not_found: 'bg-yellow-100 text-yellow-700',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktiv',
  not_found: '404',
  redirected: 'Redirect',
  timeout: 'Timeout',
  server_error: 'Serverfeil',
  unknown_error: 'Ukjent feil',
  blocked: 'Blokkert',
  pending: 'Venter',
  no_search_form: 'Ingen søkeform',
  price_found: 'Pris funnet',
  price_not_found: 'Pris ikke funnet',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', STATUS_COLORS[status] || 'bg-gray-100 text-gray-700')}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
