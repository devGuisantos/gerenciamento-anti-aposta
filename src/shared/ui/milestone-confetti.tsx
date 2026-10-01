'use client';

import { createPortal } from 'react-dom';
import { motion } from 'motion/react';

/**
 * A one-off burst for a milestone the user actually reached.
 *
 * Two events earn it and no others: `GoalReached`, the movement that *crosses* a
 * savings target the user set, and `BadgeAwarded`, a badge the platform just
 * granted. It lives in the shared kernel because both of those belong to
 * different screens and a celebration that drifts into two slightly different
 * versions is a celebration nobody can reason about.
 *
 * The gamification rules forbid any mechanic that imitates a gambling loop, and
 * this is the mechanic that comes closest, so the boundaries are worth stating:
 *
 * - **It is fully predictable.** It fires on a milestone that was reached, and
 *   never on progress toward one. No variable ratio, nothing random about
 *   *whether* it appears. Only the particle physics is randomised, and that
 *   decides how it looks, never whether it comes.
 * - **There is no near-miss.** It never plays at 90%, and nothing on any screen
 *   teases it. A near-miss animation is the exact effect a slot machine sells.
 * - **It is not a reward for playing.** Reaching the milestone is the milestone;
 *   putting money in or opening the app is not. Confetti on every deposit would
 *   be participation applause, which the rules put in the same bin as a badge
 *   nobody earned.
 * - **It carries no information.** Everything it says is also said by the toast,
 *   the dialog or the card beside it, so nobody who never sees it misses
 *   anything. That is what lets it be skipped entirely for anyone who asked their
 *   system for less motion (WCAG 2.3.3) — callers gate it, by handing `burst` as
 *   `null`.
 * - **It never fires on a page load.** A burst for something that happened three
 *   weeks ago is applause for nothing having occurred. Callers create the burst in
 *   the handler for the event itself.
 *
 * This is the one place in the product with decorative colour, and it is allowed
 * here precisely because it means nothing: it is `aria-hidden`, it repeats what
 * its caller already said in words, and it is gone in two seconds. Nothing else
 * may reach for these tokens — the monochrome palette is what gives
 * `--destructive` its force, and the celebration hues are kept well clear of it so
 * a falling particle can never read as a gambling amount.
 */

const PARTICLE_COUNT = 70;
const DURATION_IN_SECONDS = 2.4;

/** Pixels, as spread from the burst origin. */
const MINIMUM_SPREAD = 90;
const MAXIMUM_SPREAD = 420;

/** How far below the burst everything ends up, once gravity has had its way. */
const FALL_DISTANCE = 620;

const MAXIMUM_SPIN_IN_DEGREES = 720;
const MAXIMUM_DELAY_IN_SECONDS = 0.18;

/**
 * The celebration tokens from `globals.css`, which carry a light and a dark value
 * each. Not `bg-chart-*`: those are fixed lightness greys, identical in both
 * themes, so half of them would disappear into one of the two backgrounds.
 */
const TONE_CLASS_NAMES = [
  'bg-celebration-1',
  'bg-celebration-2',
  'bg-celebration-3',
  'bg-celebration-4',
  'bg-celebration-5',
] as const;

type ConfettiParticle = {
  readonly id: number;
  readonly peakX: number;
  readonly peakY: number;
  readonly endX: number;
  readonly endY: number;
  readonly spin: number;
  readonly widthInPixels: number;
  readonly heightInPixels: number;
  readonly delayInSeconds: number;
  readonly toneClassName: string;
  readonly isRound: boolean;
};

export type ConfettiBurst = {
  readonly id: string;
  readonly particles: readonly ConfettiParticle[];
};

function between(minimum: number, maximum: number): number {
  return minimum + Math.random() * (maximum - minimum);
}

