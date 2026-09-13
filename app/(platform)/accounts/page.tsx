import type { Metadata } from 'next';

import { PlaceholderPage } from '../_components/placeholder-page';

export const metadata: Metadata = { title: 'Contas conectadas' };

export default function AccountsPage() {
  return (
    <PlaceholderPage
      title="Contas conectadas"
      description="Consentimentos do Open Finance: conectar, revisar e revogar."
      module="open-finance"
    />
  );
}
