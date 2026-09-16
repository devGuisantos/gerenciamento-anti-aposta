import type { Metadata } from 'next';

import { SectionTabs } from '../_components/section-tabs';
import { InsightsDashboard } from './_components/insights-dashboard';

export const metadata: Metadata = {
  title: 'Gráficos',
  description: 'Como suas entradas e saídas se movem mês a mês, com as apostas destacadas.',
};

/**
 * Per request, like the statement: the month labels are relative to today, and a
 * static render would freeze them at build time.
 */
export const dynamic = 'force-dynamic';

export default function TransactionInsightsPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Transações</h1>
        <p className="text-sm text-muted-foreground">
          Os mesmos dados do extrato, mês a mês. Escolha o que olhar e por quanto tempo.
        </p>
      </div>

      <SectionTabs />

      <InsightsDashboard referenceIso={new Date().toISOString()} />
    </div>
  );
}
