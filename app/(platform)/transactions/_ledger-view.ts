/**
 * The fixture ledger as rows, for the screens that still read
 * `_mock-ledger.ts` — the dashboard, Apostas and Conquistas. The statement
 * itself reads the backend, through `_statement-view.ts`.
 *
 * TODO(open-finance): retire with the fixture once those screens read the
 * backend too. Dates resolve **once on the server** into labels.
 */
import { CONNECTED_ACCOUNTS, type ConnectedAccount } from './_accounts';
import type { LedgerEntry } from './_ledger-entry';
import { METHOD_LABELS } from './_statement-labels';

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

function toStartOfDay(value: Date): Date {
  const start = new Date(value);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Whole calendar days between two instants, local midnight to local midnight.
 *
 * Exported because the streak record counts the same days this screen groups by,
 * and two implementations of the same arithmetic are two chances to disagree
 * about which day a bet landed on.
 */
export function countDaysAgo(occurredAt: Date, reference: Date): number {
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

/**
 * The reframing shown beside a fixture betting amount. The statement no longer
 * uses it: there, `awareness` reframes on the backend and the figure arrives.
 */
export function toYieldEquivalentInCents(spendInCents: number, annualRate: number): number {
  return Math.round(spendInCents * (1 + annualRate));
}
