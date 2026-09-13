/**
 * What the platform pushes to a connected browser. A discriminated union so the
 * client renders each kind the way the TCC describes it: an awareness nudge is a
 * modal (§4.1), everything else is a passing toast.
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
      readonly title: string;
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
