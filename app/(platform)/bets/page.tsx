import type { Metadata } from 'next';

import { PlaceholderPage } from '../_components/placeholder-page';

export const metadata: Metadata = { title: 'Apostas' };

export default function BetsPage() {
  return (
    <PlaceholderPage
      title="Apostas"
      description="As transações identificadas como casas de apostas e o custo acumulado delas."
      module="bet-detection"
    />
  );
}
