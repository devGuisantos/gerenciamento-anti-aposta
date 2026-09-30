'use client';

import { useId } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { AMOUNT_PATTERN } from '../_savings-goal';

type AmountFieldProps = {
  /** The form field name the action reads. */
  readonly name: string;
  readonly label: string;
  readonly hint: string;
};

/**
 * The money field, in one place because two dialogs ask for an amount and both
 * have to accept exactly what the action accepts.
 *
 * `type="text"` with `inputMode="decimal"` rather than `type="number"`: this
 * audience writes "250,50", and a number input in a pt-BR browser can hand the
 * server an empty string for a comma it decided not to parse. A text field with a
 * `pattern` keeps native validation and leaves the comma alone.
 */
export function AmountField({ name, label, hint }: AmountFieldProps) {
  const fieldId = useId();
  const hintId = useId();

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-sm text-muted-foreground">
          R$
        </span>
        <Input
          id={fieldId}
          name={name}
          className="h-10"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0,00"
          pattern={AMOUNT_PATTERN.source}
          aria-describedby={hintId}
          required
        />
      </div>
      <p id={hintId} className="text-xs text-muted-foreground">
        {hint}
      </p>
    </div>
  );
}
