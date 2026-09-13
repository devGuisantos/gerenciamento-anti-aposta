'use client';

import * as React from 'react';
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
import type { PlatformNotification } from '@modules/notifications';
import { formatBRL } from '@shared/ui/money-text';

type NudgeNotification = Extract<
  PlatformNotification,
  { kind: 'awareness-nudge' }
>;

/**
 * Subscribes to the SSE stream and renders whatever arrives. An awareness nudge
 * opens a modal, as described in §4.1 of the TCC; the rest are toasts, which are
 * lighter and do not interrupt.
 */
export function NotificationListener() {
  const [nudge, setNudge] = React.useState<NudgeNotification | null>(null);

  React.useEffect(() => {
    const source = new EventSource('/api/notifications/stream');

    source.onmessage = (event) => {
      const notification = JSON.parse(event.data) as PlatformNotification;

      switch (notification.kind) {
        case 'awareness-nudge':
          setNudge(notification);
          break;
        case 'badge-awarded':
          toast.success(notification.title, {
            description: notification.description,
          });
          break;
        case 'streak-broken':
          // Stated neutrally, never as a reprimand.
          toast.info('Sua sequência recomeçou', {
            description: `A anterior foi de ${notification.previousDays} dias sem apostas.`,
          });
          break;
        case 'goal-reached':
          toast.success('Meta alcançada', {
            description: `${notification.label} — ${formatBRL(notification.amountInCents)}.`,
          });
          break;
      }
    };

    return () => source.close();
  }, []);

  return (
    <Dialog open={nudge !== null} onOpenChange={() => setNudge(null)}>
      <DialogContent className="sm:max-w-md">
        {nudge ? <NudgeBody nudge={nudge} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function NudgeBody({ nudge }: { readonly nudge: NudgeNotification }) {
  const gainInCents = nudge.yieldInCents - nudge.amountInCents;
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
