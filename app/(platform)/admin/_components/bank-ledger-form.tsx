'use client';

import { useId, useState, useTransition, type FormEvent } from 'react';
import { toast } from 'sonner';

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
import type {
  BankAccount,
  DemoMovement,
  DemoMovementKind,
  EntryType,
} from '@modules/sandbox-bank';
import { formatBRL } from '@shared/ui/money-text';
import { FormError } from '@shared/ui/form-error';

import { bookLedgerEntryForAction } from '../_actions';
import { ENTRY_TYPE_COPY } from '../_admin-copy';
import { AMOUNT_PATTERN } from '../_ledger-entry-form';

type Draft = {
  readonly accountId: string;
  readonly direction: DemoMovementKind;
  readonly amount: string;
  readonly transactionName: string;
  readonly type: EntryType;
  readonly merchantCategoryCode: string;
  readonly payeeDocument: string;
  /** "0" is now. Lets one console fill every window `/bets` offers. */
  readonly daysAgo: string;
  /** São Paulo hour, "0"–"23"; empty keeps the current time of day. */
  readonly hour: string;
};

const DIRECTION_COPY: Readonly<Record<DemoMovementKind, string>> = {
  DEBIT: 'Saída (pagamento)',
  CREDIT: 'Entrada (recebimento)',
};

const CARD_ONLY: readonly EntryType[] = ['CARTAO'];

function accountLabel(account: BankAccount): string {
  return `${account.type === 'CARTAO_CREDITO' ? 'Cartão de crédito' : 'Conta corrente'} · final ${account.numberEnding}`;
}

/** "5000" cents → "50,00", the way the person would type it. */
function toAmountText(cents: number): string {
  return formatBRL(cents).replace(/[^\d,]/g, '');
}

/** A card movement goes on the card; everything else on the checking account. */
function accountFor(movement: DemoMovement, accounts: readonly BankAccount[]): string {
  const wantsCard = movement.type === 'CARTAO' && movement.kind === 'DEBIT';
  const match = accounts.find((account) => (account.type === 'CARTAO_CREDITO') === wantsCard);

  return (match ?? accounts[0])?.id ?? '';
}

function draftFrom(movement: DemoMovement, accounts: readonly BankAccount[]): Draft {
  return {
    accountId: accountFor(movement, accounts),
    direction: movement.kind,
    amount: toAmountText(movement.amountInCents),
    transactionName: movement.transactionName,
    type: movement.type,
    merchantCategoryCode: movement.merchantCategoryCode === null ? '' : String(movement.merchantCategoryCode),
    payeeDocument: movement.payeeDocument ?? '',
    daysAgo: '0',
    hour: '',
  };
}

/**
 * Books a movement at the simulated bank, on the recipient's account —
 * "acabei de apostar R$ 50" — so a demonstration can show the whole path: the
 * bank's ledger, the bank's notice, the platform's synchronisation and the
 * classification, ending on the recipient's open screen. The ready-made
 * examples each exercise one detection signal, and one is a purchase the
 * classifier must leave alone.
 *
 * It writes to the bank, never to the statement. The statement changes because
 * the platform reads the bank again — over the protocol, as from any bank.
 */
type BankLedgerFormProps = {
  /** Whose account this books on; the backend checks the account is theirs. */
  readonly recipientId: string;
  readonly accounts: readonly BankAccount[];
  /*
   * The bank's vocabulary arrives as props: `@modules/sandbox-bank` is a
   * server module (its client reads cookies), and a Client Component imports
   * only types from a module.
   */
  readonly movements: readonly DemoMovement[];
  readonly entryTypes: readonly EntryType[];
  readonly gamblingMcc: number;
};

