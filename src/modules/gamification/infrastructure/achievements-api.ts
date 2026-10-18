import { z } from 'zod';

import { callBackend, type BackendResult } from '@shared/infrastructure/backend-api';

/**
 * The bet-free streak and the badges, as backend-anti-aposta measures them
 * (contract: `docs/features/achievements.md` there). The streak is derived from
 * the statement on every read, the badges are awarded there and never revoked;
 * this file only parses what arrives. Every key is a São Paulo `YYYY-MM-DD` or
 * `YYYY-MM`, labelled by the screen and never re-derived from an instant.
 */
export const BADGE_FAMILIES = ['STREAK', 'CEILING', 'REDUCTION', 'SAVINGS'] as const;

export type BadgeFamily = (typeof BADGE_FAMILIES)[number];

const betDaySchema = z.object({
  dayKey: z.string(),
  counterparty: z.string(),
  matchedBy: z.enum(['GAMBLING_MCC', 'LICENSED_CNPJ', 'DESCRIPTION_KEYWORD']),
});

const betFreeStreakSchema = z.object({
  /** A lower bound when `startsBeforeWindow`. */
  lengthInDays: z.number().int().positive(),
  firstDayKey: z.string(),
  lastDayKey: z.string(),
  startsBeforeWindow: z.boolean(),
  endedBy: betDaySchema,
});

const streakSchema = z.object({
  window: z.object({ firstDayKey: z.string(), dayCount: z.number().int().positive() }),
  current: z.object({
    /** Complete days only: today is never counted. */
    days: z.number().int().nonnegative(),
    hasBetToday: z.boolean(),
    /** No bet anywhere in the window: the count is a lower bound. */
    startsBeforeWindow: z.boolean(),
    lastBet: betDaySchema.nullable(),
  }),
  longest: betFreeStreakSchema.nullable(),
  /** The longest few, longest first; `closedStreakCount` is all of them. */
  closedStreaks: z.array(betFreeStreakSchema),
  closedStreakCount: z.number().int().nonnegative(),
  betDayCount: z.number().int().nonnegative(),
  betFreeDayCount: z.number().int().nonnegative(),
  /** Newest first, today included. */
  recentDays: z.array(z.object({ dayKey: z.string(), hasBet: z.boolean() })),
});

const evidenceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('CURRENT_STREAK'), days: z.number().int(), startsBeforeWindow: z.boolean() }),
  z.object({
    kind: z.literal('CLOSED_STREAK'),
    days: z.number().int(),
    firstDayKey: z.string(),
    lastDayKey: z.string(),
    startsBeforeWindow: z.boolean(),
  }),
  z.object({ kind: z.literal('MONTH_RUN'), months: z.number().int(), lastMonthKey: z.string() }),
  z.object({ kind: z.literal('REACHED_GOALS'), count: z.number().int(), titles: z.array(z.string()) }),
]);

const badgeSchema = z.object({
  id: z.string(),
  family: z.enum(BADGE_FAMILIES),
  title: z.string(),
  criterion: z.string(),
  threshold: z.number().int().positive(),
  status: z.enum(['EARNED', 'UNEARNED']),
  /** Set exactly when earned, and never cleared. */
  awardedAt: z.iso.datetime({ offset: true }).nullable(),
  /** Today's figure, uncapped; `null` while the family cannot be measured. */
  currentValue: z.number().int().nonnegative().nullable(),
  progressPercent: z.number().int().min(0).max(100).nullable(),
  evidence: evidenceSchema.nullable(),
});

const achievementsSchema = z.object({
  syncStatus: z.enum(['NO_CONSENT', 'SYNCING', 'READY']),
  todayKey: z.string(),
  /** `null` unless the statement is ready: no consent is not a streak of zero. */
  streak: streakSchema.nullable(),
  /** The whole catalogue, in catalogue order. */
  badges: z.array(badgeSchema),
});

export type AchievementsOverview = z.infer<typeof achievementsSchema>;
export type StreakOverview = z.infer<typeof streakSchema>;
export type BetFreeStretch = z.infer<typeof betFreeStreakSchema>;
export type BetDay = z.infer<typeof betDaySchema>;
export type BadgeStanding = z.infer<typeof badgeSchema>;
export type AttainmentEvidence = z.infer<typeof evidenceSchema>;

/**
 * `GET /achievements`. Reading also awards what fell due since the last look;
 * the celebration for it arrives over the notification stream, never here.
 */
export async function describeAchievements(
  sessionToken: string,
): Promise<BackendResult<AchievementsOverview>> {
  return callBackend({
    method: 'GET',
    path: '/achievements',
    sessionToken,
    responseSchema: achievementsSchema,
  });
}
