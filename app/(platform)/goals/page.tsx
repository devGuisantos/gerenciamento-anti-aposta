import type { Metadata } from 'next';

import { PlaceholderPage } from '../_components/placeholder-page';

export const metadata: Metadata = { title: 'Metas' };

export default function GoalsPage() {
  return (
    <PlaceholderPage
      title="Metas"
      description="Defina quanto quer deixar de gastar e acompanhe o progresso."
      module="gamification"
    />
  );
}
