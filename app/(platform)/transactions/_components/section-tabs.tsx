'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChartColumn, List } from 'lucide-react';

import { cn } from 'cn';

const SECTIONS = [
  { href: '/transactions', label: 'Extrato', icon: List },
  { href: '/transactions/insights', label: 'Gráficos', icon: ChartColumn },
] as const;

/**
 * Both halves of Transações are one destination in the sidebar, so the switch
 * between them lives here rather than as a second nav entry — the sidebar
 * collapses to icon width, and two near-identical icons there would read as two
 * unrelated screens.
 */
export function SectionTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Seções de transações" className="flex gap-1 border-b">
      {SECTIONS.map((section) => {
        const isCurrent = pathname === section.href;

        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={isCurrent ? 'page' : undefined}
            className={cn(
              '-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm transition-colors',
              isCurrent
                ? 'border-foreground font-medium text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <section.icon aria-hidden className="size-4" />
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
