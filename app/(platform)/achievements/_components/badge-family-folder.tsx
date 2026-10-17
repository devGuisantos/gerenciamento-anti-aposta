import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

import { describeEvidence } from '../_badge';
import {
  countEarnedBadges,
  selectFeaturedAward,
  type BadgeAward,
  type BadgeFamilyGroup,
} from '../_badges-view';

/**
 * One family of badges, folded: its count, its latest badge, and the way in to
 * the rest.
 *
 * The full catalogue on one screen was eleven cards under a streak hero, a
 * calendar and two lists — a wall nobody reads to the end. Folding keeps every
 * criterion one tap away without printing all of them at once, and the count
 * says up front how many sit behind the fold, so nothing is hidden: the folder
 * is a table of contents, not a reveal.
 *
 * The whole card is the link, as every row in this product is. It is a link and
 * not a dialog because the family page is a place — it has a URL the browser's
 * back button returns from, and its own cards open the detail dialog without
 * stacking one modal on another.
 */
export function BadgeFamilyFolder({ group }: { readonly group: BadgeFamilyGroup }) {
  const { descriptor, awards } = group;
  const earnedCount = countEarnedBadges(awards);
  const featured = selectFeaturedAward(group);

  return (
    <Link
      href={`/achievements/${descriptor.slug}`}
      aria-label={`${descriptor.label}: ${earnedCount} de ${awards.length} conquistadas. Ver todas.`}
      /* The same small lift `BadgeDialog` uses, so every card on the screen that
         opens something answers the pointer the same way. */
      className="group block h-full rounded-xl outline-none transition-transform motion-safe:hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full">
        <CardContent className="flex h-full flex-col gap-4">
          <FolderHeading group={group} earnedCount={earnedCount} />
          <EarnedPips awards={awards} />
          {featured === null ? null : <FeaturedAward award={featured} />}

          <span className="mt-auto flex items-center gap-1 text-sm font-medium">
            Ver todas as {awards.length}
            <ChevronRight
              aria-hidden
              className="size-4 transition-transform motion-safe:group-hover:translate-x-0.5"
            />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

function FolderHeading({
  group,
  earnedCount,
}: {
  readonly group: BadgeFamilyGroup;
  readonly earnedCount: number;
}) {
  const { descriptor, awards } = group;

  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden
        className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
          earnedCount > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}
      >
        <descriptor.icon className="size-5" />
      </span>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-heading text-base font-medium">{descriptor.label}</h3>
          <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
            {earnedCount} de {awards.length}
          </span>
        </div>
        {/* On the folder and not only inside it: whether a family is measured or
            typed in changes what every badge in it is worth. */}
        <p className="text-xs text-muted-foreground">{describeEvidence(descriptor.evidence)}</p>
      </div>
    </div>
  );
}

/**
 * One segment per badge, filled for the earned ones — the "2 de 4" beside the
 * heading, drawn. It repeats the number and adds nothing, which is why it is
 * `aria-hidden`; filled and empty differ in lightness, never in hue.
 */
function EarnedPips({ awards }: { readonly awards: readonly BadgeAward[] }) {
  return (
    <div aria-hidden className="flex gap-1">
      {awards.map((award) => (
        <span
          key={award.definition.id}
          className={`h-1.5 flex-1 rounded-full ${
            award.status === 'EARNED' ? 'bg-primary' : 'bg-muted'
          }`}
        />
      ))}
    </div>
  );
}

/**
 * The latest badge earned, or — before there is one — the first in the family,
 * with its distance stated and nothing more. Same words as its own card, so the
 * folder never says something the list behind it does not.
 */
function FeaturedAward({ award }: { readonly award: BadgeAward }) {
  const isEarned = award.status === 'EARNED';

  return (
    <div className="space-y-1 rounded-lg bg-muted p-3">
      <p className="text-xs text-muted-foreground">
        {isEarned ? 'Mais recente' : 'Nenhuma conquistada ainda'}
      </p>
      <p className="font-heading text-sm font-medium">{award.definition.title}</p>
      <p className="text-xs text-muted-foreground">{award.detail}</p>
    </div>
  );
}
