import type { Metadata } from 'next';

import { PlaceholderPage } from '../_components/placeholder-page';

export const metadata: Metadata = { title: 'Configurações' };

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Configurações"
      description="Preferências da conta, notificações e privacidade."
      module="identity"
    />
  );
}
