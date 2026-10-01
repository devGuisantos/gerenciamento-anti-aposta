import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { BADGE_FAMILY_DESCRIPTORS } from '../_badge';
import type { BadgeAward } from '../_badges-view';

/**
 * One badge, earned or not.
 *
 * Both states show the same things in the same order: what it is, what it takes,
 * and where the reader stands. The differences are deliberately small — a filled
 * mark and the word "Conquistada" — because the alternatives are worse:
 *
 * - **No padlock, and nothing greyed into illegibility.** A lock frames an
 *   unearned badge as a reward being withheld, which is the loot-box framing the
 *   module forbids. An unearned badge here is simply a thing that has not happened
 *   yet, and its criterion is as readable as any other.
 * - **No celebration.** Nothing animates, nothing bursts. `BadgeAwarded` is an
 *   event, and whatever celebrates it belongs on the notification that fires when
 *   it happens — not on a screen somebody opened three weeks later, where a
 *   celebration would be applause for nothing having occurred.
 * - **The distance is a distance.** "Faltam 57 dias" and nothing else: no "quase
 *   lá", no bar that creeps, no hint of what is nearly within reach. A near-miss
 *   is the precise effect a slot machine sells.
 */
export function BadgeCard({ award }: { readonly award: BadgeAward }) {
  const { definition, status, detail, progressPercentage } = award;
  const descriptor = BADGE_FAMILY_DESCRIPTORS[definition.family];
  const isEarned = status === 'EARNED';

  return (
    <Card size="sm">
      <CardContent className="flex gap-3">
        <span
          aria-hidden
          className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
            isEarned ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          <descriptor.icon className="size-4" />
        </span>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <h4 className="font-heading text-sm font-medium">{definition.title}</h4>
            {/* The word carries it, not the mark — a colour-blind reader and a
                screen reader both get the state from the label. */}
            {isEarned ? <Badge variant="secondary">Conquistada</Badge> : null}
          </div>

          <p className="text-xs text-muted-foreground">{definition.criterion}</p>

          {isEarned ? null : (
            <Progress
              value={progressPercentage}
              aria-label={`Progresso para a conquista ${definition.title}: ${detail}`}
              className="h-1.5"
            />
          )}

          <p className="text-xs text-muted-foreground">{detail}</p>

          {/* A badge from figures the user typed in cannot look identical to one
              measured in a bank statement, or the self-reported half borrows a
              certainty it has not got. */}
          {descriptor.evidence === 'SELF_REPORTED' ? (
            <Badge variant="outline" className="font-normal">
              Registrado por você
            </Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
