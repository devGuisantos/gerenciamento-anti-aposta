import type { Metadata } from 'next';

import { PlaceholderPage } from '../_components/placeholder-page';
import { requireSession } from '@modules/identity';

export const metadata: Metadata = { title: 'Contas conectadas' };

export default async function AccountsPage() {
  await requireSession();
  return (
    <PlaceholderPage
      title="Contas conectadas"
      description="Consentimentos do Open Finance: conectar, revisar e revogar."
      module="open-finance"
    />
  );
}
