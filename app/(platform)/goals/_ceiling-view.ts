/**
 * Presentation model for the betting ceiling: month keys into labels, money
 * objects into cents, and nothing decided.
 *
 * Every outcome, every margin, the open month's reframing and every stop of the
 * simulator arrive computed from `gamification` on the backend, against the same
 * monthly figures `/transactions/insights` draws. Months are São Paulo calendar
 * months, keyed `YYYY-MM` there, and labelled here in the same timezone.
 */
import type {
  BettingCeilingOverview,
  CeilingCycle,
  CeilingTerm,
  CurrentCeilingCycle,
  CycleStatus,
  SimulationStep,
} from '@modules/gamification';
import { formatBRL } from '@shared/ui/money-text';

const TIME_ZONE = 'America/Sao_Paulo';

const MONTH_AND_YEAR_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  month: 'long',
  year: 'numeric',
});

const MONTH_FORMAT = new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE, month: 'long' });

/** Mid-month at noon UTC: the same calendar month in São Paulo whatever the offset. */
function middleOf(monthKey: string): Date {
  return new Date(`${monthKey}-15T12:00:00.000Z`);
}

/** "outubro de 2026". */
export function toMonthLabel(monthKey: string): string {
  return MONTH_AND_YEAR_FORMAT.format(middleOf(monthKey));
}

/** "novembro". */
export function toMonthName(monthKey: string): string {
  return MONTH_FORMAT.format(middleOf(monthKey));
}

/** The rate as the copy states it: "9,3". */
export function toRateLabel(annualRatePercent: number): string {
  return annualRatePercent.toFixed(1).replace('.', ',');
}

export type CycleRow = {
  readonly monthKey: string;
  readonly monthLabel: string;
  readonly ceilingInCents: number;
  readonly destination: string | null;
  readonly spentInCents: number;
  readonly status: CycleStatus;
  /** Positive while spending stayed under the ceiling, negative once it passed. */
  readonly marginInCents: number;
  /** Uncapped on purpose — the bar caps it, the words keep the real number. */
  readonly usedPercentage: number;
};

export type CurrentCycleRow = CycleRow & {
  /** `|margin|` over twelve months at the response's rate, from `awareness`. */
  readonly marginYieldEquivalentInCents: number;
};

export function toCycleRow(cycle: CeilingCycle): CycleRow {
  return {
    monthKey: cycle.monthKey,
    monthLabel: toMonthLabel(cycle.monthKey),
    ceilingInCents: cycle.ceiling.amountInCents,
    destination: cycle.destination,
    spentInCents: cycle.spent.amountInCents,
    status: cycle.status,
    marginInCents: cycle.margin.amountInCents,
    usedPercentage: cycle.usedPercent,
  };
}

/**
 * How far a month sat from its ceiling, in one phrase. Shared so the goal screen
 * and the dashboard card cannot word the same fact two different ways.
 *
 * It reports a distance and nothing more. "R$ 640,00 acima do teto" is something
 * the reader can do what they like with; anything warmer or colder would be the
 * product having an opinion about their month.
 */
export function describeCycleMargin(cycle: Pick<CycleRow, 'marginInCents'>): string {
  const distance = formatBRL(Math.abs(cycle.marginInCents));
  return cycle.marginInCents < 0 ? `${distance} acima do teto` : `${distance} abaixo do teto`;
}

export function toCurrentCycleRow(cycle: CurrentCeilingCycle): CurrentCycleRow {
  return {
    ...toCycleRow(cycle),
    marginYieldEquivalentInCents: cycle.marginYieldEquivalent.amountInCents,
  };
}

/** A change the user chose that has not started governing yet. */
export type ScheduledCeiling = {
  readonly ceilingInCents: number;
  readonly monthName: string;
};

export function toScheduledCeiling(term: CeilingTerm | null): ScheduledCeiling | null {
  if (term === null) return null;

  return {
    ceilingInCents: term.amount.amountInCents,
    monthName: toMonthName(term.effectiveFromMonthKey),
  };
}

export type SimulatorModel = {
  readonly steps: readonly SimulationStep[];
  readonly stepInCents: number;
  readonly capInCents: number;
  readonly monthsCounted: number;
  /** Opens on the user's own value, so the first thing they see is theirs. */
  readonly initialCeilingInCents: number;
};

/**
 * Snapped to the track, because the backend widens the step when a heavy month
 * stretches it, and a value between two stops has no figure to show.
 */
function snapToStep(amountInCents: number, model: Pick<SimulatorModel, 'stepInCents' | 'capInCents'>): number {
  const snapped = Math.round(amountInCents / model.stepInCents) * model.stepInCents;

  return Math.min(Math.max(snapped, 0), model.capInCents);
}

export function toSimulatorModel(overview: BettingCeilingOverview): SimulatorModel {
  const { simulation } = overview;
  const chosen = overview.scheduled ?? overview.ceiling;
  const range = { stepInCents: simulation.stepInCents, capInCents: simulation.cap.amountInCents };

  return {
    steps: simulation.steps,
    ...range,
    monthsCounted: simulation.monthsCounted,
    initialCeilingInCents: snapToStep(chosen?.amount.amountInCents ?? range.capInCents / 2, range),
  };
}

/** The stop the slider sits on. The track starts at zero, one stop per step. */
export function stepAt(model: SimulatorModel, ceilingInCents: number): SimulationStep | null {
  return model.steps[Math.round(ceilingInCents / model.stepInCents)] ?? null;
}
