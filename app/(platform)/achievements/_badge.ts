/**
 * The badge catalogue: what the product recognises, and on what grounds.
 *
 * It mirrors what `gamification`'s `BadgeCollection` will hold, so replacing the
 * fixture is a change of source, not of shape. The rules below are the module's
 * rules, written where the data is so they are hard to drift from:
 *
 * - **Every badge marks a genuine milestone, never participation.** Nothing here
 *   is awarded for opening the app, connecting an account, setting a goal or
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
 * TODO(gamification): `BADGE_DEFINITIONS` becomes the catalogue the module seeds
 * `BadgeCollection` from, and awarding emits `BadgeAwarded`. The celebration
 * belongs on that event, in the notification — never on this screen, which is a
 * record of things that already happened.
 */
import { Flame, PiggyBank, Target, TrendingDown } from 'lucide-react';

/** What a badge is counted in. One family, one figure, so no two can disagree. */
export type BadgeFamily = 'STREAK' | 'CEILING' | 'REDUCTION' | 'SAVINGS';

/**
 * Where the figure behind a family comes from, which changes what a card may
 * claim. A streak is measured in a statement we read; a savings goal is recorded
 * by the user, and a badge for it can only ever be as right as what they logged.
 * The cards say which, because letting the two look identical would lend the
 * self-reported half a certainty it has not got.
 */
export type BadgeEvidence = 'MEASURED' | 'SELF_REPORTED';

export type BadgeFamilyDescriptor = {
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
    label: 'Dias sem apostas',
    description:
      'Contados no seu extrato: dias inteiros em que nenhuma aposta foi identificada. O dia de hoje só entra na conta quando termina.',
    evidence: 'MEASURED',
    icon: Flame,
    unit: { one: 'dia', many: 'dias' },
    evidenceLink: { href: '/transactions?filter=bets&period=all', label: 'Ver as apostas identificadas' },
  },
  CEILING: {
    label: 'Teto de gastos',
    description:
      'Meses fechados em que o gasto com apostas ficou dentro do teto que você mesmo definiu em Metas.',
    evidence: 'MEASURED',
    icon: Target,
    unit: { one: 'mês', many: 'meses' },
    evidenceLink: { href: '/goals', label: 'Ver o teto que você definiu' },
  },
  REDUCTION: {
    label: 'Queda no gasto',
    description:
      'Meses fechados em que o gasto com apostas foi menor que no mês anterior. Comparação entre meses inteiros, nunca com o mês em andamento.',
    evidence: 'MEASURED',
    icon: TrendingDown,
    unit: { one: 'mês', many: 'meses' },
    evidenceLink: { href: '/transactions/insights', label: 'Ver o gasto mês a mês' },
  },
  SAVINGS: {
    label: 'Metas de poupança',
    description:
      'Metas que você registrou e concluiu. Estes valores são os que você anotou — o Open Finance mostra um extrato, não mostra que um dinheiro foi guardado de propósito.',
    evidence: 'SELF_REPORTED',
    icon: PiggyBank,
    unit: { one: 'meta', many: 'metas' },
    evidenceLink: { href: '/goals', label: 'Ver as suas metas' },
  },
};

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
 * Ordered by family and then by threshold, which is the order the screen renders
 * and the order a reader expects: the nearest milestone first.
 *
 * The thresholds are chosen to be reachable from where this audience starts.
 * Three bet-free days would be too small a thing to call an achievement; a year
 * would be unreachable for long enough to be discouraging. A week is a real
 * change in behaviour and the first one anybody would notice.
 */
export const BADGE_DEFINITIONS: readonly BadgeDefinition[] = [
  {
    id: 'streak-7',
    family: 'STREAK',
    title: 'Uma semana sem apostas',
    criterion: '7 dias seguidos sem nenhuma aposta identificada no extrato.',
    threshold: 7,
  },
  {
    id: 'streak-15',
    family: 'STREAK',
    title: 'Quinze dias sem apostas',
    criterion: '15 dias seguidos sem nenhuma aposta identificada no extrato.',
    threshold: 15,
  },
  {
    id: 'streak-30',
    family: 'STREAK',
    title: 'Um mês sem apostas',
    criterion: '30 dias seguidos sem nenhuma aposta identificada no extrato.',
    threshold: 30,
  },
  {
    id: 'streak-90',
    family: 'STREAK',
    title: 'Três meses sem apostas',
    criterion: '90 dias seguidos sem nenhuma aposta identificada no extrato.',
    threshold: 90,
  },
  {
    id: 'ceiling-1',
    family: 'CEILING',
    title: 'Um mês dentro do teto',
    criterion: 'Fechar um mês com o gasto em apostas dentro do teto que você definiu.',
    threshold: 1,
  },
  {
    id: 'ceiling-3',
    family: 'CEILING',
    title: 'Três meses seguidos dentro do teto',
    criterion: 'Fechar três meses seguidos dentro do teto que valia em cada um deles.',
    threshold: 3,
  },
  {
    id: 'ceiling-6',
    family: 'CEILING',
    title: 'Seis meses seguidos dentro do teto',
    criterion: 'Fechar seis meses seguidos dentro do teto que valia em cada um deles.',
    threshold: 6,
  },
  {
    id: 'reduction-1',
    family: 'REDUCTION',
    title: 'Um mês de queda',
    criterion: 'Fechar um mês gastando menos em apostas do que no mês anterior.',
    threshold: 1,
  },
  {
    id: 'reduction-3',
    family: 'REDUCTION',
    title: 'Três meses seguidos de queda',
    criterion: 'Fechar três meses seguidos gastando menos em apostas que no mês anterior.',
    threshold: 3,
  },
  {
    id: 'savings-1',
    family: 'SAVINGS',
    title: 'Primeira meta concluída',
    criterion: 'Chegar ao valor de uma meta de poupança que você registrou.',
    threshold: 1,
  },
  {
    id: 'savings-3',
    family: 'SAVINGS',
    title: 'Três metas concluídas',
    criterion: 'Chegar ao valor de três metas de poupança que você registrou.',
    threshold: 3,
  },
];

/**
 * Resolves a `BadgeAwarded` notification against the catalogue.
 *
 * `null` rather than a throw for an unknown id: a notification is the one input
 * here that arrives from outside this file, and a stale or hand-published id must
 * degrade to the payload the notification carried, never to a blank dialog.
 */
export function findBadgeDefinition(id: string): BadgeDefinition | null {
  return BADGE_DEFINITIONS.find((definition) => definition.id === id) ?? null;
}

/** The order the families are rendered in: measured first, self-reported last. */
export const BADGE_FAMILY_ORDER: readonly BadgeFamily[] = [
  'STREAK',
  'CEILING',
  'REDUCTION',
  'SAVINGS',
];
