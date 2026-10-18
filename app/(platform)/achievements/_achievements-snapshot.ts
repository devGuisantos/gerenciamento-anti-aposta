/**
 * Everything `/achievements` and `/achievements/[family]` show, read once per
 * request from the backend.
 *
 * Both screens read it so a badge cannot be earned on one and missing on the
 * other: the family page is the same record, opened further, never a second
 * read that could disagree with the summary that linked to it.
 */
import { fetchSupportOffer } from '@modules/awareness';
import { describeAchievements, type AchievementsOverview } from '@modules/gamification';
import { assertNever } from '@shared/domain/assert-never';

import type { StatementUnavailableReason } from '../transactions/_components/statement-unavailable';
import type { SupportSignal } from '../transactions/_support-signal';
import { toStreakDays, toStreakRecord } from './_achievements-view';
import { toBadgeAwards, type BadgeAward } from './_badges-view';
import type { StreakDay, StreakRecord } from './_streak';

/**
 * The streak half, or why there is none. No consent is not zero: without a
 * ready statement the screen says so instead of drawing a hero of 0 days that
 * would read as "you bet every day".
 */
export type StreakSection =
  | {
      readonly kind: 'MEASURED';
      readonly record: StreakRecord;
      readonly calendarDays: readonly StreakDay[];
    }
  | { readonly kind: 'UNAVAILABLE'; readonly reason: StatementUnavailableReason };

export type AchievementsSnapshot =
  | {
      readonly kind: 'READ';
      readonly streak: StreakSection;
      readonly awards: readonly BadgeAward[];
      /**
       * The same offer `/transactions/insights` renders, under the same
       * dismissal — one offer, dismissed once. `null` when it could not be read:
       * a failed read renders no card, never an alarm in its place.
       */
      readonly supportSignal: SupportSignal | null;
    }
  | { readonly kind: 'FAILED'; readonly message: string };

function toStreakSection(overview: AchievementsOverview): StreakSection {
  switch (overview.syncStatus) {
    case 'NO_CONSENT':
      return { kind: 'UNAVAILABLE', reason: { kind: 'NO_CONSENT' } };
    case 'SYNCING':
      return { kind: 'UNAVAILABLE', reason: { kind: 'SYNCING' } };
    case 'READY':
      return overview.streak === null
        ? { kind: 'UNAVAILABLE', reason: { kind: 'SYNCING' } }
        : {
            kind: 'MEASURED',
            record: toStreakRecord(overview.streak, overview.todayKey),
            calendarDays: toStreakDays(overview.streak, overview.todayKey),
          };
    default:
      return assertNever(overview.syncStatus);
  }
}

/**
 * The backend awards what fell due on this read; the celebration for it comes
 * over the notification stream, so nothing here — however many badges are
 * listed — celebrates anything.
 */
export async function readAchievementsSnapshot(sessionToken: string): Promise<AchievementsSnapshot> {
  const [achievements, supportOffer] = await Promise.all([
    describeAchievements(sessionToken),
    fetchSupportOffer(sessionToken),
  ]);

  if (!achievements.ok) {
    return { kind: 'FAILED', message: achievements.failure.message };
  }

  return {
    kind: 'READ',
    streak: toStreakSection(achievements.value),
    awards: toBadgeAwards(achievements.value.badges),
    supportSignal: supportOffer.ok ? supportOffer.value : null,
  };
}
