/**
 * Presentation model for the badges: the backend's standings into the lines the
 * cards read, and nothing decided.
 *
 * Which badges are earned, every figure and what produced it arrive from
 * `gamification`, which measures them against the same statement, ceiling and
 * savings ledger the other screens show — so a badge cannot claim something the
 * statement contradicts. This file only words the evidence and groups the cards.
 */
import type { AttainmentEvidence, BadgeStanding } from '@modules/gamification';
import { assertNever } from '@shared/domain/assert-never';

import { toMonthLabel } from '../goals/_ceiling-view';
import {
  BADGE_FAMILY_DESCRIPTORS,
  BADGE_FAMILY_ORDER,
  type BadgeDefinition,
  type BadgeFamily,
  type BadgeFamilyDescriptor,
} from './_badge';
import { toDayAndMonthLabel } from './_achievements-view';
import { describeDays } from './_streak-view';

const AWARD_DATE_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

export type BadgeStatus = 'EARNED' | 'UNEARNED';

export type BadgeAward = {
  readonly definition: BadgeDefinition;
  readonly status: BadgeStatus;
  /** Uncapped: the bar caps it, the words keep the real figure. `null` while unmeasurable. */
  readonly currentValue: number | null;
  readonly progressPercentage: number | null;
  /**
   * One factual line — what satisfied the badge, or how far it stands. Never
   * advice, never encouragement, and never a tease: a locked badge reports a
   * distance and stops, because the near-miss is the exact effect a slot machine
   * sells and this product exists to oppose it.
   */
  readonly detail: string;
};

export type BadgeFamilyGroup = {
  readonly family: BadgeFamily;
  readonly descriptor: BadgeFamilyDescriptor;
  readonly awards: readonly BadgeAward[];
};

function describeMonths(months: number): string {
  return months === 1 ? '1 mês' : `${months} meses`;
}

/** A run of months reads differently for the ceiling and for a fall in spending. */
function describeMonthRun(family: BadgeFamily, months: number, lastMonthKey: string): string {
  const month = toMonthLabel(lastMonthKey);

  if (family === 'CEILING') {
    return months === 1
      ? `1 mês fechado dentro do teto: ${month}.`
      : `${describeMonths(months)} seguidos dentro do teto, até ${month}.`;
  }

  return months === 1
    ? `1 mês fechado com queda: ${month}.`
    : `${describeMonths(months)} seguidos de queda, até ${month}.`;
}

/** Names the goals themselves rather than a count, so the reader can check them against their record. */
function describeReachedGoals(count: number, titles: readonly string[]): string {
  const more = count - titles.length;
  const named = more > 0 ? `${titles.join(', ')} e mais ${more}` : titles.join(', ');

  return count === 1 ? `Concluída: ${named}.` : `Concluídas: ${named}.`;
}

/**
 * A stretch the window cut off says "pelo menos": we know it ran at least that
 * long, and we have no right to say it started where our data does.
 */
function describeEvidenceLine(family: BadgeFamily, evidence: AttainmentEvidence): string {
  switch (evidence.kind) {
    case 'CURRENT_STREAK':
      return `${evidence.startsBeforeWindow ? 'Pelo menos ' : ''}${describeDays(evidence.days)} na sequência em andamento.`;
    case 'CLOSED_STREAK':
      return evidence.startsBeforeWindow
        ? `Pelo menos ${describeDays(evidence.days)}, até ${toDayAndMonthLabel(evidence.lastDayKey)}.`
        : `${describeDays(evidence.days)}, de ${toDayAndMonthLabel(evidence.firstDayKey)} a ${toDayAndMonthLabel(evidence.lastDayKey)}.`;
    case 'MONTH_RUN':
      return describeMonthRun(family, evidence.months, evidence.lastMonthKey);
    case 'REACHED_GOALS':
      return describeReachedGoals(evidence.count, evidence.titles);
    default:
      return assertNever(evidence);
  }
}

