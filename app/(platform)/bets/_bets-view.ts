/**
 * Presentation model for the Apostas screen.
 *
 * It reads the **same ledger entries the statement screen reads**, so the two can
 * never disagree about how much went to betting. Nothing here re-classifies
 * anything: `bet-detection` decides what a bet is, and this only groups what it
 * already decided.
 *
 * TODO(bet-detection): `BookmakerSummary` is the `Bookmaker` aggregate seen from
 * outside. When the module lands it exposes this, keyed by CNPJ rather than by
 * the counterparty string — two entries spelled differently are one bookmaker,
 * and only the registry knows that.
 */
import type { DetectionConfidence, DetectionReason } from '../transactions/_ledger-entry';
import type { LedgerRow } from '../transactions/_ledger-view';

/** One row of a bookmaker's own statement, flattened for the detail dialog. */
export type BookmakerEntry = {
  readonly id: string;
  readonly dateLabel: string;
  readonly timeLabel: string;
  readonly amountInCents: number;
  readonly matchedBy: DetectionReason;
  readonly confidence: DetectionConfidence;
};

export type BookmakerSummary = {
  readonly name: string;
  readonly transactionCount: number;
  readonly totalInCents: number;
  /** 0–100 against the largest bookmaker, for the bar width. */
  readonly relativeShare: number;
  /** The policy that matched most of this bookmaker's entries. */
  readonly matchedBy: DetectionReason;
  /** The weakest match among them — the honest confidence to show. */
  readonly lowestConfidence: DetectionConfidence;
  readonly firstSeenLabel: string;
  readonly lastSeenLabel: string;
  /** Newest first, so the dialog reads like the statement it came from. */
  readonly entries: readonly BookmakerEntry[];
};

export type DetectionTally = {
  readonly reason: DetectionReason;
  readonly count: number;
  readonly share: number;
};

export type HourBucket = {
  readonly label: string;
  readonly startHour: number;
  readonly count: number;
  /** 0–100 against the busiest bucket. */
  readonly relativeShare: number;
};

export type BetCostSummary = {
  readonly totalInCents: number;
  readonly transactionCount: number;
  readonly bookmakerCount: number;
  readonly sinceLabel: string;
};

const CONFIDENCE_ORDER: readonly DetectionConfidence[] = ['LOW', 'MEDIUM', 'HIGH'];
const HOURS_PER_BUCKET = 3;

export function selectBetRows(rows: readonly LedgerRow[]): readonly LedgerRow[] {
  return rows.filter((row) => row.bet !== undefined);
}

function toAmount(row: LedgerRow): number {
  return Math.abs(row.amountInCents);
}

function weakestConfidence(rows: readonly LedgerRow[]): DetectionConfidence {
  return rows.reduce<DetectionConfidence>((weakest, row) => {
    const confidence = row.bet?.confidence ?? 'HIGH';
    return CONFIDENCE_ORDER.indexOf(confidence) < CONFIDENCE_ORDER.indexOf(weakest)
      ? confidence
      : weakest;
  }, 'HIGH');
}

function dominantReason(rows: readonly LedgerRow[]): DetectionReason {
  const counts = new Map<DetectionReason, number>();
  for (const row of rows) {
    if (!row.bet) continue;
    counts.set(row.bet.matchedBy, (counts.get(row.bet.matchedBy) ?? 0) + 1);
  }
  return [...counts].sort((left, right) => right[1] - left[1])[0][0];
}

