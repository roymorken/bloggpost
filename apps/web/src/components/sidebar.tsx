'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard' },
  { href: '/suppliers', label: 'Leverandører' },
  { href: '/imports', label: 'Import' },
  { href: '/blog-posts', label: 'Bloggposter' },
  { href: '/links', label: 'Lenker' },
  { href: '/flight-prices', label: 'Flypriser' },
  { href: '/reports', label: 'Rapporter' },
  { href: '/email-templates', label: 'E-postmaler' },
  { href: '/jobs', label: 'Jobber' },
  { href: '/live', label: 'Live Monitor' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-bold text-lg">Bloggpost Monitor</h2>
      </div>
      <nav className="flex-1 py-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'block px-4 py-2 text-sm hover:bg-gray-100',
              pathname === item.href && 'bg-blue-50 text-blue-700 font-medium',
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