function describeRemaining(standing: BadgeStanding, currentValue: number): string {
  const remaining = standing.threshold - currentValue;
  const { unit } = BADGE_FAMILY_DESCRIPTORS[standing.family];
  const counted = remaining === 1 ? `1 ${unit.one}` : `${remaining} ${unit.many}`;

  return remaining === 1 ? `Falta ${counted}.` : `Faltam ${counted}.`;
}

/**
 * What satisfied an earned badge — or, once today's figure has fallen below it
 * (a streak broke since), when it was earned. A badge is never taken back, so it
 * never borrows today's smaller figure as its evidence.
 */
function describeEarned(standing: BadgeStanding): string {
  const stillStands =
    standing.evidence !== null && standing.currentValue !== null && standing.currentValue >= standing.threshold;

  if (stillStands && standing.evidence !== null) {
    return describeEvidenceLine(standing.family, standing.evidence);
  }

  return standing.awardedAt === null
    ? standing.criterion
    : `Conquistada em ${AWARD_DATE_FORMAT.format(new Date(standing.awardedAt))}.`;
}

function describeDetail(standing: BadgeStanding): string {
  if (standing.status === 'EARNED') {
    return describeEarned(standing);
  }

  return standing.currentValue === null
    ? 'Ainda não há extrato lido para medir.'
    : describeRemaining(standing, standing.currentValue);
}

export function toBadgeAwards(standings: readonly BadgeStanding[]): readonly BadgeAward[] {
  return standings.map((standing) => ({
    definition: {
      id: standing.id,
      family: standing.family,
      title: standing.title,
      criterion: standing.criterion,
      threshold: standing.threshold,
    },
    status: standing.status,
    currentValue: standing.currentValue,
    progressPercentage: standing.progressPercent,
    detail: describeDetail(standing),
  }));
}

export function toBadgeFamilyGroup(
  awards: readonly BadgeAward[],
  family: BadgeFamily,
): BadgeFamilyGroup {
  return {
    family,
    descriptor: BADGE_FAMILY_DESCRIPTORS[family],
    awards: awards.filter((award) => award.definition.family === family),
  };
}

export function toBadgeFamilyGroups(
  awards: readonly BadgeAward[],
): readonly BadgeFamilyGroup[] {
  return BADGE_FAMILY_ORDER.map((family) => toBadgeFamilyGroup(awards, family));
}

/**
 * The badge a family's folder leads with.
 *
 * The highest earned threshold, which is also the latest earned: a family counts
 * one figure that only climbs towards its thresholds, so the thirty-day badge can
 * never arrive before the seven-day one. With nothing earned yet it is the first
 * badge of the family, shown with its distance like any other unearned one.
 * `null` only for a family the catalogue holds no badge for.
 */
export function selectFeaturedAward(group: BadgeFamilyGroup): BadgeAward | null {
  const earned = group.awards.filter((award) => award.status === 'EARNED');
  return earned.at(-1) ?? group.awards[0] ?? null;
}

export function countEarnedBadges(awards: readonly BadgeAward[]): number {
  return awards.filter((award) => award.status === 'EARNED').length;
}

/**
 * The unearned badge standing closest, by progress and then by the smaller
 * threshold. It is a destination, not a tease — whatever renders it states the
 * distance and adds nothing. A badge that cannot be measured right now has no
 * distance to state, so it is never the one put forward.
 */
export function selectNextMilestone(
  awards: readonly BadgeAward[],
): BadgeAward | null {
  const measurable = awards.filter(
    (award) => award.status === 'UNEARNED' && award.progressPercentage !== null,
  );

  return (
    measurable.toSorted(
      (left, right) =>
        (right.progressPercentage ?? 0) - (left.progressPercentage ?? 0) ||
        left.definition.threshold - right.definition.threshold,
    )[0] ?? null
  );
}