/** Rows arrive newest first, so the oldest entry is the last one. */
export function selectBookmakers(betRows: readonly LedgerRow[]): readonly BookmakerSummary[] {
  const grouped = new Map<string, LedgerRow[]>();
  for (const row of betRows) {
    const existing = grouped.get(row.counterparty);
    if (existing) existing.push(row);
    else grouped.set(row.counterparty, [row]);
  }

  const summaries = [...grouped].map(([name, rows]) => ({
    name,
    transactionCount: rows.length,
    totalInCents: rows.reduce((total, row) => total + toAmount(row), 0),
    matchedBy: dominantReason(rows),
    lowestConfidence: weakestConfidence(rows),
    entries: rows.map((row) => ({
      id: row.id,
      dateLabel: row.dateLabel,
      timeLabel: row.timeLabel,
      amountInCents: row.amountInCents,
      matchedBy: row.bet?.matchedBy ?? 'GAMBLING_MCC',
      confidence: row.bet?.confidence ?? 'HIGH',
    })),
    firstSeenLabel: rows.at(-1)?.fullDateLabel ?? '',
    lastSeenLabel: rows[0].fullDateLabel,
  }));

  const ranked = summaries.toSorted((left, right) => right.totalInCents - left.totalInCents);
  const largest = ranked[0]?.totalInCents ?? 0;

  return ranked.map((summary) => ({
    ...summary,
    relativeShare: largest === 0 ? 0 : Math.round((summary.totalInCents / largest) * 100),
  }));
}

export function tallyDetections(betRows: readonly LedgerRow[]): readonly DetectionTally[] {
  const counts = new Map<DetectionReason, number>();
  for (const row of betRows) {
    if (!row.bet) continue;
    counts.set(row.bet.matchedBy, (counts.get(row.bet.matchedBy) ?? 0) + 1);
  }

  return [...counts]
    .map(([reason, count]) => ({
      reason,
      count,
      share: betRows.length === 0 ? 0 : Math.round((count / betRows.length) * 100),
    }))
    .toSorted((left, right) => right.count - left.count);
}

function toTwoDigits(hour: number): string {
  return String(hour).padStart(2, '0');
}

function toBucketLabel(startHour: number): string {
  const end = (startHour + HOURS_PER_BUCKET) % 24;
  return `${toTwoDigits(startHour)}h–${toTwoDigits(end)}h`;
}

/** Eight three-hour bands: enough resolution to show a cluster, few enough to read on a phone. */
export function summariseHours(betRows: readonly LedgerRow[]): readonly HourBucket[] {
  const counts = new Array<number>(24 / HOURS_PER_BUCKET).fill(0);
  for (const row of betRows) {
    counts[Math.floor(row.hourOfDay / HOURS_PER_BUCKET)] += 1;
  }

  const busiest = Math.max(...counts, 0);

  return counts.map((count, index) => ({
    label: toBucketLabel(index * HOURS_PER_BUCKET),
    startHour: index * HOURS_PER_BUCKET,
    count,
    relativeShare: busiest === 0 ? 0 : Math.round((count / busiest) * 100),
  }));
}

/** The single busiest band, for the sentence that says what the histogram shows. */
export function describeBusiestBand(buckets: readonly HourBucket[], total: number): string | null {
  const busiest = buckets.toSorted((left, right) => right.count - left.count)[0];
  if (!busiest || busiest.count === 0 || total === 0) return null;

  const share = Math.round((busiest.count / total) * 100);
  return `${busiest.count} das ${total} apostas aconteceram entre ${busiest.label.replace('–', ' e ')} — ${share}% delas.`;
}

export function summariseBetCost(betRows: readonly LedgerRow[]): BetCostSummary {
  const names = new Set(betRows.map((row) => row.counterparty));
  const oldest = betRows.at(-1);

  return {
    totalInCents: betRows.reduce((total, row) => total + toAmount(row), 0),
    transactionCount: betRows.length,
    bookmakerCount: names.size,
    sinceLabel: oldest?.dateLabel ?? '',
  };
}

export type IncomeShare = {
  readonly incomeInCents: number;
  /** Percentage of everything that came in, rounded. */
  readonly percentage: number;
};

/**
 * Betting spend against income over the same window.
 *
 * Both sides come from the ledger rather than the monthly history, so they cover
 * the same days: a share computed from two different periods would be a made-up
 * number wearing a percent sign.
 */
export function summariseIncomeShare(
  rows: readonly LedgerRow[],
  betTotalInCents: number,
): IncomeShare | null {
  const incomeInCents = rows
    .filter((row) => row.amountInCents > 0)
    .reduce((total, row) => total + row.amountInCents, 0);

  if (incomeInCents === 0) return null;

  return {
    incomeInCents,
    percentage: Math.round((betTotalInCents / incomeInCents) * 100),
  };
}
