'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';
import type { PlatformNotification } from '@modules/notifications';
import { MilestoneConfetti, type ConfettiBurst } from '@shared/ui/milestone-confetti';

import { BADGE_FAMILY_DESCRIPTORS, findBadgeDefinition } from '../_badge';
import { BadgeMedal } from './badge-medal';

export type BadgeAwardedNotification = Extract<
  PlatformNotification,
  { kind: 'badge-awarded' }
>;

type BadgeAwardedDialogProps = {
  /** `null` while nothing has been awarded. */
  readonly notification: BadgeAwardedNotification | null;
  /**
   * Built by the caller in the handler for the event itself, never here: this
   * component renders, and `Math.random()` during render is impure.
   */
  readonly burst: ConfettiBurst | null;
  readonly onClose: () => void;
  readonly onBurstFinished: () => void;
};

/**
 * The celebration, and the only one in the product that interrupts.
 *
 * It opens on `BadgeAwarded` — a real event, arriving over the notification
 * stream — and that is the only thing that opens it. The rules it has to stay
 * inside, all of which follow from `src/modules/gamification/CLAUDE.md`:
 *
 * - **It fires on the award, not on a visit.** Opening `/achievements` never
 *   celebrates anything, however many badges are on it. A burst for something that
 *   happened three weeks ago is applause for nothing having occurred, and it would
 *   teach the reader that the celebration means nothing.
 * - **A badge is rare, which is what earns it the interruption.** Eleven exist. A
 *   modal for something that fired weekly would be harassment, and the
 *   notifications module forbids that explicitly.
 * - **A broken streak gets none of this.** It stays a quiet toast. Celebrating in a
 *   modal while reporting a setback in a toast is the no-shaming rule expressed as
 *   a layout decision, and inverting it would make the product punish.
 * - **Nothing is revealed.** The badge, its criterion and what satisfied it are all
 *   plain text, available on `/achievements` before and after. There is no reveal
 *   animation, no scratch-off, no "spin to see what you won".
 * - **The motion carries no information**, so anyone who asked for less of it loses
 *   nothing: the medal arrives without travel and the burst is simply not created.
 */
export function BadgeAwardedDialog({
  notification,
  burst,
  onClose,
  onBurstFinished,
}: BadgeAwardedDialogProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <>
      {/* Gated at render rather than at the event, so a reader who changes the
          system setting mid-session is honoured on the next burst instead of on
          the next reload. */}
      <MilestoneConfetti
        burst={prefersReducedMotion ? null : burst}
        onFinished={onBurstFinished}
      />

      <Dialog open={notification !== null} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          {notification ? (
            <AwardBody
              notification={notification}
              entrance={prefersReducedMotion ? 'NONE' : 'CELEBRATE'}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Each line arrives a beat after the one above it, top to bottom. */
const STAGGER = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } },
} as const;

const LINE = {
  hidden: { opacity: 0, y: 8 },
  shown: { opacity: 1, y: 0 },
} as const;

function AwardBody({
  notification,
  entrance,
}: {
  readonly notification: BadgeAwardedNotification;
  readonly entrance: 'CELEBRATE' | 'NONE';
}) {
  /* The payload carries the id; the catalogue carries the mark and the criterion.
     An id it does not know still renders, from the payload alone. */
  const definition = findBadgeDefinition(notification.badgeId);
  const descriptor = definition === null ? null : BADGE_FAMILY_DESCRIPTORS[definition.family];

  return (
    <>
      <div className="flex flex-col items-center gap-4 pt-2 text-center">
        <BadgeMedal
          family={definition?.family ?? null}
          status="EARNED"
          entrance={entrance}
        />

        <motion.div
          className="space-y-2"
          variants={STAGGER}
          initial={entrance === 'NONE' ? 'shown' : 'hidden'}
          animate="shown"
        >
          <motion.p
            variants={LINE}
            className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
          >
            Nova conquista
          </motion.p>

          {/* No `DialogHeader` around these, deliberately. Motion propagates a
              variant label through its own components only, so a plain `div`
              between the stagger container and these two would cut the chain and
              they would appear at once with no animation at all. The primitive
              contributed a flex column with a gap, which `space-y-2` above
              already does. */}
          <motion.div variants={LINE}>
            <DialogTitle className="text-2xl">{notification.title}</DialogTitle>
          </motion.div>
          <motion.div variants={LINE}>
            <DialogDescription>
              {definition?.criterion ?? notification.description}
            </DialogDescription>
          </motion.div>

          {definition === null ? null : (
            <motion.div variants={LINE} className="space-y-1 rounded-lg bg-muted p-4 text-left">
              <p className="text-xs text-muted-foreground">O que você fez</p>
              <p className="text-sm">{notification.description}</p>
            </motion.div>
          )}

          <motion.div variants={LINE} className="space-y-2">
            {descriptor?.evidence === 'SELF_REPORTED' ? (
              <Badge variant="outline" className="font-normal">
                Registrado por você
              </Badge>
            ) : null}
            {/* No screen in this product may suggest it moves money, and a
                celebration is exactly where somebody might assume it did. */}
            <p className="text-xs text-muted-foreground">
              É o registro de algo que aconteceu. Não muda o seu saldo e não tem nada a receber.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Primary action last in the DOM: the footer primitive reverses on mobile
          and right-aligns on desktop, so this is the order that reads the same at
          both widths. */}
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="ghost" className="h-10">
            Fechar
          </Button>
        </DialogClose>
        <Button asChild variant="outline" className="h-10">
          <Link href="/achievements">
            Ver minhas conquistas
            <ArrowUpRight />
          </Link>
        </Button>
      </DialogFooter>
    </>
  );
}
