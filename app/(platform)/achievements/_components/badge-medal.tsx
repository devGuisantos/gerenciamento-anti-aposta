'use client';

import { Trophy } from 'lucide-react';
import { motion } from 'motion/react';

import { assertNever } from '@shared/domain/assert-never';

import { BADGE_FAMILY_DESCRIPTORS, type BadgeFamily } from '../_badge';
import type { BadgeStatus } from '../_badges-view';

/**
 * The large badge mark the dialogs are built around.
 *
 * How it arrives is the whole point of the component, so the three entrances are
 * named rather than inferred from a flag:
 *
 * - `CELEBRATE` — the spring pop and the two halo rings, for a badge that was
 *   **just awarded**. It plays once, on an event that happened. There is no loop:
 *   a mark that keeps pulsing is an attractor built to pull the eye back, which is
 *   a slot-machine technique and not a celebration.
 * - `SETTLE` — a quarter-second fade and scale, for the detail dialog. Enough that
 *   the mark does not snap into place, far short of a party for something that
 *   happened three weeks ago.
 * - `NONE` — the final state, rendered with no Motion at all. What anybody who
 *   asked their system for less motion gets, and it is identical in every respect
 *   except the travel (WCAG 2.3.3).
 *
 * The animation carries no information: the dialog says in words what the badge is
 * and whether it is earned, so missing the movement costs nothing.
 */

export type MedalEntrance = 'CELEBRATE' | 'SETTLE' | 'NONE';

type BadgeMedalProps = {
  /** `null` for a badge the catalogue does not know — see `findBadgeDefinition`. */
  readonly family: BadgeFamily | null;
  readonly status: BadgeStatus;
  readonly entrance: MedalEntrance;
};

/** Both halos, offset so they read as one expanding pulse rather than two rings. */
const HALO_DELAYS_IN_SECONDS = [0, 0.18] as const;
const HALO_DURATION_IN_SECONDS = 0.9;

export function BadgeMedal({ family, status, entrance }: BadgeMedalProps) {
  /* The sidebar already uses Trophy for Conquistas, so an unknown family lands on
     iconography the reader has seen rather than on an empty disc. */
  const Glyph = family === null ? Trophy : BADGE_FAMILY_DESCRIPTORS[family].icon;
  const surfaceClassName =
    status === 'EARNED'
      ? 'bg-primary text-primary-foreground'
      : 'bg-muted text-muted-foreground ring-1 ring-foreground/10';

  return (
    <span aria-hidden className="relative flex size-20 shrink-0 items-center justify-center">
      {entrance === 'CELEBRATE'
        ? HALO_DELAYS_IN_SECONDS.map((delay) => (
            <motion.span
              key={delay}
              className="absolute inset-0 rounded-full ring-2 ring-foreground/30"
              initial={{ scale: 0.7, opacity: 0.45 }}
              animate={{ scale: 2.1, opacity: 0 }}
              transition={{ duration: HALO_DURATION_IN_SECONDS, delay, ease: 'easeOut' }}
            />
          ))
        : null}

      <MedalSurface entrance={entrance} className={surfaceClassName}>
        <MedalIcon entrance={entrance}>
          <Glyph className="size-9" />
        </MedalIcon>
      </MedalSurface>
    </span>
  );
}

function MedalSurface({
  entrance,
  className,
  children,
}: {
  readonly entrance: MedalEntrance;
  readonly className: string;
  readonly children: React.ReactNode;
}) {
  const shared = `relative flex size-20 items-center justify-center rounded-full ${className}`;

  switch (entrance) {
    case 'CELEBRATE':
      return (
        <motion.span
          className={shared}
          initial={{ scale: 0.3, rotate: -18, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          /* Underdamped on purpose: it overshoots once and settles, which is what
             reads as arriving rather than appearing. */
          transition={{ type: 'spring', stiffness: 380, damping: 14, mass: 0.8 }}
        >
          {children}
        </motion.span>
      );
    case 'SETTLE':
      return (
        <motion.span
          className={shared}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {children}
        </motion.span>
      );
    case 'NONE':
      return <span className={shared}>{children}</span>;
    default:
      return assertNever(entrance);
  }
}

/** The glyph lands a beat after the disc, so the two do not arrive as one lump. */
function MedalIcon({
  entrance,
  children,
}: {
  readonly entrance: MedalEntrance;
  readonly children: React.ReactNode;
}) {
  if (entrance !== 'CELEBRATE') return <span>{children}</span>;

  return (
    <motion.span
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.14, type: 'spring', stiffness: 500, damping: 18 }}
    >
      {children}
    </motion.span>
  );
}
