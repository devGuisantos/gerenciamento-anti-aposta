/**
 * The window the Apostas screen counts over.
 *
 * Days rather than months because the reader picks "últimos 30 dias", not "este
 * mês" — a calendar month would make the headline figure jump on the first of the
 * month for reasons nobody asked about. The set is the backend's: any other
 * value is refused there, so the URL is normalised here first.
 */
import { BET_WINDOWS_IN_DAYS, type BetWindowInDays } from '@modules/bet-detection';

export type BetPeriodDays = BetWindowInDays;

export const BET_PERIODS: readonly BetPeriodDays[] = BET_WINDOWS_IN_DAYS;

/** The widest window, so the screen opens on the full accumulated cost. */
export const DEFAULT_BET_PERIOD: BetPeriodDays = 360;

/** A bad query string falls back to the default rather than breaking the page. */
export function toBetPeriod(raw: string | readonly string[] | undefined): BetPeriodDays {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number(value);
  return BET_PERIODS.find((period) => period === parsed) ?? DEFAULT_BET_PERIOD;
}
