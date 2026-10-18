import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { StatementUnavailable } from '../../transactions/_components/statement-unavailable';
import { SupportCard } from '../../transactions/_components/support-card';
import { readAchievementsSnapshot } from '../_achievements-snapshot';
import { BADGE_FAMILY_DESCRIPTORS, describeEvidence, findBadgeFamilyBySlug } from '../_badge';
import { countEarnedBadges, toBadgeFamilyGroup } from '../_badges-view';
import { BadgeDialog } from '../_components/badge-dialog';
import { NoScoreNote } from '../_components/no-score-note';
import { readSessionToken, requireSession } from '@modules/identity';

type FamilyPageProps = {
  readonly params: Promise<{ readonly family: string }>;
};

/** Per request, like the summary: every badge here is evaluated against today. */
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: FamilyPageProps): Promise<Metadata> {
  const family = findBadgeFamilyBySlug((await params).family);
  if (family === null) return { title: 'Conquistas' };

  const descriptor = BADGE_FAMILY_DESCRIPTORS[family];
  return { title: `${descriptor.label} · Conquistas`, description: descriptor.description };
}

/**
 * Every badge of one family, opened out of its folder on `/achievements`.
 *
 * The same record as the summary, from the same snapshot, so the count on the
 * folder and the cards here cannot disagree. Each card opens `BadgeDialog`, as it
 * did when the whole catalogue sat on one screen.
 */
export default async function BadgeFamilyPage({ params }: FamilyPageProps) {
  await requireSession();
  const family = findBadgeFamilyBySlug((await params).family);
  if (family === null) notFound();

  const token = await readSessionToken();

  if (token === null) {
    return null;
  }

  const snapshot = await readAchievementsSnapshot(token);

  if (snapshot.kind === 'FAILED') {
    return (
      <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <StatementUnavailable reason={{ kind: 'FAILED', message: snapshot.message }} />
      </div>
    );
  }

  const group = toBadgeFamilyGroup(snapshot.awards, family);
  const { descriptor } = group;
  const earnedCount = countEarnedBadges(group.awards);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/achievements">
          <ArrowLeft />
          Conquistas
        </Link>
      </Button>

      {/* The offer outranks every gamification screen, this one included. */}
      {snapshot.supportSignal === null ? null : <SupportCard signal={snapshot.supportSignal} />}

      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className={`flex size-12 shrink-0 items-center justify-center rounded-full ${
            earnedCount > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          <descriptor.icon className="size-6" />
        </span>

        <div className="min-w-0 space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {descriptor.label}
          </h1>
          <p className="text-sm text-muted-foreground">
            <span className="tabular-nums">
              {earnedCount} de {group.awards.length}
            </span>{' '}
            conquistadas · {describeEvidence(descriptor.evidence)}
          </p>
          <p className="text-sm text-muted-foreground">{descriptor.description}</p>
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {group.awards.map((award) => (
          <li key={award.definition.id}>
            <BadgeDialog award={award} />
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <NoScoreNote />
        <Button asChild variant="outline" className="h-10">
          <Link href={descriptor.evidenceLink.href}>
            {descriptor.evidenceLink.label}
            <ArrowUpRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
