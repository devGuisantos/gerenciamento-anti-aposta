/**
 * What the platform pushes to a connected browser. A discriminated union so the
 * client renders each kind the way it deserves: an awareness nudge is a modal
 * (§4.1 of the TCC) and so is an awarded badge, while a broken streak and a
 * reached savings goal are passing toasts.
 *
 * The asymmetry is deliberate and is the no-shaming rule in one line. A badge is
 * rare, it is good news, and the celebration is the competence half of the SDT
 * mapping, so it earns the interruption. A broken streak is **never** a modal: it
 * is reported quietly and the counter restarts.
 *
 * Amounts are integer cents, like every other amount in the codebase.
 */
export type PlatformNotification =
  | {
      readonly kind: 'awareness-nudge';
      readonly id: string;
      readonly merchant: string;
      readonly amountInCents: number;
      readonly yieldInCents: number;
      readonly annualRatePercent: number;
      readonly monthlyTotalInCents: number;
      readonly matchedBy: string;
    }
  | {
      readonly kind: 'badge-awarded';
      readonly id: string;
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
    }
  | {
      readonly kind: 'streak-broken';
      readonly id: string;
      readonly previousDays: number;
    }
  | {
      readonly kind: 'goal-reached';
      readonly id: string;
      readonly label: string;
      readonly amountInCents: number;
    };

export type NotificationKind = PlatformNotification['kind'];

export const NOTIFICATION_KINDS = [
  'awareness-nudge',
  'badge-awarded',
  'streak-broken',
  'goal-reached',
] as const satisfies readonly NotificationKind[];

export function isNotificationKind(value: unknown): value is NotificationKind {
  return NOTIFICATION_KINDS.includes(value as NotificationKind);
}
