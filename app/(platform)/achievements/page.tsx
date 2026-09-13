import type { Metadata } from 'next';

import { PlaceholderPage } from '../_components/placeholder-page';

export const metadata: Metadata = { title: 'Conquistas' };

export default function AchievementsPage() {
  return (
    <PlaceholderPage
      title="Conquistas"
      description="Sequências sem apostas e marcos alcançados."
      module="gamification"
    />
  );
}
