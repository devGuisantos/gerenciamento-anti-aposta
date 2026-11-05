import type { PlatformNotification } from '@modules/notifications';
import { assertNever } from '@shared/domain/assert-never';
import { formatBRL } from '@shared/ui/money-text';

type NotificationCopy = {
  readonly title: string;
  readonly detail: string;
};

/**
 * Each kind in words, for the list and for the toasts, so the same event never
 * reads two ways. Neutral on purpose, a broken streak above all: the list keeps
 * these around, and a line somebody can reread has even less business scolding.
 */
export function describeNotification(notification: PlatformNotification): NotificationCopy {
  switch (notification.kind) {
    case 'AWARENESS_NUDGE':
      return {
        title: 'Transação de aposta identificada',
        // A bet arrives as a debit; what the reader needs is its size.
        detail: `${notification.merchant} · ${formatBRL(Math.abs(notification.amountInCents))} · identificada por ${notification.matchedBy}`,
      };
    case 'BADGE_AWARDED':
      return { title: `Conquista: ${notification.title}`, detail: notification.description };
    case 'STREAK_BROKEN':
      return {
        title: 'Sua sequência recomeçou',
        detail: `A anterior foi de ${notification.previousDays} ${notification.previousDays === 1 ? 'dia' : 'dias'} sem apostas.`,
      };
    case 'GOAL_REACHED':
      return {
        title: 'Meta alcançada',
        detail: `${notification.label} — ${formatBRL(notification.amountInCents)}.`,
      };
    case 'TRANSACTIONS_INGESTED':
      return {
        title:
          notification.ingestedCount === 1
            ? '1 transação nova'
            : `${notification.ingestedCount} transações novas`,
        detail: 'Chegaram ao seu extrato.',
      };
    default:
      return assertNever(notification);
  }
}
