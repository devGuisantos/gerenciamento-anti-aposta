import { Badge } from '@/components/ui/badge';
import { assertNever } from '@shared/domain/assert-never';

import type { CycleStatus } from '../_goals-view';

/**
 * What happened to one month's ceiling, in words first.
 *
 * The label carries the whole meaning, so a colour-blind reader loses nothing and
 * the badge can be read aloud. Red appears only on `MISSED`, and only because what
 * sits above the ceiling is itself a betting amount — the same rule the statement
 * and the dashboard follow. It names the fact and nothing else: the copy around it
 * is what says a month is not a verdict.
 */
const CYCLE_STATUS_LABELS: Readonly<Record<CycleStatus, string>> = {
  ACTIVE: 'Em andamento',
  REACHED: 'Dentro do teto',
  MISSED: 'Acima do teto',
};

function toVariant(status: CycleStatus): 'outline' | 'secondary' | 'destructive' {
  switch (status) {
    case 'ACTIVE':
      return 'outline';
    case 'REACHED':
      return 'secondary';
    case 'MISSED':
      return 'destructive';
    default:
      return assertNever(status);
  }
}

export function CycleStatusBadge({ status }: { readonly status: CycleStatus }) {
  return <Badge variant={toVariant(status)}>{CYCLE_STATUS_LABELS[status]}</Badge>;
}
