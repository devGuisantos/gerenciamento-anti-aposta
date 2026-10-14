'use client';

import { useEffect, useEffectEvent, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SearchX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { ConnectedAccount, LedgerTotals } from '@modules/open-finance';
import { cn } from 'cn';
import { MoneyText } from '@shared/ui/money-text';

import { loadNextPageAction } from '../_actions';
import { DEFAULT_FILTERS, toFiltersKey, toStatementHref } from '../_statement-params';
import {
  groupByDay,
  type ClassificationPatch,
  type DayGroup,
  type StatementFilters,
  type StatementRow,
} from '../_statement-view';
import { LedgerSummary } from './ledger-summary';
import { LedgerToolbar, PERIOD_OPTIONS } from './ledger-toolbar';
import { TransactionDetailDialog } from './transaction-detail-dialog';
import { TransactionRow } from './transaction-row';

/** Long enough that a word typed at speed is one request, short enough to feel live. */
const SEARCH_DELAY_IN_MILLISECONDS = 350;

type TransactionLedgerProps = {
  /** The slice the server actually read, as parsed from the URL. */
  readonly filters: StatementFilters;
  readonly accounts: readonly ConnectedAccount[];
  readonly totals: LedgerTotals;
  /** The first page, newest first, every date already a label. */
  readonly rows: readonly StatementRow[];
  readonly nextCursor: string | null;
};

/**
 * The statement's interactive half. The backend filters, totals and pages, so
 * a filter change is a navigation: the URL changes, the server re-reads, and
 * the hero figure is always the backend's figure for the whole slice — never a
 * sum of whatever happens to be loaded.
 */
export function TransactionLedger(props: TransactionLedgerProps) {
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();
  const [filters, setFilters] = useState<StatementFilters>(props.filters);
  const [query, setQuery] = useState(props.filters.search);

  function apply(next: StatementFilters) {
    setFilters(next);
    startNavigation(() => router.replace(toStatementHref(next), { scroll: false }));
  }

  const applySearch = useEffectEvent((search: string) => apply({ ...filters, search }));

  useEffect(() => {
    if (query.trim() === filters.search.trim()) return;
    const timer = setTimeout(() => applySearch(query), SEARCH_DELAY_IN_MILLISECONDS);
    return () => clearTimeout(timer);
  }, [query, filters.search]);

  function changeQuery(next: string) {
    setQuery(next);
    /* Clearing is a decision, not typing: no reason to wait for it. */
    if (next === '') apply({ ...filters, search: '' });
  }

  function clearFilters() {
    setQuery('');
    apply(DEFAULT_FILTERS);
  }

  const arrivedIds = useArrivals(props.rows, toFiltersKey(props.filters));

  /* A refresh that brings new rows moves the first page's cursor, which drops
     pages loaded on top of the old one rather than splicing two versions. */
  const pagesKey = `${toFiltersKey(props.filters)}|${props.nextCursor ?? ''}`;

  return (
    <div className="space-y-6">
      <div aria-busy={isNavigating} className={cn(isNavigating && 'opacity-60 transition-opacity')}>
        <LedgerSummary totals={props.totals} scopeLabel={toScopeLabel(props.filters, props.accounts)} />
      </div>

      <LedgerToolbar
        query={query}
        filter={filters.type}
        period={filters.period}
        account={filters.accountId ?? 'ALL'}
        accounts={props.accounts}
        onQueryChange={changeQuery}
        onFilterChange={(type) => apply({ ...filters, type })}
        onPeriodChange={(period) => apply({ ...filters, period })}
        onAccountChange={(account) =>
          apply({ ...filters, accountId: account === 'ALL' ? null : account })
        }
      />

      <div aria-busy={isNavigating} className={cn(isNavigating && 'opacity-60 transition-opacity')}>
        <StatementPages
          key={pagesKey}
          filters={props.filters}
          accounts={props.accounts}
          annualRatePercent={props.totals.annualRatePercent}
          rows={props.rows}
          nextCursor={props.nextCursor}
          arrivedIds={arrivedIds}
          onClearFilters={clearFilters}
          onWidenPeriod={() => apply({ ...filters, period: 'ALL_TIME' })}
        />
      </div>
    </div>
  );
}

type ArrivalTracking = {
  readonly rows: readonly StatementRow[];
  readonly filtersKey: string;
  readonly seen: ReadonlySet<string>;
  readonly arrived: ReadonlySet<string>;
};

const NO_ARRIVALS: ReadonlySet<string> = new Set();

/**
 * Which rows reached this slice **after** it was first shown — the movements
 * a bank notice brought in while the person was looking. Nothing counts on the
 * first render, and a filter change is a different slice, not an arrival: a
 * list that slid in on every load would teach people the motion means nothing.
 *
 * Derived while rendering, from the previous props, rather than in an effect:
 * the new rows must carry their entrance on the very render they first appear.
 */
function useArrivals(rows: readonly StatementRow[], filtersKey: string): ReadonlySet<string> {
  const [tracking, setTracking] = useState<ArrivalTracking>(() => ({
    rows,
    filtersKey,
    seen: new Set(rows.map((row) => row.id)),
    arrived: NO_ARRIVALS,
  }));

  if (tracking.rows !== rows) {
    const isSameSlice = tracking.filtersKey === filtersKey;
    const fresh = rows.filter((row) => !tracking.seen.has(row.id)).map((row) => row.id);

    setTracking({
      rows,
      filtersKey,
      seen: new Set([...tracking.seen, ...fresh]),
      arrived: isSameSlice && fresh.length > 0 ? new Set(fresh) : NO_ARRIVALS,
    });
  }

  return tracking.arrived;
}

/** The hero figure has to say which slice it is counting, or filtering it lies. */
function toScopeLabel(filters: StatementFilters, accounts: readonly ConnectedAccount[]): string {
  const periodLabel = (
    PERIOD_OPTIONS.find((option) => option.value === filters.period)?.label ?? ''
  ).toLowerCase();
  const account = accounts.find((candidate) => candidate.id === filters.accountId);

  return account === undefined ? periodLabel : `${periodLabel} · ${account.shortName}`;
}

type StatementPagesProps = {
  readonly filters: StatementFilters;
  readonly accounts: readonly ConnectedAccount[];
  readonly annualRatePercent: number;
  readonly rows: readonly StatementRow[];
  readonly nextCursor: string | null;
  readonly arrivedIds: ReadonlySet<string>;
  readonly onClearFilters: () => void;
  readonly onWidenPeriod: () => void;
};

type LoadedPages = {
  readonly rows: readonly StatementRow[];
  readonly nextCursor: string | null;
};

function StatementPages({
  filters,
  accounts,
  annualRatePercent,
  rows,
  nextCursor,
  arrivedIds,
  onClearFilters,
  onWidenPeriod,
}: StatementPagesProps) {
  const [loaded, setLoaded] = useState<LoadedPages>({ rows: [], nextCursor });
  const [loadFailure, setLoadFailure] = useState<string | null>(null);
  const [isLoading, startLoading] = useTransition();
  const [patches, setPatches] = useState<ReadonlyMap<string, ClassificationPatch>>(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visibleRows = useMemo(() => mergeRows(rows, loaded.rows, patches), [rows, loaded, patches]);
  const hasMore = loaded.nextCursor !== null;
  const groups = useMemo(() => groupByDay(visibleRows, { hasMore }), [visibleRows, hasMore]);
  const accountsById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts],
  );
  const selectedRow = visibleRows.find((row) => row.id === selectedId) ?? null;

  function loadMore() {
    const cursor = loaded.nextCursor;
    if (cursor === null) return;

    startLoading(async () => {
      const result = await loadNextPageAction({ filters, cursor });
      if (!result.ok) {
        setLoadFailure(result.message);
        return;
      }
      setLoadFailure(null);
      setLoaded((previous) => ({
        rows: [...previous.rows, ...result.rows],
        nextCursor: result.nextCursor,
      }));
    });
  }

  function recordCorrection(transactionId: string, patch: ClassificationPatch) {
    setPatches((previous) => new Map(previous).set(transactionId, patch));
  }

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent>
          <EmptyResult
            isDefaultView={toFiltersKey(filters) === toFiltersKey(DEFAULT_FILTERS)}
            onClear={onClearFilters}
            onWidenPeriod={onWidenPeriod}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <DaySection
          key={group.dayKey}
          group={group}
          accountsById={accountsById}
          arrivedIds={arrivedIds}
          onSelect={setSelectedId}
        />
      ))}

      <div className="flex flex-col items-center gap-2">
        {hasMore ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            disabled={isLoading}
            onClick={loadMore}
          >
            {isLoading ? 'Carregando…' : 'Carregar mais transações'}
          </Button>
        ) : null}
        <p aria-live="polite" className="text-xs text-muted-foreground">
          {loadFailure ?? describeResultCount(visibleRows.length, hasMore)}
        </p>
      </div>

      <TransactionDetailDialog
        row={selectedRow}
        account={selectedRow === null ? null : (accountsById.get(selectedRow.accountId) ?? null)}
        annualRatePercent={annualRatePercent}
        onClose={() => setSelectedId(null)}
        onCorrected={recordCorrection}
      />
    </div>
  );
}

