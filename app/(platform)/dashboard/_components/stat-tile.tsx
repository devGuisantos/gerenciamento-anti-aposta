import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

type StatTileProps = {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly value: ReactNode;
  readonly detail: string;
};

/** Label (sentence case) · value · one line of detail, and nothing else. */
export function StatTile({ icon: Icon, label, value, detail }: StatTileProps) {
  return (
    <Card size="sm">
      <CardContent className="space-y-1">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon aria-hidden className="size-4" />
          <span className="text-xs font-medium">{label}</span>
        </div>
        <p className="font-heading text-2xl font-semibold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
