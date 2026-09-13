import type { Metadata } from 'next';

import { PlaceholderPage } from '../_components/placeholder-page';

export const metadata: Metadata = { title: 'Transações' };

export default function TransactionsPage() {
  return (
    <PlaceholderPage
      title="Transações"
      description="Todo o histórico compartilhado pelas suas contas conectadas."
      module="open-finance"
    />
  );
}
