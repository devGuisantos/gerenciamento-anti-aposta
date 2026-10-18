import type { Metadata } from 'next';

import { readSessionToken, requireSession } from '@modules/identity';

import { StatementUnavailable } from '../transactions/_components/statement-unavailable';
import { SupportCard } from '../transactions/_components/support-card';
import { readAchievementsSnapshot, type StreakSection } from './_achievements-snapshot';
import { selectNextMilestone, type BadgeAward } from './_badges-view';
import { BadgeCollection } from './_components/badge-collection';
import { NextMilestoneCard } from './_components/next-milestone-card';
import { StreakCalendar } from './_components/streak-calendar';
import { StreakHero } from './_components/streak-hero';
import { StreakRecordList } from './_components/streak-record-list';

export const metadata: Metadata = {
  title: 'Conquistas',
  description: 'Dias sem apostas e marcos alcançados, contados no extrato que você compartilhou.',
};

/**
 * Rendered per request. Every figure on this screen is relative to today — which
 * day the streak is counted to, which month closed last — and a static render
 * would freeze all of it at build time.
 */
export const dynamic = 'force-dynamic';

export default async function AchievementsPage() {
  await requireSession();
  const token = await readSessionToken();

  if (token === null) {
    return null;
  }

  const snapshot = await readAchievementsSnapshot(token);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Conquistas</h1>
        <p className="text-sm text-muted-foreground">
          Os dias que você passou sem apostas e os marcos que já alcançou. Tudo é contado no
          extrato que você compartilhou — nada é sorteado, nada aparece por surpresa, e nada aqui
          movimenta dinheiro.
        </p>
      </div>

      {snapshot.kind === 'FAILED' ? (
        <StatementUnavailable reason={{ kind: 'FAILED', message: snapshot.message }} />
      ) : (
        <>
          {/* Before the streak, before the badges. Somebody who needs a phone number
              should not have to scroll past a progress bar to find it. */}
          {snapshot.supportSignal === null ? null : <SupportCard signal={snapshot.supportSignal} />}

          <StreakSectionView streak={snapshot.streak} />

          <div className={`grid gap-4 ${snapshot.supportSignal?.shouldOffer ? '' : 'lg:grid-cols-2'}`}>
            {snapshot.streak.kind === 'MEASURED' ? (
              <StreakRecordList record={snapshot.streak.record} />
            ) : null}
            {snapshot.supportSignal?.shouldOffer ? null : (
              <NextMilestone awards={snapshot.awards} />
            )}
          </div>

          <BadgeCollection awards={snapshot.awards} />
        </>
      )}
    </div>
  );
}

/** No consent is not zero: the measured half says why it is missing, and the badges stay. */
function StreakSectionView({ streak }: { readonly streak: StreakSection }) {
  if (streak.kind === 'UNAVAILABLE') {
    return <StatementUnavailable reason={streak.reason} />;
  }

  return (
    <>
      <StreakHero record={streak.record} />
      <StreakCalendar days={streak.calendarDays} />
    </>
  );
}

/**
 * The nearest measurable milestone. With none left to measure — every badge
 * earned, or the rest waiting for a statement — the card says the first and
 * stays away for the second, rather than claiming the catalogue is complete.
 */
function NextMilestone({ awards }: { readonly awards: readonly BadgeAward[] }) {
  const next = selectNextMilestone(awards);
  const isComplete = awards.every((award) => award.status === 'EARNED');

  return next === null && !isComplete ? null : <NextMilestoneCard award={next} />;
}
