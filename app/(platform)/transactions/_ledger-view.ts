/**
 * Presentation model for the statement screen.
 *
 * Dates are resolved **once on the server** into labels, so the interactive list
 * never calls `new Date()` and cannot disagree with the server render. The list
 * only ever filters and groups rows it was handed.
 */
import { assertNever } from '@shared/domain/assert-never';

import {
  CONNECTED_ACCOUNTS,
  toAccountShortLabel,
  type AccountId,
  type ConnectedAccount,
} from './_accounts';
import type { LedgerEntry } from './_ledger-entry';
import { METHOD_LABELS } from './_mock-ledger';

const MILLISECONDS_PER_DAY = 86_400_000;

const DAY_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
});

const TIME_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
});

const FULL_DATE_FORMAT = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

/** A ledger entry with every date already turned into something a person reads. */
export type LedgerRow = Omit<LedgerEntry, 'occurredAt' | 'method' | 'accountId'> & {
  readonly account: ConnectedAccount;
  readonly methodLabel: string;
  /** Whole calendar days between the entry and the reference day. */
  readonly daysAgo: number;
  /** 0-23, resolved here so no client has to parse a label back into a time. */
  readonly hourOfDay: number;
  /** Stable `YYYY-MM-DD` key the list groups on. */
  readonly dayKey: string;
  readonly dayLabel: string;
  readonly timeLabel: string;
  /** "07 de agosto de 2026" — the date on its own, where a time would be noise. */
  readonly dateLabel: string;
  readonly fullDateLabel: string;
};

export type DayGroup = {
  readonly dayKey: string;
  readonly dayLabel: string;
  readonly netInCents: number;
  readonly rows: readonly LedgerRow[];
};

/** All figures are non-negative magnitudes; the labels carry the direction. */
export type LedgerTotals = {
  readonly creditsInCents: number;
  readonly debitsInCents: number;
  readonly betSpendInCents: number;
  readonly betCount: number;
};

export type LedgerFilter = 'ALL' | 'BETS' | 'CREDITS' | 'DEBITS';
export type LedgerPeriod = 'LAST_30_DAYS' | 'LAST_90_DAYS' | 'ALL_TIME';
/** `ALL` keeps every connected account; otherwise one account's entries only. */
export type AccountFilter = 'ALL' | AccountId;

function toStartOfDay(value: Date): Date {
  const start = new Date(value);
  start.setHours(0, 0, 0, 0);
  return start;
}

function countDaysAgo(occurredAt: Date, reference: Date): number {
  const elapsed = toStartOfDay(reference).getTime() - toStartOfDay(occurredAt).getTime();
  return Math.round(elapsed / MILLISECONDS_PER_DAY);
}

function toDayKey(value: Date): string {
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}

/** Relative wording for the days people actually remember, absolute after that. */
function toDayLabel(occurredAt: Date, daysAgo: number): string {
  if (daysAgo === 0) return 'Hoje';
  if (daysAgo === 1) return 'Ontem';
  return DAY_FORMAT.format(occurredAt);
}

function toRow(entry: LedgerEntry, reference: Date): LedgerRow {
  const occurredAt = new Date(entry.occurredAt);
  const daysAgo = countDaysAgo(occurredAt, reference);
  const timeLabel = TIME_FORMAT.format(occurredAt);
  const dateLabel = FULL_DATE_FORMAT.format(occurredAt);

  return {
    ...entry,
    account: CONNECTED_ACCOUNTS[entry.accountId],
    methodLabel: METHOD_LABELS[entry.method],
    daysAgo,
    hourOfDay: occurredAt.getHours(),
    dayKey: toDayKey(occurredAt),
    dayLabel: toDayLabel(occurredAt, daysAgo),
    timeLabel,
    dateLabel,
    fullDateLabel: `${dateLabel} às ${timeLabel}`,
  };
}

export function toLedgerRows(
  entries: readonly LedgerEntry[],
  reference: Date,
): readonly LedgerRow[] {
  return entries.map((entry) => toRow(entry, reference));
}

function periodLengthInDays(period: LedgerPeriod): number {
  switch (period) {
    case 'LAST_30_DAYS':
      return 30;
    case 'LAST_90_DAYS':
      return 90;
    case 'ALL_TIME':
      return Number.POSITIVE_INFINITY;
    default:
      return assertNever(period);
  }
}

function matchesFilter(row: LedgerRow, filter: LedgerFilter): boolean {
  switch (filter) {
    case 'ALL':
      return true;
    case 'BETS':
      return row.bet !== undefined;
    case 'CREDITS':
      return row.amountInCents > 0;
    case 'DEBITS':
      return row.amountInCents < 0;
    default:
      return assertNever(filter);
  }
}

/** Accent- and case-insensitive: nobody types "Pão de Açúcar" with the diacritics. */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function matchesQuery(row: LedgerRow, foldedQuery: string): boolean {
  if (foldedQuery === '') return true;
  const haystack = fold(
    `${row.counterparty} ${row.category} ${row.account.institution} ${toAccountShortLabel(row.account)}`,
  );
  return haystack.includes(foldedQuery);
}

function matchesAccount(row: LedgerRow, account: AccountFilter): boolean {
  return account === 'ALL' || row.account.id === account;
}

type SelectionCriteria = {
  readonly rows: readonly LedgerRow[];
  readonly period: LedgerPeriod;
  readonly filter: LedgerFilter;
  readonly account: AccountFilter;
  readonly query: string;
};

export function selectRows({
  rows,
  period,
  filter,
  account,
  query,
}: SelectionCriteria): readonly LedgerRow[] {
  const maximumDaysAgo = periodLengthInDays(period);
  const foldedQuery = fold(query.trim());

  return rows.filter(
    (row) =>
      row.daysAgo < maximumDaysAgo &&
      matchesFilter(row, filter) &&
      matchesAccount(row, account) &&
      matchesQuery(row, foldedQuery),
  );
}

/** Preserves the newest-first order it is given; it never re-sorts. */
export function groupByDay(rows: readonly LedgerRow[]): readonly DayGroup[] {
  const groups = new Map<string, LedgerRow[]>();

  for (const row of rows) {
    const existing = groups.get(row.dayKey);
    if (existing) existing.push(row);
    else groups.set(row.dayKey, [row]);
  }

  return [...groups].map(([dayKey, dayRows]) => ({
    dayKey,
    dayLabel: dayRows[0].dayLabel,
    netInCents: dayRows.reduce((total, row) => total + row.amountInCents, 0),
    rows: dayRows,
  }));
}

export function summarise(rows: readonly LedgerRow[]): LedgerTotals {
  const credits = rows.filter((row) => row.amountInCents > 0);
  const debits = rows.filter((row) => row.amountInCents < 0);
  const bets = rows.filter((row) => row.bet !== undefined);

  return {
    creditsInCents: sumMagnitudes(credits),
    debitsInCents: sumMagnitudes(debits),
    betSpendInCents: sumMagnitudes(bets),
    betCount: bets.length,
  };
}

function sumMagnitudes(rows: readonly LedgerRow[]): number {
  return rows.reduce((total, row) => total + Math.abs(row.amountInCents), 0);
}

/**
 * The reframing shown beside a betting amount — the same arithmetic the
 * `awareness` module will own once `Reframing` exists.
 */
export function toYieldEquivalentInCents(spendInCents: number, annualRate: number): number {
  return Math.round(spendInCents * (1 + annualRate));
}
