'use client';

import { useMemo, useState } from 'react';
import { SearchX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MoneyText } from '@shared/ui/money-text';

import { CONNECTED_ACCOUNTS } from '../_accounts';
import {
  groupByDay,
  selectRows,
  summarise,
  type AccountFilter,
  type DayGroup,
  type LedgerFilter,
  type LedgerPeriod,
  type LedgerRow,
} from '../_ledger-view';
import { LedgerSummary } from './ledger-summary';
import { LedgerToolbar, PERIOD_OPTIONS } from './ledger-toolbar';
import { TransactionDetailDialog } from './transaction-detail-dialog';
import { TransactionRow } from './transaction-row';

const DEFAULT_PERIOD: LedgerPeriod = 'LAST_30_DAYS';

type TransactionLedgerProps = {
  /** Already sorted newest-first, with every date resolved to a label on the server. */
  readonly rows: readonly LedgerRow[];
  /** Where the filters start, so another screen can link straight into a view. */
  readonly initialFilter?: LedgerFilter;
  readonly initialPeriod?: LedgerPeriod;
};

export function TransactionLedger({
  rows,
  initialFilter = 'ALL',
  initialPeriod = DEFAULT_PERIOD,
}: TransactionLedgerProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<LedgerFilter>(initialFilter);
  const [period, setPeriod] = useState<LedgerPeriod>(initialPeriod);
  const [account, setAccount] = useState<AccountFilter>('ALL');
  const [selectedRow, setSelectedRow] = useState<LedgerRow | null>(null);

  const visibleRows = useMemo(
    () => selectRows({ rows, period, filter, account, query }),
    [rows, period, filter, account, query],
  );
  const totals = useMemo(() => summarise(visibleRows), [visibleRows]);
  const groups = useMemo(() => groupByDay(visibleRows), [visibleRows]);

  const periodLabel = (PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? '')
    .toLowerCase();
  /* The hero figure has to say which slice it is counting, or filtering it lies. */
  const scopeLabel =
    account === 'ALL' ? periodLabel : `${periodLabel} · ${CONNECTED_ACCOUNTS[account].shortName}`;

  function clearFilters() {
    setQuery('');
    setFilter('ALL');
    setAccount('ALL');
    setPeriod(DEFAULT_PERIOD);
  }

  return (
    <div className="space-y-6">
      <LedgerSummary totals={totals} scopeLabel={scopeLabel} />

      <LedgerToolbar
        query={query}
        filter={filter}
        period={period}
        account={account}
        onQueryChange={setQuery}
        onFilterChange={setFilter}
        onPeriodChange={setPeriod}
        onAccountChange={setAccount}
      />

      {groups.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyResult onClear={clearFilters} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <DaySection key={group.dayKey} group={group} onSelect={setSelectedRow} />
          ))}
        </div>
      )}

      <p aria-live="polite" className="text-xs text-muted-foreground">
        {describeResultCount(visibleRows.length)}
      </p>

      <TransactionDetailDialog row={selectedRow} onClose={() => setSelectedRow(null)} />
    </div>
  );
}

function describeResultCount(count: number): string {
  if (count === 0) return 'Nenhuma transação neste recorte.';
  return count === 1 ? '1 transação neste recorte.' : `${count} transações neste recorte.`;
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
  onSelect,
}: {
  readonly group: DayGroup;
  readonly onSelect: (row: LedgerRow) => void;
}) {
  return (
    <section className="space-y-2">
      <header className="sticky top-14 z-10 flex items-baseline justify-between gap-4 bg-background py-2">
        <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {group.dayLabel}
        </h2>
        <MoneyText
          cents={group.netInCents}
          signed
          tabular
          className="text-xs text-muted-foreground"
        />
      </header>

      <Card className="py-0">
        <CardContent className="px-0">
          <ul>
            {group.rows.map((row, index) => (
              <li key={row.id}>
                {index > 0 ? <Separator /> : null}
                <TransactionRow row={row} onSelect={onSelect} />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}

function EmptyResult({ onClear }: { readonly onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <SearchX aria-hidden className="size-6 text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-sm font-medium">Nenhuma transação encontrada</p>
        <p className="text-sm text-muted-foreground">
          Tente outro termo de busca ou amplie o período.
        </p>
      </div>
      <Button type="button" variant="outline" size="sm" className="h-9" onClick={onClear}>
        Limpar filtros
      </Button>
    </div>
  );
}
