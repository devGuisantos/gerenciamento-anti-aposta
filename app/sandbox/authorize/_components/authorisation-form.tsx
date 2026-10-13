'use client';

import { startTransition, useActionState, useEffect, useId, type FormEvent } from 'react';
import { CreditCard, Landmark } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { BankAccount } from '@modules/sandbox-bank';
import { FormError } from '@shared/ui/form-error';

import { ACCOUNT_TYPE_COPY } from '../../_bank-copy';
import { decideAuthorisationAction, type AuthorisationFormState } from '../_actions';

const INITIAL_STATE: AuthorisationFormState = { message: null, redirectTo: null };

type AuthorisationFormProps = {
  readonly accounts: readonly BankAccount[];
  /** The OAuth request, carried back unchanged so the bank re-checks all of it. */
  readonly request: {
    readonly clientId: string;
    readonly redirectUri: string;
    readonly scope: string;
    readonly state: string;
    readonly codeChallenge: string;
    readonly codeChallengeMethod: string;
  };
};

/**
 * The person picks which accounts to share and answers. Nothing is pre-selected:
 * sharing an account somebody did not choose is the thing a consent screen
 * exists to prevent.
 *
 * Submitted through `startTransition` rather than `<form action>` for the same
 * reason the auth forms are: React resets a form after an action, which would
 * clear the ticked accounts every time the bank answered with an error. The
 * button that was pressed travels as the `submitter`, which is how one form
 * carries two answers.
 */
export function AuthorisationForm({ accounts, request }: AuthorisationFormProps) {
  const [state, dispatch, isPending] = useActionState(decideAuthorisationAction, INITIAL_STATE);
  const legendId = useId();
  const isLeaving = state.redirectTo !== null;

  // A full page load back to anti-aposta's callback, as from any other bank.
  useEffect(() => {
    if (state.redirectTo !== null) {
      window.location.assign(state.redirectTo);
    }
  }, [state.redirectTo]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = event.nativeEvent instanceof SubmitEvent ? event.nativeEvent.submitter : null;
    const formData = new FormData(event.currentTarget, submitter);

    startTransition(() => dispatch(formData));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {Object.entries(request).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      <fieldset aria-labelledby={legendId} className="space-y-3">
        <legend id={legendId} className="text-sm font-medium">
          Quais contas você quer compartilhar?
        </legend>
        <ul className="space-y-2">
          {accounts.map((account) => (
            <AccountOption key={account.id} account={account} />
          ))}
        </ul>
      </fieldset>

      <FormError message={state.message} />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="submit"
          name="decision"
          value="REJECT"
          variant="outline"
          className="h-10"
          disabled={isPending || isLeaving}
        >
          Não autorizar
        </Button>
        <Button type="submit" name="decision" value="APPROVE" className="h-10" disabled={isPending || isLeaving}>
          {isPending || isLeaving ? 'Enviando…' : 'Autorizar compartilhamento'}
        </Button>
      </div>
    </form>
  );
}

function AccountOption({ account }: { readonly account: BankAccount }) {
  const id = useId();
  const Icon = account.type === 'CARTAO_CREDITO' ? CreditCard : Landmark;

  return (
    <li className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <Checkbox id={id} name="accountIds" value={account.id} />
      <Label htmlFor={id} className="flex flex-1 cursor-pointer items-center gap-3 font-normal">
        <Icon aria-hidden className="size-4 text-muted-foreground" />
        <span className="grid leading-tight">
          <span className="font-medium">{ACCOUNT_TYPE_COPY[account.type]}</span>
          <span className="text-xs text-muted-foreground">
            Agência {account.branchCode} · final {account.numberEnding}
          </span>
        </span>
      </Label>
    </li>
  );
}
