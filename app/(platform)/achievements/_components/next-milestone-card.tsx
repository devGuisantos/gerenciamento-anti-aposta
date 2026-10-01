import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { BADGE_FAMILY_DESCRIPTORS } from '../_badge';
import type { BadgeAward } from '../_badges-view';

type NextMilestoneCardProps = {
  /** `null` once every badge in the catalogue is earned. */
  readonly award: BadgeAward | null;
};

/**
 * The unearned badge standing closest, and the only forward-looking thing on this
 * screen.
 *
 * **It is suppressed when the support offer fires**, and that is the point of
 * having it in its own component. The product rule is that sustained betting
 * surfaces support resources *instead of* more gamification; a card inviting
 * somebody to chase a milestone, printed under an offer of a crisis line, would
 * be the app talking over itself. The badges themselves stay — removing a record
 * of something the person did would be a punishment — but the nudge toward the
 * next one stops. The page decides; see `/achievements` in the route group's
 * CLAUDE.md.
 *
 * What it says is a distance, not an inducement. No "quase lá", no countdown, no
 * animation, and no reward described in advance beyond the badge's own criterion.
 */
export function NextMilestoneCard({ award }: NextMilestoneCardProps) {
  if (award === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nenhum marco em aberto</CardTitle>
          <CardDescription>
            Você já alcançou todas as conquistas que existem hoje. Elas continuam no seu histórico.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { definition, detail, progressPercentage, currentValue } = award;
  const descriptor = BADGE_FAMILY_DESCRIPTORS[definition.family];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Marco mais próximo</CardTitle>
        <CardDescription>{definition.criterion}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-heading text-xl font-semibold tracking-tight">
            {definition.title}
          </h3>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {currentValue} de {definition.threshold} {descriptor.unit.many}
          </span>
        </div>

        <Progress
          value={progressPercentage}
          aria-label={`Progresso para a conquista ${definition.title}: ${detail}`}
          className="h-2"
        />

        <p className="text-sm text-muted-foreground">{detail}</p>

        <p className="text-xs text-muted-foreground">
          É só o marco mais perto de acontecer — não é uma recomendação, e não há nada a receber
          além do registro de que aconteceu.
        </p>
      </CardContent>
    </Card>
  );
}
