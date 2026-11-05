'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type {
  AwarenessNudgeNotification,
  PlatformNotification,
  TransactionsIngestedNotification,
} from '@modules/notifications';
import { assertNever } from '@shared/domain/assert-never';
import { createConfettiBurst, type ConfettiBurst } from '@shared/ui/milestone-confetti';
import { formatBRL } from '@shared/ui/money-text';

import { describeArrivalsAction, type ArrivalLine } from '../_arrivals-action';
import {
  BadgeAwardedDialog,
  type BadgeAwardedNotification,
} from '../achievements/_components/badge-awarded-dialog';
import { describeNotification } from './notification-copy';
import { useNotificationFeed } from './notification-feed';
import {
  NOTIFICATION_EVENTS,
  parseNotification,
  TRANSACTIONS_INGESTED_TOAST_ID,
} from './notification-wire';
import { TransactionsArrivedToast } from './transactions-arrived-toast';

const STREAM_URL = '/api/notifications/stream';

/** Long enough to read three lines; the toast also closes on its own button. */
const ARRIVAL_TOAST_DURATION_IN_MILLISECONDS = 10_000;

/**
 * Subscribes to the SSE stream and renders whatever arrives. The stream is the
 * signed-in person's own, piped from backend-anti-aposta; `EventSource` sends
 * `Last-Event-ID` on its own when it reconnects, so a dropped connection
 * resumes instead of losing what arrived in between.
 *
 * Two kinds open a modal and two do not, and the split is a product decision
 * rather than a styling one. An awareness nudge interrupts because §4.1 of the TCC
 * is built on it interrupting. An awarded badge interrupts because a badge is rare
 * — eleven exist — and the celebration is the competence half of the SDT mapping,
 * which a toast that fades in four seconds cannot carry.
 *
 * A **broken streak stays a toast**, and must. Celebrating in a modal while
 * reporting a setback in passing is the no-shaming rule as a layout decision; a
 * modal announcing a lost streak would be the product scolding somebody.
 *
 * **New transactions refresh the screen in place.** The statement, the charts
 * and the accounts are Server Components, so `router.refresh()` re-reads them
 * without a reload and without losing anything typed into a form.
 *
 * **Everything also lands in the bell's list**, whatever else it does. The list
 * is read once the stream is open, never before: a notification delivered between
 * a read and the stream opening would be in neither. `open` fires again after a
 * reconnection, so the list catches up then too. A stream refused for good never
 * opens, and the list is still read so the bell is not left loading.
 */
export function NotificationListener() {
  const router = useRouter();
  const { record, synchronise } = useNotificationFeed();
  const [nudge, setNudge] = React.useState<AwarenessNudgeNotification | null>(null);
  const [award, setAward] = React.useState<BadgeAwardedNotification | null>(null);
  const [burst, setBurst] = React.useState<ConfettiBurst | null>(null);

  React.useEffect(() => {
    const source = new EventSource(STREAM_URL);

    function present(notification: PlatformNotification) {
      const copy = describeNotification(notification);

      switch (notification.kind) {
        case 'AWARENESS_NUDGE':
          setNudge(notification);
          break;
        case 'BADGE_AWARDED':
          setAward(notification);
          /* Built here, in the handler for the event itself: the dialog renders,
             and `Math.random()` during render is impure. Reduced motion is
             honoured where it is drawn, not where it is created. */
          setBurst(createConfettiBurst());
          break;
        case 'STREAK_BROKEN':
          // Stated neutrally, never as a reprimand.
          toast.info(copy.title, { description: copy.detail });
          break;
        case 'GOAL_REACHED':
          toast.success(copy.title, { description: copy.detail });
          break;
        case 'TRANSACTIONS_INGESTED':
          router.refresh();
          // The frame is a count; what arrived is read behind the session.
          void synchronise();
          void announceTransactions(notification);
          break;
        default:
          assertNever(notification);
      }
    }

    function receive(event: MessageEvent<string>) {
      const notification = parseNotification(event.data);

      if (notification !== null) {
        record(notification);
        present(notification);
      }
    }

    function catchUp() {
      void synchronise();
    }

    function catchUpIfRefused() {
      if (source.readyState === EventSource.CLOSED) catchUp();
    }

    source.addEventListener('open', catchUp);
    source.addEventListener('error', catchUpIfRefused);

    for (const name of NOTIFICATION_EVENTS) {
      source.addEventListener(name, receive);
    }

    return () => source.close();
  }, [router, record, synchronise]);

  return (
    <>
      <Dialog open={nudge !== null} onOpenChange={() => setNudge(null)}>
        <DialogContent className="sm:max-w-md">
          {nudge ? <NudgeBody nudge={nudge} /> : null}
        </DialogContent>
      </Dialog>

      <BadgeAwardedDialog
        notification={award}
        burst={burst}
        onClose={() => setAward(null)}
        onBurstFinished={() => setBurst(null)}
      />
    </>
  );
}

/**
 * One toast however the movements arrived. The "Sincronizar" button answers
 * with the same id, so pressing it does not stack its own toast on this one.
 *
 * The notification carries only a count, so the lines come from the statement,
 * behind the session. If they cannot be read the toast still says how many
 * arrived — a missing detail is never a reason to drop the announcement.
 */
async function announceTransactions(notification: TransactionsIngestedNotification) {
  const count = notification.ingestedCount;
  const lines: readonly ArrivalLine[] = await describeArrivalsAction(count).catch(() => []);

  toast.custom((id) => <TransactionsArrivedToast toastId={id} count={count} lines={lines} />, {
    id: TRANSACTIONS_INGESTED_TOAST_ID,
    duration: ARRIVAL_TOAST_DURATION_IN_MILLISECONDS,
  });
}

function NudgeBody({ nudge }: { readonly nudge: AwarenessNudgeNotification }) {
  // A bet arrives as a debit; the yield is reframed from its size, not its sign.
  const gainInCents = nudge.yieldInCents - Math.abs(nudge.amountInCents);
  const rate = nudge.annualRatePercent.toFixed(1).replace('.', ',');

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2 text-destructive">
          <TrendingDown className="size-4" />
          <span className="text-xs font-medium tracking-wide uppercase">
            Transação de aposta identificada
          </span>
        </div>
        <DialogTitle className="text-2xl">
          {formatBRL(Math.abs(nudge.amountInCents))}
        </DialogTitle>
        <DialogDescription>
          {nudge.merchant} · identificada por {nudge.matchedBy}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-1 rounded-lg bg-muted p-4">
          <p className="text-xs text-muted-foreground">
            Esse valor, aplicado em renda fixa por 12 meses
          </p>
          <p className="font-heading text-3xl font-semibold tracking-tight">
            {formatBRL(nudge.yieldInCents)}
          </p>
          <p className="text-xs text-muted-foreground">
            Um rendimento de {formatBRL(gainInCents)}, estimado a {rate}% ao ano.
            Não é uma garantia de retorno.
          </p>
        </div>

        <Separator />

        <p className="text-sm text-muted-foreground">
          Neste mês você já transferiu{' '}
          <span className="font-medium text-destructive">
            {formatBRL(nudge.monthlyTotalInCents)}
          </span>{' '}
          para casas de apostas.
        </p>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button className="h-10 w-full">Entendi</Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
}
