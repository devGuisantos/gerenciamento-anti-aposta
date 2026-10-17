/**
 * Presentation model for the Apostas screen, built from `GET /bets/summary`.
 *
 * Nothing here decides a figure. The grouping by house, the net total, the
 * counts, the tallies, the hour bands and the reframing all arrive computed by
 * `bet-detection` — and `cost.total` is the statement's `betSpend` for the same
 * window, so the two screens cannot disagree. What this file adds is words and
 * bar widths: dates turned into labels **once, on the server**, in São Paulo.
 */
import type {
  BettingSummary,
  BetWindowInDays,
  BookmakerSummary,
  DetectionTally,
  HourBucket,
} from '@modules/bet-detection';
import type { LedgerPeriod } from '@modules/open-finance';

import type { DetectionConfidence, DetectionReason } from '../transactions/_ledger-entry';
import { DEFAULT_FILTERS, toStatementHref } from '../transactions/_statement-params';

const TIME_ZONE = 'America/Sao_Paulo';
const HOURS_PER_BUCKET = 3;
const HOURS_PER_DAY = 24;

const FULL_DATE_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

const SHORT_DATE_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: 'short',
});

/** The statement's period for the same window, so "Ver no extrato" opens this exact slice. */
const LEDGER_PERIOD_FOR_WINDOW: Readonly<Record<BetWindowInDays, LedgerPeriod>> = {
  30: 'LAST_30_DAYS',
  90: 'LAST_90_DAYS',
  180: 'LAST_180_DAYS',
  360: 'LAST_360_DAYS',
};

export type BookmakerDetectionView = {
  readonly reason: DetectionReason;
  readonly count: number;
};

export type BookmakerView = {
  readonly id: string;
  readonly name: string;
  readonly transactionCount: number;
  readonly totalInCents: number;
  /** 0–100 against the largest bookmaker, for the bar width. */
  readonly relativeShare: number;
  /**
   * The weakest confidence among the house's bets, with the reason of a bet
   * that actually has it — never one policy's reason beside another's confidence.
   */
  readonly weakestReason: DetectionReason;
  readonly lowestConfidence: DetectionConfidence;
  /** Every policy that matched, most frequent first. */
  readonly detections: readonly BookmakerDetectionView[];
  readonly firstSeenLabel: string;
  readonly lastSeenLabel: string;
  /** The house's own rows in the statement, over the same window. */
  readonly statementHref: string;
};

export type DetectionTallyView = {
  readonly reason: DetectionReason;
  readonly count: number;
  readonly share: number;
};

export type HourBucketView = {
  readonly label: string;
  readonly startHour: number;
  readonly count: number;
  /** 0–100 against the busiest bucket. */
  readonly relativeShare: number;
};

export type IncomeShare = {
  readonly incomeInCents: number;
  /** Percentage of everything that came in, rounded. May exceed 100. */
  readonly percentage: number;
};

export type BetCostView = {
  /** Net of refunds. */
  readonly totalInCents: number;
  readonly transactionCount: number;
  readonly bookmakerCount: number;
  readonly sinceLabel: string | null;
  readonly refundTotalInCents: number;
  readonly refundCount: number;
  readonly yieldEquivalentInCents: number;
  /** "11,4" — the backend's rate, worded for the copy beside the figure. */
  readonly ratePercentLabel: string;
  readonly incomeShare: IncomeShare | null;
  readonly statementHref: string;
};

export function toStatementHrefForWindow(
  days: BetWindowInDays,
  bookmakerId: string | null,
): string {
  return toStatementHref({
    ...DEFAULT_FILTERS,
    type: 'BETS',
    period: LEDGER_PERIOD_FOR_WINDOW[days],
    bookmakerId,
  });
}

