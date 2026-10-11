import type { Metadata } from 'next';

import { PlaceholderPage } from '../_components/placeholder-page';
import { requireSession } from '@modules/identity';

export const metadata: Metadata = { title: 'Configurações' };

export default async function SettingsPage() {
  await requireSession();
  return (
    <PlaceholderPage
      title="Configurações"
      description="Preferências da conta, notificações e privacidade."
      module="identity"
    />
  );
}