/**
 * The server's first page, then the pages loaded after it, with any row the
 * person just corrected showing the backend's answer straight away. A row that
 * arrives twice — a refresh landing between two loads — appears once.
 */
function mergeRows(
  firstPage: readonly StatementRow[],
  laterPages: readonly StatementRow[],
  patches: ReadonlyMap<string, ClassificationPatch>,
): readonly StatementRow[] {
  const seen = new Set(firstPage.map((row) => row.id));
  const rows = [...firstPage, ...laterPages.filter((row) => !seen.has(row.id))];

  return rows.map((row) => {
    const patch = patches.get(row.id);
    return patch === undefined ? row : { ...row, ...patch };
  });
}

function describeResultCount(count: number, hasMore: boolean): string {
  const shown = count === 1 ? '1 transação' : `${count} transações`;
  return hasMore ? `${shown} carregadas. Há mais neste recorte.` : `${shown} neste recorte.`;
}

/**
 * The day header stays on screen while its day scrolls past — the pattern every
 * statement app uses to keep "when am I looking at?" answered.
 *
 * It sits **outside** the card on purpose. `Card` is `overflow-hidden`, and an
 * `overflow` ancestor becomes the scroll container a sticky element resolves
 * against: put the header inside and it sticks to the card instead of to the
 * page, drifting over the first row. Out here it pins under the app header, and
 * the opaque page background covers the card sliding beneath it.
 */
