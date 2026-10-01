import { assertNever } from '@shared/domain/assert-never';

import type { BadgeEvidence } from '../_badge';
import {
  countEarnedBadges,
  toBadgeFamilyGroups,
  type BadgeAward,
  type BadgeFamilyGroup,
} from '../_badges-view';
import { BadgeDialog } from './badge-dialog';

/**
 * The whole catalogue, grouped by what each family measures.
 *
 * Grouping is not decoration: a badge is only as trustworthy as the figure behind
 * it, and the figures come from three different kinds of evidence. Mixing them
 * into one wall of cards would let a goal somebody typed in sit beside a month
 * measured in a bank statement as though the two were known equally well.
 *
 * Everything unearned is shown from the first visit. There are no hidden badges to
 * discover, because a reward revealed by chance is the loot-box framing the module
 * forbids.
 *
 * Every card opens its own dialog, earned or not — `BadgeDialog` says why that
 * carries no celebration.
 */
export function BadgeCollection({ awards }: { readonly awards: readonly BadgeAward[] }) {
  const groups = toBadgeFamilyGroups(awards);
  const earnedCount = countEarnedBadges(awards);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-heading text-lg font-semibold tracking-tight">Suas conquistas</h2>
        <p className="text-sm text-muted-foreground">
          {earnedCount} de {awards.length} conquistadas. Cada uma marca algo que aconteceu de
          verdade, e nenhuma é retirada depois — uma sequência que quebra não apaga a sequência
          que existiu.
        </p>
      </div>

      {groups.map((group) => (
        <FamilySection key={group.family} group={group} />
      ))}

      {/* On the screen because it is part of what the product is, not only part of
          how it was built: somebody who has met one of these before will be
          looking for the score, and the honest answer is that there isn't one. */}
      <p className="text-xs text-muted-foreground">
        Aqui não existem pontos, níveis nem comparação com outras pessoas. Nada é sorteado e nada
        aparece por surpresa: as conquistas acima são as que existem, com os critérios à vista
        desde o começo.
      </p>
    </section>
  );
}

function FamilySection({ group }: { readonly group: BadgeFamilyGroup }) {
  const earnedCount = countEarnedBadges(group.awards);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 className="font-heading text-base font-medium">{group.descriptor.label}</h3>
          <p className="text-xs text-muted-foreground">
            {earnedCount} de {group.awards.length} · {describeEvidence(group.descriptor.evidence)}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{group.descriptor.description}</p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {group.awards.map((award) => (
          <li key={award.definition.id}>
            <BadgeDialog award={award} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Said in words next to every family, because it changes how much the badge is worth. */
function describeEvidence(evidence: BadgeEvidence): string {
  switch (evidence) {
    case 'MEASURED':
      return 'medido no extrato';
    case 'SELF_REPORTED':
      return 'registrado por você';
    default:
      return assertNever(evidence);
  }
}