function toPercentLabel(percent: number): string {
  return percent.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

export function toBetCostView(summary: BettingSummary, days: BetWindowInDays): BetCostView {
  const { cost, incomeShare } = summary;

  return {
    totalInCents: cost.total.amountInCents,
    transactionCount: cost.transactionCount,
    bookmakerCount: cost.bookmakerCount,
    sinceLabel: cost.firstBetAt === null ? null : FULL_DATE_FORMAT.format(new Date(cost.firstBetAt)),
    refundTotalInCents: cost.refunds.total.amountInCents,
    refundCount: cost.refunds.count,
    yieldEquivalentInCents: summary.yield.betYieldEquivalent.amountInCents,
    ratePercentLabel: toPercentLabel(summary.yield.annualRatePercent),
    incomeShare:
      incomeShare === null
        ? null
        : { incomeInCents: incomeShare.income.amountInCents, percentage: incomeShare.percentage },
    statementHref: toStatementHrefForWindow(days, null),
  };
}

/** The backend ranks largest first; the order is kept as it arrives. */
export function toBookmakerViews(
  bookmakers: readonly BookmakerSummary[],
  days: BetWindowInDays,
): readonly BookmakerView[] {
  const largest = Math.max(0, ...bookmakers.map((bookmaker) => bookmaker.total.amountInCents));

  return bookmakers.map((bookmaker) => ({
    id: bookmaker.bookmakerId,
    name: bookmaker.name,
    transactionCount: bookmaker.transactionCount,
    totalInCents: bookmaker.total.amountInCents,
    relativeShare: toShare(bookmaker.total.amountInCents, largest),
    weakestReason: bookmaker.weakest.matchedBy,
    lowestConfidence: bookmaker.weakest.confidence,
    detections: bookmaker.detections
      .map((detection) => ({ reason: detection.matchedBy, count: detection.count }))
      .toSorted((left, right) => right.count - left.count),
    firstSeenLabel: SHORT_DATE_FORMAT.format(new Date(bookmaker.firstSeenAt)),
    lastSeenLabel: SHORT_DATE_FORMAT.format(new Date(bookmaker.lastSeenAt)),
    statementHref: toStatementHrefForWindow(days, bookmaker.bookmakerId),
  }));
}

export function toDetectionTallyViews(
  tallies: readonly DetectionTally[],
): readonly DetectionTallyView[] {
  return tallies
    .map((tally) => ({ reason: tally.matchedBy, count: tally.count, share: tally.sharePercent }))
    .toSorted((left, right) => right.count - left.count);
}

function toShare(value: number, largest: number): number {
  return largest === 0 ? 0 : Math.round((value / largest) * 100);
}

function toTwoDigits(hour: number): string {
  return String(hour).padStart(2, '0');
}

function toBucketLabel(startHour: number): string {
  const end = (startHour + HOURS_PER_BUCKET) % HOURS_PER_DAY;
  return `${toTwoDigits(startHour)}h–${toTwoDigits(end)}h`;
}

/** Eight three-hour bands, as the backend counted them in São Paulo time. */
export function toHourBucketViews(buckets: readonly HourBucket[]): readonly HourBucketView[] {
  const busiest = Math.max(0, ...buckets.map((bucket) => bucket.count));

  return buckets
    .toSorted((left, right) => left.startHour - right.startHour)
    .map((bucket) => ({
      label: toBucketLabel(bucket.startHour),
      startHour: bucket.startHour,
      count: bucket.count,
      relativeShare: toShare(bucket.count, busiest),
    }));
}

/** The single busiest band, for the sentence that says what the histogram shows. */
export function describeBusiestBand(
  buckets: readonly HourBucketView[],
  total: number,
): string | null {
  const busiest = buckets.toSorted((left, right) => right.count - left.count)[0];
  if (!busiest || busiest.count === 0 || total === 0) return null;

  const share = Math.round((busiest.count / total) * 100);
  return `${busiest.count} das ${total} apostas aconteceram entre ${busiest.label.replace('–', ' e ')} — ${share}% delas.`;
}