function DaySection({
  group,
  accountsById,
  arrivedIds,
  onSelect,
}: {
  readonly group: DayGroup;
  readonly accountsById: ReadonlyMap<string, ConnectedAccount>;
  readonly arrivedIds: ReadonlySet<string>;
  readonly onSelect: (rowId: string) => void;
}) {
  return (
    <section className="space-y-2">
      <header className="sticky top-14 z-10 flex items-baseline justify-between gap-4 bg-background py-2">
        <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {group.dayLabel}
        </h2>
        {group.netInCents === null ? null : (
          <MoneyText
            cents={group.netInCents}
            signed
            tabular
            className="text-xs text-muted-foreground"
          />
        )}
      </header>

      <Card className="py-0">
        <CardContent className="px-0">
          <ul>
            {group.rows.map((row, index) => (
              <li
                key={row.id}
                /* Slides in once, on the render it arrives: the key is the row id,
                   so the element is new and the animation plays a single time.
                   Position and opacity only — no colour, which here would read
                   as a classification. Off entirely under reduced motion. */
                className={cn(
                  arrivedIds.has(row.id) &&
                    'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-4 motion-safe:duration-500 motion-safe:ease-out',
                )}
              >
                {index > 0 ? <Separator /> : null}
                <TransactionRow
                  row={row}
                  account={accountsById.get(row.accountId) ?? null}
                  onSelect={onSelect}
                />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}

function EmptyResult({
  isDefaultView,
  onClear,
  onWidenPeriod,
}: {
  readonly isDefaultView: boolean;
  readonly onClear: () => void;
  readonly onWidenPeriod: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <SearchX aria-hidden className="size-6 text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-sm font-medium">Nenhuma transação encontrada</p>
        <p className="text-sm text-muted-foreground">
          {isDefaultView
            ? 'O banco não enviou transações dos últimos 30 dias.'
            : 'Tente outro termo de busca ou amplie o período.'}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9"
        onClick={isDefaultView ? onWidenPeriod : onClear}
      >
        {isDefaultView ? 'Ver todo o período' : 'Limpar filtros'}
      </Button>
    </div>
  );
}
