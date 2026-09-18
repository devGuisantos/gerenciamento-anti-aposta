'use client';

import { useState } from 'react';
import { LifeBuoy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useIsHydrated } from '@/hooks/use-is-hydrated';
import { formatBRL } from '@shared/ui/money-text';
import { SupportContacts } from '@shared/ui/support-contacts';

import { HIGH_BAND_FLOOR_IN_CENTS } from '../_spend-level';
import type { SupportSignal } from '../_support-signal';

const DISMISSED_KEY = 'anti-aposta:support-offer-dismissed';

type SupportCardProps = {
  readonly signal: SupportSignal;
};

/**
 * Support resources, offered when the betting total has sat in the high band for
 * months on end.
 *
 * Deliberately **not** styled as an alarm: no red, no icon in a warning colour, no
 * urgency. Red in this product means a gambling amount, and borrowing it here to
 * raise the temperature would be exactly the manufactured alarm the product rules
 * forbid. It reads as an offer, because that is what it is.
 *
 * It states what it counted and stops there. The app sees a bank statement; it is
 * in no position to tell anyone what their spending means about them.
 */
export function SupportCard({ signal }: SupportCardProps) {
  const isHydrated = useIsHydrated();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!signal.shouldOffer) return null;
  if (isDismissed) return null;
  /* Rendered on the server and hidden after hydration if it was already
     dismissed, rather than the other way round: a support line that waits for
     JavaScript is a support line some people never see. The cost is that a
     dismissed card may flash once on a slow connection, which is the cheaper
     failure of the two. */
  if (isHydrated && wasDismissedThisSession()) return null;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <LifeBuoy aria-hidden className="size-5 shrink-0 text-muted-foreground" />

        <div className="flex-1 space-y-3">
          {/* The offer comes first and the reason last. Leading with the figure would
              build a case against the reader before offering them anything. */}
          <h2 className="font-heading text-base font-medium">Quer ajuda? É gratuito e sigiloso:</h2>

          <SupportContacts />

          <p className="text-xs text-muted-foreground">
            Você está vendo isto porque, {describeObservation(signal)} O que isso significa, só
            você sabe.
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 self-start"
          onClick={() => {
            setIsDismissed(true);
            rememberDismissal();
          }}
        >
          Agora não
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Reports the count, and nothing about the person. Reads as a subordinate clause
 * so the card can say plainly why it appeared at all.
 */
function describeObservation(signal: SupportSignal): string {
  const months = `${signal.sustainedMonths} meses seguidos`;
  const floor = formatBRL(HIGH_BAND_FLOOR_IN_CENTS);

  return signal.isRising
    ? `em ${months}, o valor em apostas passou de ${floor} por mês e subiu a cada mês.`
    : `em ${months}, o valor em apostas passou de ${floor} por mês.`;
}

/*
 * Dismissal lasts the browsing session, not forever. Nagging somebody who has
 * already said "not now" is pressure, and the thesis rests on autonomy — but a
 * permanent hide would bury a support line behind a single stray click.
 */
function wasDismissedThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function rememberDismissal(): void {
  try {
    window.sessionStorage.setItem(DISMISSED_KEY, 'true');
  } catch {
    /* Private windows and blocked storage are fine — the card simply returns. */
  }
}
