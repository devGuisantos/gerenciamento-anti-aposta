'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useEntrance } from '@/hooks/use-entrance';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';

import { BADGE_FAMILY_DESCRIPTORS } from '../_badge';
import type { BadgeAward } from '../_badges-view';
import { BadgeCard } from './badge-card';
import { BadgeMedal } from './badge-medal';

/**
 * Any badge on the screen, opened in full.
 *
 * The whole card is the control, as every row in this product is: a card that
 * opens something has to be the tap target, not a chevron in its corner.
 *
 * **There is no confetti here, and that is the rule, not an omission.** This
 * dialog is a record — it opens on a badge the reader chose to look at, which may
 * have been earned months ago or not at all. Celebrating on demand would make the
 * celebration mean nothing, and firing it beside an *unearned* badge would be the
 * near-miss the gamification rules forbid outright. The burst belongs to
 * `BadgeAwarded`, in `BadgeAwardedDialog`, once.
 *
 * What it does instead is the honest version of a reward: it names what the badge
 * takes, what satisfied it or how far it stands, and where the figure behind it
 * can be checked.
 */
export function BadgeDialog({ award }: { readonly award: BadgeAward }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`${award.definition.title} — ${
            award.status === 'EARNED' ? 'conquistada' : 'ainda não conquistada'
          }. Ver detalhes.`}
          /* A small lift is the whole hover affordance: the card already looks
             like a card, and `motion-safe` keeps it out of the way of anyone who
             asked for less movement. */
          className="block w-full rounded-xl text-left outline-none transition-transform motion-safe:hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BadgeCard award={award} />
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        {/* Mounted only while open, so the medal's entrance and the progress bar's
            growth actually play rather than being settled before anyone looks. */}
        {isOpen ? <BadgeBody award={award} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function BadgeBody({ award }: { readonly award: BadgeAward }) {
  const { definition, status, detail, progressPercentage, currentValue } = award;
  const descriptor = BADGE_FAMILY_DESCRIPTORS[definition.family];
  const prefersReducedMotion = usePrefersReducedMotion();
  const hasEntered = useEntrance();
  const isEarned = status === 'EARNED';

  return (
    <>
      <div className="flex flex-col items-center gap-4 pt-2 text-center">
        <BadgeMedal
          family={definition.family}
          status={status}
          entrance={prefersReducedMotion ? 'NONE' : 'SETTLE'}
        />

        <DialogHeader>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {descriptor.label}
          </p>
          <DialogTitle className="text-xl">{definition.title}</DialogTitle>
          <DialogDescription>{definition.criterion}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap justify-center gap-2">
          {/* The word carries the state; the filled mark only repeats it. */}
          <Badge variant={isEarned ? 'secondary' : 'outline'}>
            {isEarned ? 'Conquistada' : 'Ainda não conquistada'}
          </Badge>
          {descriptor.evidence === 'SELF_REPORTED' ? (
            <Badge variant="outline" className="font-normal">
              Registrado por você
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1 rounded-lg bg-muted p-4">
          <p className="text-xs text-muted-foreground">
            {isEarned ? 'O que você fez' : 'Onde isso está hoje'}
          </p>
          <p className="text-sm">{detail}</p>
        </div>

        {isEarned ? null : (
          <div className="space-y-2">
            <Progress
              /* Grown from zero on mount, which the primitive's own
                 `transition-all` handles. Reduced motion starts at the final
                 value, so there is nothing for it to travel. */
              value={prefersReducedMotion || hasEntered ? progressPercentage : 0}
              aria-label={`Progresso para a conquista ${definition.title}: ${detail}`}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground tabular-nums">
              {currentValue} de {definition.threshold} {descriptor.unit.many}
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">{descriptor.description}</p>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="ghost" className="h-10">
            Fechar
          </Button>
        </DialogClose>
        <Button asChild variant="outline" className="h-10">
          <Link href={descriptor.evidenceLink.href}>
            {descriptor.evidenceLink.label}
            <ArrowUpRight />
          </Link>
        </Button>
      </DialogFooter>
    </>
  );
}
