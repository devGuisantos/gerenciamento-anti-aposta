import { countEarnedBadges, toBadgeFamilyGroups, type BadgeAward } from '../_badges-view';
import { BadgeFamilyFolder } from './badge-family-folder';
import { NoScoreNote } from './no-score-note';

/**
 * The whole catalogue, folded by what each family measures.
 *
 * Grouping is not decoration: a badge is only as trustworthy as the figure behind
 * it, and the figures come from different kinds of evidence. Mixing them into one
 * wall of cards would let a goal somebody typed in sit beside a month measured in
 * a bank statement as though the two were known equally well.
 *
 * Each family is a folder that leads with its latest badge and links to the full
 * list. Every badge is still one tap away and every folder says how many it
 * holds, so folding hides nothing — there are no secret badges to discover,
 * because a reward revealed by chance is the loot-box framing the module forbids.
 */
export function BadgeCollection({ awards }: { readonly awards: readonly BadgeAward[] }) {
  const groups = toBadgeFamilyGroups(awards);
  const earnedCount = countEarnedBadges(awards);

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-heading text-lg font-semibold tracking-tight">Suas conquistas</h2>
        <p className="text-sm text-muted-foreground">
          {earnedCount} de {awards.length} conquistadas. Cada uma marca algo que aconteceu de
          verdade, e nenhuma é retirada depois — uma sequência que quebra não apaga a sequência
          que existiu.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {groups.map((group) => (
          <li key={group.family}>
            <BadgeFamilyFolder group={group} />
          </li>
        ))}
      </ul>

      <NoScoreNote />
    </section>
  );
}
