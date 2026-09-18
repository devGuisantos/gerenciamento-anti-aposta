'use client';

import { useState } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import { Pause, Play, Target } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { useIsHydrated } from '@/hooks/use-is-hydrated';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';
import { formatBRL } from '@shared/ui/money-text';

import { PendingActionButton } from '../../_components/pending-action-button';
import type { Equivalence } from '../_equivalences';

const SLIDE_INTERVAL_MS = 4_000;

/** What the server renders, and what a no-JS reader keeps. Matches the carousel's
 *  visible count so the swap after hydration barely moves anything. */
const STATIC_PREVIEW_COUNT = 3;

/**
 * The same amount, as things instead of a number.
 *
 * It moves on its own, which has to be done carefully: WCAG 2.2.2 says anything
 * auto-moving for more than five seconds needs a way to stop it. So it pauses on
 * hover and on keyboard focus, carries a visible pause control, and never starts
 * for a reader whose system asks for reduced motion.
 *
 * The carousel itself only mounts **after** hydration. Embla initialises in a
 * layout effect and immediately reports different arrow states than the server
 * assumed — with `loop: true` you can always scroll back, so `disabled` flips and
 * React reports a hydration mismatch. Rendering a plain list first and swapping
 * afterwards is a normal post-hydration update rather than a mismatch, and it
 * keeps the equivalences in the server HTML instead of hiding them behind JS.
 */
export function SpendingEquivalences({
  equivalences,
}: {
  readonly equivalences: readonly Equivalence[];
}) {
  const isHydrated = useIsHydrated();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isPlaying, setIsPlaying] = useState(true);

  /* Created once and never replaced: a fresh plugin instance on each render would
     restart the timer and make the slides stutter. State rather than a ref because
     the render reads it. */
  const [autoplay] = useState(() =>
    Autoplay({
      delay: SLIDE_INTERVAL_MS,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
      stopOnFocusIn: true,
    }),
  );

  if (equivalences.length === 0) return null;

  const isMoving = isPlaying && !prefersReducedMotion;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Com esse valor, daria para ter:</p>
        {isHydrated && !prefersReducedMotion ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 text-xs"
            aria-label={isMoving ? 'Pausar o carrossel' : 'Retomar o carrossel'}
            onClick={() => setIsPlaying((playing) => !playing)}
          >
            {isMoving ? <Pause /> : <Play />}
            {isMoving ? 'Pausar' : 'Passar'}
          </Button>
        ) : null}
      </div>

      {isHydrated ? (
        <Carousel
          opts={{ loop: true, align: 'start' }}
          plugins={isMoving ? [autoplay] : []}
          className="w-full"
        >
          <CarouselContent>
            {equivalences.map((equivalence) => (
              <CarouselItem key={equivalence.id} className="sm:basis-1/2 lg:basis-1/3">
                <EquivalenceCard equivalence={equivalence} />
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Arrows sit inside the padding on mobile so they never hang off the card.
              The aria-labels are set here because the vendored primitive ships English
              sr-only text, and aria-label wins over element content. */}
          <CarouselPrevious aria-label="Anterior" className="-left-2 size-8 sm:-left-4" />
          <CarouselNext aria-label="Próximo" className="-right-2 size-8 sm:-right-4" />
        </Carousel>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {equivalences.slice(0, STATIC_PREVIEW_COUNT).map((equivalence) => (
            <li key={equivalence.id}>
              <EquivalenceCard equivalence={equivalence} />
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        Os meses usam a sua própria média de gastos. Os preços dos objetos são valores aproximados,
        só para dar uma ideia de tamanho.
      </p>
    </div>
  );
}

function EquivalenceCard({ equivalence }: { readonly equivalence: Equivalence }) {
  return (
    /* bg-muted, not bg-background: --background and --card are the same white in
       the light theme, so a bg-background panel sitting on a Card is invisible
       there while looking fine in dark mode. */
    <div className="flex h-full flex-col gap-3 rounded-lg bg-muted p-4">
      <div className="flex-1">
        <p className="font-heading text-xl font-semibold tracking-tight">{equivalence.text}</p>
        <p className="mt-1 text-xs text-muted-foreground">{equivalence.detail}</p>
      </div>

      {/* Every card ends in a row of the same height, so the ones without a goal do
          not sit on a hole. A bill you already pay every month is not something to
          save up for, and saying so is more use than blank space. */}
      {equivalence.targetInCents === null ? (
        <p className="flex h-9 items-center text-xs text-muted-foreground">
          Uma conta que você já paga todo mês.
        </p>
      ) : (
        <GoalAction label={equivalence.text} targetInCents={equivalence.targetInCents} />
      )}
    </div>
  );
}

/**
 * Turns "you could have had this" into "you could still have this" — the forward
 * half of the reframing, and the autonomy mechanic `gamification` describes: the
 * user decides how much to stop spending *and where it goes*.
 *
 * TODO(gamification): wire to a `CreateGoal` command taking { label, targetInCents }
 * and emitting `GoalCreated`. The dashboard's goal card and `/goals` both read the
 * result, and `GoalReached` already exists in the module's event list. Keep the
 * target as the amount shown on the card — a goal for a different number than the
 * one the reader just looked at is its own kind of lie.
 */
function GoalAction({
  label,
  targetInCents,
}: {
  readonly label: string;
  readonly targetInCents: number;
}) {
  return (
    <PendingActionButton
      className="w-full"
      pendingMessage={`Seria uma meta de ${formatBRL(targetInCents)} para ${label}, mas o módulo de metas ainda não existe — nada foi guardado.`}
    >
      <Target />
      Criar meta
    </PendingActionButton>
  );
}
