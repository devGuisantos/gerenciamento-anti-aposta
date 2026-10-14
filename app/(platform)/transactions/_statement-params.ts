/**
 * The statement's filters live in the URL, because the backend filters and
 * totals: a reload, a shared link and the back button all land on the same
 * slice. `filter` and `period` keep the values other screens already link with
 * (`?filter=bets&period=all`).
 *
 * An unknown value falls back to the default rather than erroring: a bad query
 * string is not worth a broken page. Pure, so the toolbar can build hrefs too.
 */
import type { LedgerPeriod, LedgerType } from '@modules/open-finance';

import type { StatementFilters } from './_statement-view';

const TYPE_PARAMS: Readonly<Record<string, LedgerType>> = {
  bets: 'BETS',
  credits: 'CREDITS',
  debits: 'DEBITS',
};

const PERIOD_PARAMS: Readonly<Record<string, LedgerPeriod>> = {
  '30d': 'LAST_30_DAYS',
  '90d': 'LAST_90_DAYS',
  all: 'ALL_TIME',
};

/** The backend's own bound on `q`; anything longer would be refused there. */
export const SEARCH_MAXIMUM_LENGTH = 120;

export const DEFAULT_FILTERS: StatementFilters = {
  type: 'ALL',
  period: 'LAST_30_DAYS',
  accountId: null,
  search: '',
};

type RawParams = Readonly<Record<string, string | readonly string[] | undefined>>;

function firstOf(raw: string | readonly string[] | undefined): string | undefined {
  const value: unknown = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === 'string' ? value : undefined;
}

function keyFor<Value>(table: Readonly<Record<string, Value>>, value: Value): string | undefined {
  return Object.entries(table).find(([, candidate]) => candidate === value)?.[0];
}

/** `knownAccountIds` keeps a stale or foreign account id out of the backend call. */
export function readStatementFilters(
  params: RawParams,
  knownAccountIds: readonly string[],
): StatementFilters {
  const type = TYPE_PARAMS[firstOf(params.filter) ?? ''];
  const period = PERIOD_PARAMS[firstOf(params.period) ?? ''];
  const account = firstOf(params.account);
  const search = firstOf(params.q) ?? '';

  return {
    type: type ?? DEFAULT_FILTERS.type,
    period: period ?? DEFAULT_FILTERS.period,
    accountId: account !== undefined && knownAccountIds.includes(account) ? account : null,
    search: search.slice(0, SEARCH_MAXIMUM_LENGTH),
  };
}

/** Defaults are left out, so the plain screen keeps the plain URL. */
export function toStatementHref(filters: StatementFilters): string {
  const params = new URLSearchParams();
  const type = keyFor(TYPE_PARAMS, filters.type);
  const period = keyFor(PERIOD_PARAMS, filters.period);

  if (type !== undefined) params.set('filter', type);
  if (filters.period !== DEFAULT_FILTERS.period && period !== undefined) params.set('period', period);
  if (filters.accountId !== null) params.set('account', filters.accountId);
  if (filters.search.trim() !== '') params.set('q', filters.search.trim());

  const query = params.toString();
  return query === '' ? '/transactions' : `/transactions?${query}`;
}

/** Changes whenever the backend would answer with a different set. */
export function toFiltersKey(filters: StatementFilters): string {
  return toStatementHref({ ...filters, search: filters.search.trim() });
}
