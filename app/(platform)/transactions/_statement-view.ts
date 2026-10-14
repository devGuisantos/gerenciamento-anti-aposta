/**
 * Presentation model for the statement, built from what backend-anti-aposta
 * returns. Nothing here decides a figure: totals, the betting classification
 * and the yield equivalents arrive computed. What this file adds is words —
 * dates turned into labels, **once, on the server**, so the interactive list
 * never calls `new Date()` and cannot disagree with the server render.
 */
import type {
  ClassificationOverride,
  LedgerPeriod,
  LedgerTransaction,
  LedgerType,
  TransactionBet,
  TransactionCategory,
} from '@modules/open-finance';

import { CATEGORY_LABELS, METHOD_LABELS } from './_statement-labels';

/**
 * The backend keys days in `America/Sao_Paulo`, and so do these labels. The
 * server running this may well be on UTC, where a bet at 22:30 would read as
 * the next morning.
 */
const TIME_ZONE = 'America/Sao_Paulo';

const DAY_KEY_FORMAT = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE });

/** Day keys are calendar dates, not instants; noon UTC formats as that date anywhere. */
const DAY_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'UTC',
  weekday: 'long',
  day: '2-digit',
  month: 'long',
});

const TIME_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
});

const FULL_DATE_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

/** What the person has filtered the statement down to. Mirrors the backend's query. */
export type StatementFilters = {
  readonly type: LedgerType;
  readonly period: LedgerPeriod;
  readonly accountId: string | null;
  readonly search: string;
};

/** A ledger transaction with every date already turned into something a person reads. */
export type StatementRow = {
  readonly id: string;
  readonly counterparty: string;
  readonly category: TransactionCategory;
  readonly categoryLabel: string;
  readonly methodLabel: string;
  readonly status: LedgerTransaction['status'];
  /** Negative is a debit, positive a credit. */
  readonly amountInCents: number;
  readonly accountId: string;
  readonly bet: TransactionBet | null;
  readonly yieldEquivalentInCents: number | null;
  readonly override: ClassificationOverride | null;
  /** "07 de agosto de 2026" — when the person corrected it. */
  readonly overrideDateLabel: string | null;
  readonly dayKey: string;
  readonly dayLabel: string;
  readonly timeLabel: string;
  readonly fullDateLabel: string;
};

/** The part of a row a correction changes, as the backend answered it. */
export type ClassificationPatch = Pick<
  StatementRow,
  'bet' | 'yieldEquivalentInCents' | 'override' | 'overrideDateLabel'
>;

export type DayGroup = {
  readonly dayKey: string;
  readonly dayLabel: string;
  /**
   * `null` while the day may continue on a page not yet loaded: a net over
   * part of a day is a figure that changes as the reader scrolls.
   */
  readonly netInCents: number | null;
  readonly rows: readonly StatementRow[];
};

function toDayKey(instant: Date): string {
  return DAY_KEY_FORMAT.format(instant);
}

function noonOf(dayKey: string): Date {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function dayKeyBefore(dayKey: string): string {
  const previous = noonOf(dayKey);
  previous.setUTCDate(previous.getUTCDate() - 1);
  return previous.toISOString().slice(0, 10);
}

/** Relative wording for the days people actually remember, absolute after that. */
function toDayLabel(dayKey: string, todayKey: string): string {
  if (dayKey === todayKey) return 'Hoje';
  if (dayKey === dayKeyBefore(todayKey)) return 'Ontem';
  return DAY_FORMAT.format(noonOf(dayKey));
}

function toOverrideDateLabel(override: ClassificationOverride | null): string | null {
  return override === null ? null : FULL_DATE_FORMAT.format(new Date(override.overriddenAt));
}

function toRow(transaction: LedgerTransaction, todayKey: string): StatementRow {
  const occurredAt = new Date(transaction.occurredAt);
  const timeLabel = TIME_FORMAT.format(occurredAt);

  return {
    id: transaction.id,
    counterparty: transaction.counterparty,
    category: transaction.category,
    categoryLabel: CATEGORY_LABELS[transaction.category],
    methodLabel: METHOD_LABELS[transaction.method],
    status: transaction.status,
    amountInCents: transaction.amount.amountInCents,
    accountId: transaction.accountId,
    bet: transaction.bet,
    yieldEquivalentInCents: transaction.yieldEquivalent?.amountInCents ?? null,
    override: transaction.override,
    overrideDateLabel: toOverrideDateLabel(transaction.override),
    dayKey: transaction.dayKey,
    dayLabel: toDayLabel(transaction.dayKey, todayKey),
    timeLabel,
    fullDateLabel: `${FULL_DATE_FORMAT.format(occurredAt)} às ${timeLabel}`,
  };
}

export function toStatementRows(
  transactions: readonly LedgerTransaction[],
  reference: Date,
): readonly StatementRow[] {
  const todayKey = toDayKey(reference);
  return transactions.map((transaction) => toRow(transaction, todayKey));
}

export function toClassificationPatch(classification: {
  readonly transaction: {
    readonly bet: TransactionBet | null;
    readonly yieldEquivalent: { readonly amountInCents: number } | null;
  };
  readonly override: ClassificationOverride | null;
}): ClassificationPatch {
  return {
    bet: classification.transaction.bet,
    yieldEquivalentInCents: classification.transaction.yieldEquivalent?.amountInCents ?? null,
    override: classification.override,
    overrideDateLabel: toOverrideDateLabel(classification.override),
  };
}

/**
 * Preserves the newest-first order it is given; it never re-sorts. The last
 * day's net is withheld while more pages remain, because that day may go on.
 */
export function groupByDay(
  rows: readonly StatementRow[],
  options: { readonly hasMore: boolean },
): readonly DayGroup[] {
  const groups = new Map<string, StatementRow[]>();

  for (const row of rows) {
    const existing = groups.get(row.dayKey);
    if (existing) existing.push(row);
    else groups.set(row.dayKey, [row]);
  }

  const entries = [...groups];

  return entries.map(([dayKey, dayRows], index) => ({
    dayKey,
    dayLabel: dayRows[0].dayLabel,
    netInCents:
      options.hasMore && index === entries.length - 1
        ? null
        : dayRows.reduce((total, row) => total + row.amountInCents, 0),
    rows: dayRows,
  }));
}
