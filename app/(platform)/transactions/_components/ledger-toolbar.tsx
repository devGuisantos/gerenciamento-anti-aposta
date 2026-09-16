'use client';

import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { CONNECTED_ACCOUNT_LIST, toAccountFullLabel } from '../_accounts';
import type { AccountFilter, LedgerFilter, LedgerPeriod } from '../_ledger-view';

const FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tudo' },
  { value: 'BETS', label: 'Apostas' },
  { value: 'DEBITS', label: 'Saídas' },
  { value: 'CREDITS', label: 'Entradas' },
] as const satisfies readonly { value: LedgerFilter; label: string }[];

export const PERIOD_OPTIONS = [
  { value: 'LAST_30_DAYS', label: 'Últimos 30 dias' },
  { value: 'LAST_90_DAYS', label: 'Últimos 90 dias' },
  { value: 'ALL_TIME', label: 'Todo o período' },
] as const satisfies readonly { value: LedgerPeriod; label: string }[];

const ACCOUNT_OPTIONS: readonly { value: AccountFilter; label: string }[] = [
  { value: 'ALL', label: 'Todas as contas' },
  ...CONNECTED_ACCOUNT_LIST.map((account) => ({
    value: account.id,
    label: toAccountFullLabel(account),
  })),
];

type Option<Value extends string> = { readonly value: Value; readonly label: string };

/** Radix hands back a plain string; this narrows it against the options instead of asserting. */
function narrow<Value extends string>(
  options: readonly Option<Value>[],
  value: string,
): Value | undefined {
  return options.find((option) => option.value === value)?.value;
}

function labelFor<Value extends string>(
  options: readonly Option<Value>[],
  value: Value,
): string | undefined {
  return options.find((option) => option.value === value)?.label;
}

type LedgerToolbarProps = {
  readonly query: string;
  readonly filter: LedgerFilter;
  readonly period: LedgerPeriod;
  readonly account: AccountFilter;
  readonly onQueryChange: (query: string) => void;
  readonly onFilterChange: (filter: LedgerFilter) => void;
  readonly onPeriodChange: (period: LedgerPeriod) => void;
  readonly onAccountChange: (account: AccountFilter) => void;
};

export function LedgerToolbar({
  query,
  filter,
  period,
  account,
  onQueryChange,
  onFilterChange,
  onPeriodChange,
  onAccountChange,
}: LedgerToolbarProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-center gap-2 md:max-w-sm">
        <SearchField query={query} onQueryChange={onQueryChange} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Chips can outgrow a narrow phone; they scroll, the page never does. */}
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <ToggleGroup
            type="single"
            value={filter}
            onValueChange={(value) => {
              const next = narrow(FILTER_OPTIONS, value);
              if (next) onFilterChange(next);
            }}
            aria-label="Filtrar por tipo"
            className="w-max"
          >
            {FILTER_OPTIONS.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value} className="h-9 px-3 md:h-8">
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center">
          <Select
            value={account}
            onValueChange={(value) => {
              const next = narrow(ACCOUNT_OPTIONS, value);
              if (next) onAccountChange(next);
            }}
          >
            <SelectTrigger className="h-9 w-full sm:w-56 md:h-8" aria-label="Conta">
              {/* Explicit children: Radix fills SelectValue only once its items
                  register on the client, which leaves the trigger blank in SSR. */}
              <SelectValue>{labelFor(ACCOUNT_OPTIONS, account)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ACCOUNT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={period}
            onValueChange={(value) => {
              const next = narrow(PERIOD_OPTIONS, value);
              if (next) onPeriodChange(next);
            }}
          >
            <SelectTrigger className="h-9 w-full sm:w-44 md:h-8" aria-label="Período">
              <SelectValue>{labelFor(PERIOD_OPTIONS, period)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function SearchField({
  query,
  onQueryChange,
}: {
  readonly query: string;
  readonly onQueryChange: (query: string) => void;
}) {
  return (
    <div className="relative w-full">
      <Label htmlFor="ledger-search" className="sr-only">
        Buscar transações
      </Label>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        id="ledger-search"
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Buscar por nome, categoria ou conta"
        autoComplete="off"
        className="h-10 pl-9 md:h-9"
      />
      {query === '' ? null : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onQueryChange('')}
          aria-label="Limpar busca"
          className="absolute top-1/2 right-1 size-8 -translate-y-1/2"
        >
          <X />
        </Button>
      )}
    </div>
  );
}