function toParticle(id: number): ConfettiParticle {
  const angle = Math.random() * Math.PI * 2;
  const spread = between(MINIMUM_SPREAD, MAXIMUM_SPREAD);
  const peakX = Math.cos(angle) * spread;
  const peakY = Math.sin(angle) * spread;

  return {
    id,
    peakX,
    peakY,
    /* Drifts a little further sideways on the way down rather than dropping
       straight, which is what makes it read as paper instead of rain. */
    endX: peakX * between(1.1, 1.5),
    endY: peakY + between(FALL_DISTANCE * 0.6, FALL_DISTANCE),
    spin: between(-MAXIMUM_SPIN_IN_DEGREES, MAXIMUM_SPIN_IN_DEGREES),
    widthInPixels: between(5, 11),
    heightInPixels: between(5, 16),
    delayInSeconds: Math.random() * MAXIMUM_DELAY_IN_SECONDS,
    toneClassName: TONE_CLASS_NAMES[Math.floor(Math.random() * TONE_CLASS_NAMES.length)],
    isRound: Math.random() < 0.3,
  };
}

/**
 * Built in an event handler, never while rendering: `Math.random()` during render
 * is impure, and React 19 is entitled to call a render twice and get two different
 * bursts.
 */
export function createConfettiBurst(): ConfettiBurst {
  return {
    id: crypto.randomUUID(),
    particles: Array.from({ length: PARTICLE_COUNT }, (_, index) => toParticle(index)),
  };
}

type MilestoneConfettiProps = {
  readonly burst: ConfettiBurst | null;
  readonly onFinished: () => void;
};

export function MilestoneConfetti({ burst, onFinished }: MilestoneConfettiProps) {
  /* Nothing is rendered on the server, which is also what makes the portal safe. */
  if (burst === null) return null;

  return createPortal(
    /* Decoration only, and it must never be in the way: `aria-hidden` because the
       caller already carries the message in words, and `pointer-events-none` so
       the page underneath stays usable while it falls. */
    <div
      aria-hidden
      /* Above the dialog layer: a badge is celebrated from inside a modal, and at
         z-50 the burst would fall behind its overlay and be dimmed and blurred
         by it. Nothing else in the product sits this high. */
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
      data-slot="milestone-confetti"
    >
      {burst.particles.map((particle, index) => (
        <Particle
          key={particle.id}
          particle={particle}
          /* One particle reports the end for the whole burst, so it clears itself
             without a timer to leak. */
          onFinished={index === 0 ? onFinished : undefined}
        />
      ))}
    </div>,
    document.body,
  );
}

type ParticleProps = {
  readonly particle: ConfettiParticle;
  readonly onFinished?: () => void;
};

function Particle({ particle, onFinished }: ParticleProps) {
  const timing = {
    duration: DURATION_IN_SECONDS,
    delay: particle.delayInSeconds,
  };

  return (
    <motion.span
      className={`absolute top-1/2 left-1/2 ${particle.toneClassName} ${
        particle.isRound ? 'rounded-full' : 'rounded-[1px]'
      }`}
      style={{ width: particle.widthInPixels, height: particle.heightInPixels }}
      initial={{ x: 0, y: 0, rotate: 0, opacity: 0, scale: 0.4 }}
      animate={{
        x: [0, particle.peakX, particle.endX],
        y: [0, particle.peakY, particle.endY],
        rotate: [0, particle.spin],
        opacity: [0, 1, 1, 0],
        scale: [0.4, 1, 1],
      }}
      transition={{
        ...timing,
        /* Out fast, then fall: one ease for the whole path would float. */
        x: { ...timing, times: [0, 0.35, 1], ease: ['easeOut', 'linear'] },
        y: { ...timing, times: [0, 0.35, 1], ease: ['easeOut', 'easeIn'] },
        opacity: { ...timing, times: [0, 0.06, 0.65, 1] },
        scale: { ...timing, times: [0, 0.2, 1] },
      }}
      onAnimationComplete={onFinished}
    />
  );
}
