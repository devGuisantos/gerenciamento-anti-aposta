/**
 * How the screen presents the badge families: labels, marks, units and where
 * each figure can be checked.
 *
 * The catalogue itself — ids, thresholds, titles and criteria — and every
 * award are `gamification`'s on the backend (`docs/features/achievements.md`
 * there); this file decides nothing about who earned what. The module's rules,
 * written where the presentation is so they are hard to drift from:
 *
 * - **Every badge marks a genuine milestone, never participation.** Nothing is
 *   awarded for opening the app, connecting an account, setting a goal or
 *   logging a movement. A badge somebody did not earn devalues every other one,
 *   and this audience can tell the difference immediately.
 * - **Every criterion is visible before it is met.** There are no hidden badges
 *   and nothing is revealed by chance. A secret award is loot-box framing, which
 *   is the psychology this product exists to oppose.
 * - **A badge is never revoked.** It records something that happened; taking it
 *   back when a streak breaks would be a punishment, and the product does not
 *   punish. This is the same reasoning that restarts a broken streak quietly.
 * - **There are no points, levels or rankings.** The module is built on
 *   Self-Determination Theory, where the mechanic has to support competence
 *   rather than replace it with a score. A number that only exists to go up is
 *   the extrinsic motivator SDT warns about, and a leaderboard would turn a
 *   private financial difficulty into a comparison with other people.
 * - **Relatedness is deliberately absent.** The module reserves shareable
 *   achievements for later and always opt-in, so there is no share affordance
 *   here rather than one that pretends.
 *
 * The celebration belongs to `BadgeAwarded`, in the notification — never to
 * this screen, which is a record of things that already happened.
 */
import { Flame, PiggyBank, Target, TrendingDown } from 'lucide-react';

import type { BadgeFamily } from '@modules/gamification';
import { assertNever } from '@shared/domain/assert-never';

export type { BadgeFamily };

/**
 * Where the figure behind a family comes from, which changes what a card may
 * claim. A streak is measured in a statement we read; a savings goal is recorded
 * by the user, and a badge for it can only ever be as right as what they logged.
 * The cards say which, because letting the two look identical would lend the
 * self-reported half a certainty it has not got.
 */
export type BadgeEvidence = 'MEASURED' | 'SELF_REPORTED';

export type BadgeFamilyDescriptor = {
  /** The family's segment under `/achievements`, where its whole list is shown. */
  readonly slug: string;
  readonly label: string;
  readonly description: string;
  readonly evidence: BadgeEvidence;
  readonly icon: typeof Flame;
  /** The unit the remaining distance is counted in. */
  readonly unit: { readonly one: string; readonly many: string };
  /**
   * Where the figure behind the family is shown in full, so a reader who doubts a
   * badge can go and check it. Navigation, never advice: it points at the screen
   * the number came from and says nothing about what to do there.
   */
  readonly evidenceLink: { readonly href: string; readonly label: string };
};

export const BADGE_FAMILY_DESCRIPTORS: Readonly<Record<BadgeFamily, BadgeFamilyDescriptor>> = {
  STREAK: {
    slug: 'streak',
    label: 'Dias sem apostas',
    description:
      'Contados no seu extrato: dias inteiros em que nenhuma aposta foi identificada. O dia de hoje só entra na conta quando termina.',
    evidence: 'MEASURED',
    icon: Flame,
    unit: { one: 'dia', many: 'dias' },
    evidenceLink: { href: '/transactions?filter=bets&period=all', label: 'Ver as apostas identificadas' },
  },
  CEILING: {
    slug: 'ceiling',
    label: 'Teto de gastos',
    description:
      'Meses fechados em que o gasto com apostas ficou dentro do teto que você mesmo definiu em Metas.',
    evidence: 'MEASURED',
    icon: Target,
    unit: { one: 'mês', many: 'meses' },
    evidenceLink: { href: '/goals', label: 'Ver o teto que você definiu' },
  },
  REDUCTION: {
    slug: 'reduction',
    label: 'Queda no gasto',
    description:
      'Meses fechados em que o gasto com apostas foi menor que no mês anterior. Comparação entre meses inteiros, nunca com o mês em andamento.',
    evidence: 'MEASURED',
    icon: TrendingDown,
    unit: { one: 'mês', many: 'meses' },
    evidenceLink: { href: '/transactions/insights', label: 'Ver o gasto mês a mês' },
  },
  SAVINGS: {
    slug: 'savings',
    label: 'Metas de poupança',
    description:
      'Metas que você registrou e concluiu. Estes valores são os que você anotou — o Open Finance mostra um extrato, não mostra que um dinheiro foi guardado de propósito.',
    evidence: 'SELF_REPORTED',
    icon: PiggyBank,
    unit: { one: 'meta', many: 'metas' },
    evidenceLink: { href: '/goals', label: 'Ver as suas metas' },
  },
};

/** One badge as the backend describes it: what it is, and what it takes. */
export type BadgeDefinition = {
  readonly id: string;
  readonly family: BadgeFamily;
  readonly title: string;
  /** What has to happen, in plain words, readable before it happens. */
  readonly criterion: string;
  /** The figure the family is measured in that this badge needs. */
  readonly threshold: number;
};

/**
 * Which family each of the backend's badge ids belongs to, mirrored the way any
 * enum is. A `BadgeAwarded` notification carries the id, its title and what was
 * done; this is what lets its dialog draw the family's mark before the screen
 * itself has been read.
 */
const FAMILY_BY_BADGE_ID: Readonly<Record<string, BadgeFamily>> = {
  'streak-7': 'STREAK',
  'streak-15': 'STREAK',
  'streak-30': 'STREAK',
  'streak-90': 'STREAK',
  'ceiling-1': 'CEILING',
  'ceiling-3': 'CEILING',
  'ceiling-6': 'CEILING',
  'reduction-1': 'REDUCTION',
  'reduction-3': 'REDUCTION',
  'savings-1': 'SAVINGS',
  'savings-3': 'SAVINGS',
};

/**
 * `null` rather than a throw for an unknown id: a notification is the one input
 * here that arrives from outside, and a stale or hand-published id must degrade
 * to the payload the notification carried, never to a blank dialog.
 */
export function findBadgeFamilyById(id: string): BadgeFamily | null {
  return FAMILY_BY_BADGE_ID[id] ?? null;
}

/** The order the families are rendered in: measured first, self-reported last. */
export const BADGE_FAMILY_ORDER: readonly BadgeFamily[] = [
  'STREAK',
  'CEILING',
  'REDUCTION',
  'SAVINGS',
];

/** Said in words beside every family, because it changes how much a badge is worth. */
export function describeEvidence(evidence: BadgeEvidence): string {
  switch (evidence) {
    case 'MEASURED':
      return 'Medido no extrato';
    case 'SELF_REPORTED':
      return 'Registrado por você';
    default:
      return assertNever(evidence);
  }
}

/**
 * Resolves the `/achievements/[family]` segment. `null` for anything else: the
 * segment is whatever somebody typed in the address bar, and the page answers an
 * unknown one with a 404 rather than an empty list.
 */
export function findBadgeFamilyBySlug(slug: string): BadgeFamily | null {
  return (
    BADGE_FAMILY_ORDER.find((family) => BADGE_FAMILY_DESCRIPTORS[family].slug === slug) ?? null
  );
}
