'use client';

import { useId } from 'react';
import { CircleAlert } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type ConsentFieldProps = {
  readonly checked: boolean;
  readonly onCheckedChange: (checked: boolean) => void;
  readonly error: string | null;
};

/**
 * The LGPD consent, never pre-checked.
 *
 * The label **names what is being consented to** instead of pointing at documents
 * nobody reads. "Li e aceito os termos de uso e a política de privacidade" was the
 * wording here before, and in this repository those documents do not exist — a
 * tick-box consenting to nothing in particular is a dark pattern, and this product
 * serves people whose financial data is the sensitive kind.
 *
 * The second line is the one that matters most. Registration reads **no bank
 * data**: that needs a separate Open Finance consent with its own scope and
 * expiry, which the root `CLAUDE.md` requires and which the user approves and can
 * revoke on its own screen. Somebody who believes they have just handed over
 * access to their accounts would be wrong, and would be right to be angry.
 *
 * Validated in the submit handler rather than with a native `required`. Radix
 * renders the real checkbox hidden, and a hidden required control makes Chrome
 * refuse the submit with nothing visible to the user and a console message they
 * will never see. An inline error next to the field is what the route group's
 * conventions ask for anyway.
 *
 * TODO(identity): the action re-checks this. A consent that only the browser
 * verified is not a consent, and `RegisterUser` must refuse without it.
 */
export function ConsentField({ checked, onCheckedChange, error }: ConsentFieldProps) {
  const fieldId = useId();
  const errorId = useId();

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-start gap-3">
        <Checkbox
          id={fieldId}
          name="consent"
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="mt-0.5"
        />
        <Label
          htmlFor={fieldId}
          className="items-start text-sm leading-relaxed font-normal text-muted-foreground"
        >
          Autorizo o uso do meu nome e e-mail para criar e manter esta conta, conforme a LGPD.
        </Label>
      </div>

      <p className="pl-7 text-xs text-muted-foreground">
        Nenhum dado bancário é lido agora. Para isso existe um consentimento de Open Finance
        separado, que você aprova depois e pode revogar quando quiser — ao revogar, os dados
        derivados dele são apagados.
      </p>

      {error ? (
        <p id={errorId} className="flex items-start gap-2 pl-7 text-sm text-destructive">
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
