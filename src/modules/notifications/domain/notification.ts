/**
 * What the platform pushes to a connected browser, exactly as backend-anti-aposta
 * sends it on `GET /api/v1/notifications/stream`: one named event per kind, the
 * kind's fields flattened beside `id` and `createdAt`. The kinds mirror the
 * backend's enum, so nothing translates them on the way through.
 *
 * Each kind renders the way it deserves: an awareness nudge is a modal (§4.1 of
 * the TCC) and so is an awarded badge, while a broken streak, a reached savings
 * goal and new transactions are passing toasts.
 *
 * The asymmetry is deliberate and is the no-shaming rule in one line. A badge is
 * rare, it is good news, and the celebration is the competence half of the SDT
 * mapping, so it earns the interruption. A broken streak is **never** a modal: it
 * is reported quietly and the counter restarts.
 *
 * Amounts are integer cents, like every other amount in the codebase.
 */
type Delivered = {
  /** Also the stream's event id: a reconnecting browser resumes after it. */
  readonly id: string;
  readonly createdAt: string;
};

export type AwarenessNudgeNotification = Delivered & {
  readonly kind: 'AWARENESS_NUDGE';
  readonly merchant: string;
  readonly amountInCents: number;
  /** Reframed by the backend's `awareness` context, with the rate that produced it. */
  readonly yieldInCents: number;
  readonly annualRatePercent: number;
  readonly monthlyTotalInCents: number;
  readonly matchedBy: string;
};

export type BadgeAwardedNotification = Delivered & {
  readonly kind: 'BADGE_AWARDED';
  /**
   * Which badge, so the client can render its family mark and its criterion
   * from the catalogue instead of this payload carrying a copy of both. An id
   * the catalogue does not know still renders — from `title` and
   * `description` alone — because a notification must never be able to blank
   * a dialog.
   */
  readonly badgeId: string;
  readonly title: string;
  /** The evidence line: what the user did that satisfied it, already worded. */
  readonly description: string;
};

export type StreakBrokenNotification = Delivered & {
  readonly kind: 'STREAK_BROKEN';
  readonly previousDays: number;
};

export type GoalReachedNotification = Delivered & {
  readonly kind: 'GOAL_REACHED';
  readonly label: string;
  readonly amountInCents: number;
};

/** New movements reached the statement: whatever shows it should read it again. */
export type TransactionsIngestedNotification = Delivered & {
  readonly kind: 'TRANSACTIONS_INGESTED';
  readonly ingestedCount: number;
};

export type PlatformNotification =
  | AwarenessNudgeNotification
  | BadgeAwardedNotification
  | StreakBrokenNotification
  | GoalReachedNotification
  | TransactionsIngestedNotification;

export type NotificationKind = PlatformNotification['kind'];

/**
 * What the demonstration console sends to one person. A nudge has no yield:
 * the backend reframes the amount itself, so the console cannot show a figure
 * the product would not.
 */
export type DemoNotificationDraft =
  | Omit<AwarenessNudgeNotification, keyof Delivered | 'yieldInCents' | 'annualRatePercent'>
  | Omit<BadgeAwardedNotification, keyof Delivered>
  | Omit<StreakBrokenNotification, keyof Delivered>
  | Omit<GoalReachedNotification, keyof Delivered>;
