import type { Metadata } from 'next';

import { fetchSupportOffer } from '@modules/awareness';
import { readSessionToken, requireSession } from '@modules/identity';
import { summariseSpendByMonth } from '@modules/open-finance';

import { SectionTabs } from '../_components/section-tabs';
import { StatementUnavailable } from '../_components/statement-unavailable';
import { InsightsDashboard } from './_components/insights-dashboard';
import { toChartMonths } from './_insights-view';

export const metadata: Metadata = {
  title: 'Gráficos',
  description: 'Como suas entradas e saídas se movem mês a mês, com as apostas destacadas.',
};

/** Per request, like the statement: one person's figures, never cached. */
export const dynamic = 'force-dynamic';

/**
 * Two independent reads, made together. A failed summary is said in words; a
 * failed support offer renders nothing — a broken support card must not turn
 * into an alarming message, and the contacts stay in the footer regardless.
 */
async function InsightsBody({ token }: { readonly token: string }) {
  const [summary, supportOffer] = await Promise.all([
    summariseSpendByMonth(token),
    fetchSupportOffer(token),
  ]);

  if (!summary.ok) {
    return <StatementUnavailable reason={{ kind: 'FAILED', message: summary.failure.message }} />;
  }
  if (summary.value.syncStatus !== 'READY') {
    return <StatementUnavailable reason={{ kind: summary.value.syncStatus }} />;
  }

  return (
    <InsightsDashboard
      months={toChartMonths(summary.value.items)}
      supportSignal={supportOffer.ok ? supportOffer.value : null}
    />
  );
}

export default async function TransactionInsightsPage() {
  await requireSession();
  const token = await readSessionToken();

  if (token === null) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Transações</h1>
        <p className="text-sm text-muted-foreground">
          Os mesmos dados do extrato, mês a mês. Escolha o que olhar e por quanto tempo.
        </p>
      </div>

      <SectionTabs />

      <InsightsBody token={token} />
    </div>
  );
}