export function BankLedgerForm({
  recipientId,
  accounts,
  movements,
  entryTypes,
  gamblingMcc,
}: BankLedgerFormProps) {
  const [draft, setDraft] = useState<Draft>(() => draftFrom(movements[0] ?? emptyMovement(), accounts));
  const [failure, setFailure] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const selected = accounts.find((account) => account.id === draft.accountId);
  const allowedTypes = selected?.type === 'CARTAO_CREDITO' ? CARD_ONLY : entryTypes;

  function update(change: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...change }));
  }

  function chooseAccount(accountId: string) {
    const account = accounts.find((candidate) => candidate.id === accountId);
    update(account?.type === 'CARTAO_CREDITO' ? { accountId, type: 'CARTAO' } : { accountId });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await bookLedgerEntryForAction(recipientId, draft);

      setFailure(result.ok ? null : result.message);

      if (result.ok) {
        toast(result.message);
      }
    });
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="examples-heading" className="space-y-2">
        <h3 id="examples-heading" className="text-sm font-medium">
          Exemplos prontos
        </h3>
        <ul className="flex flex-wrap gap-2">
          {movements.map((movement) => (
            <li key={movement.id}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                title={movement.expectation}
                onClick={() =>
                  setDraft((current) => ({
                    ...draftFrom(movement, accounts),
                    daysAgo: current.daysAgo,
                    hour: current.hour,
                  }))
                }
              >
                {movement.label}
              </Button>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Cada exemplo preenche o formulário. Nada é registrado até você confirmar.
        </p>
      </section>

      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Conta no banco"
          value={draft.accountId}
          display={selected === undefined ? 'Escolha uma conta' : accountLabel(selected)}
          options={accounts.map((account) => ({ value: account.id, label: accountLabel(account) }))}
          onChange={chooseAccount}
        />
        <SelectField
          label="Como o dinheiro se moveu"
          value={draft.type}
          display={ENTRY_TYPE_COPY[draft.type]}
          options={allowedTypes.map((type) => ({ value: type, label: ENTRY_TYPE_COPY[type] }))}
          onChange={(type) => update({ type: type as EntryType })}
        />
        <SelectField
          label="Direção"
          value={draft.direction}
          display={DIRECTION_COPY[draft.direction]}
          options={(['DEBIT', 'CREDIT'] as const).map((direction) => ({
            value: direction,
            label: DIRECTION_COPY[direction],
          }))}
          onChange={(direction) => update({ direction: direction as DemoMovementKind })}
        />
        <TextField
          label="Valor (R$)"
          hint="Como 50 ou 50,90."
          value={draft.amount}
          onChange={(amount) => update({ amount })}
          required
          inputMode="decimal"
          pattern={AMOUNT_PATTERN.source}
        />
        <div className="sm:col-span-2">
          <TextField
            label="Descrição no extrato"
            hint="Como o banco imprimiria a linha. O anti-aposta lê esta descrição."
            value={draft.transactionName}
            onChange={(transactionName) => update({ transactionName })}
            required
            maxLength={140}
          />
        </div>
        <TextField
          label="MCC do estabelecimento (opcional)"
          hint={`Código de 4 dígitos que a maquininha informa. ${gamblingMcc} é apostas.`}
          value={draft.merchantCategoryCode}
          onChange={(merchantCategoryCode) => update({ merchantCategoryCode })}
          inputMode="numeric"
          pattern="\d{1,4}"
        />
        <TextField
          label="CNPJ ou CPF de quem recebeu (opcional)"
          hint="Só números. Usado para reconhecer casas de apostas licenciadas."
          value={draft.payeeDocument}
          onChange={(payeeDocument) => update({ payeeDocument })}
          inputMode="numeric"
          pattern="\d{11}|\d{14}"
        />
        <TextField
          label="Há quantos dias"
          hint="0 é agora. Até 364: o anti-aposta lê os últimos 365 dias do banco."
          value={draft.daysAgo}
          onChange={(daysAgo) => update({ daysAgo })}
          required
          inputMode="numeric"
          pattern="\d{1,3}"
        />
        <TextField
          label="Hora (opcional)"
          hint="De 0 a 23, horário de Brasília. Em branco, usa a hora atual."
          value={draft.hour}
          onChange={(hour) => update({ hour })}
          inputMode="numeric"
          pattern="\d{1,2}"
        />

        <div className="space-y-3 sm:col-span-2">
          <FormError message={failure} />
          <Button type="submit" className="h-10" disabled={isPending}>
            {isPending ? 'Registrando…' : 'Registrar no banco'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function emptyMovement(): DemoMovement {
  return {
    id: 'empty',
    label: '',
    expectation: '',
    kind: 'DEBIT',
    amountInCents: 0,
    transactionName: '',
    type: 'PIX',
    merchantCategoryCode: null,
    payeeDocument: null,
  };
}

type SelectFieldProps = {
  readonly label: string;
  readonly value: string;
  /** `SelectValue` needs explicit children, or the trigger renders blank on the server. */
  readonly display: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly onChange: (value: string) => void;
};

function SelectField({ label, value, display, options, onChange }: SelectFieldProps) {
  const id = useId();

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-10 w-full">
          <SelectValue>{display}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

type TextFieldProps = {
  readonly label: string;
  readonly hint: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly required?: boolean;
  readonly inputMode?: 'decimal' | 'numeric';
  readonly pattern?: string;
  readonly maxLength?: number;
};

/** Requirements are hints with `aria-describedby`, never placeholders. */
function TextField({ label, hint, value, onChange, ...native }: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        className="h-10"
        type="text"
        autoComplete="off"
        aria-describedby={hintId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...native}
      />
      <p id={hintId} className="text-xs text-muted-foreground">
        {hint}
      </p>
    </div>
  );
}
