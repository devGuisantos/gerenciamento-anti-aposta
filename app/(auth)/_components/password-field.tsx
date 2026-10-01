'use client';

import { useId, useState } from 'react';
import { CircleAlert, Eye, EyeOff } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PASSWORD_MINIMUM_LENGTH } from '../_password-strength';
import { PasswordStrengthMeter } from './password-strength-meter';

type BasePasswordFieldProps = {
  readonly name: string;
  readonly label: string;
  readonly autoComplete: 'current-password' | 'new-password';
  readonly hint?: string;
  readonly error?: string | null;
  /** Sits beside the label — the "forgot password" link on the sign-in form. */
  readonly labelAction?: React.ReactNode;
  readonly enterKeyHint?: 'next' | 'done';
};

/**
 * Whether the strength meter sits under the input, and with it whether the field
 * is controlled — the two go together, because a meter cannot assess a value it
 * cannot see. A union rather than a flag, so `meter="STRENGTH"` says at the call
 * site what appears and the types refuse a meter with nothing to measure.
 *
 * The sign-in field is deliberately the `NONE` case **and uncontrolled**: a
 * password manager fills it through the DOM, and the fewer round-trips between
 * the browser’s autofill and React's idea of the value, the fewer ways that can
 * go wrong on the one screen whose whole job is letting somebody in. Assessing a
 * password the person already chose would also be scolding them at the door.
 */
type PasswordMeterProps =
  | {
      readonly meter: 'STRENGTH';
      readonly value: string;
      readonly onValueChange: (value: string) => void;
    }
  | {
      readonly meter: 'NONE';
      readonly value?: string;
      readonly onValueChange?: (value: string) => void;
    };

type PasswordFieldProps = BasePasswordFieldProps & PasswordMeterProps;

/**
 * A password input with a visibility toggle, in one place because three screens
 * ask for one and all three need the same affordances.
 *
 * The toggle is not a nicety for this audience. A masked field on a cheap phone
 * keyboard is where people mistype, get locked out, and give up — and giving up
 * at the door of a personal-finance app is the failure that costs most. It is
 * `type="button"`: a button inside a form submits it by default, which here would
 * send the form on every reveal.
 *
 * The requirement text is a **hint with `aria-describedby`, never a placeholder**.
 * A placeholder vanishes the moment somebody types, sits at low contrast while it
 * is there, and is not reliably read out — so a rule that only exists in one is a
 * rule the user meets by accident.
 */
export function PasswordField({
  name,
  label,
  autoComplete,
  meter,
  value,
  onValueChange,
  hint,
  error,
  labelAction,
  enterKeyHint,
}: PasswordFieldProps) {
  const fieldId = useId();
  const hintId = useId();
  const meterId = useId();
  const errorId = useId();
  const [isVisible, setIsVisible] = useState(false);

  const describedBy = [
    hint === undefined ? null : hintId,
    meter === 'STRENGTH' ? meterId : null,
    error ? errorId : null,
  ]
    .filter((id) => id !== null)
    .join(' ');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={fieldId}>{label}</Label>
        {labelAction}
      </div>

      <div className="relative">
        <Input
          id={fieldId}
          name={name}
          type={isVisible ? 'text' : 'password'}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint={enterKeyHint}
          minLength={PASSWORD_MINIMUM_LENGTH}
          className="h-10 pr-10"
          /* `undefined` leaves the input uncontrolled, which is the sign-in
             case. It is fixed per call site, so React never has to switch. */
          value={value}
          onChange={
            onValueChange === undefined
              ? undefined
              : (event) => onValueChange(event.target.value)
          }
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy === '' ? undefined : describedBy}
          required
        />

        <button
          type="button"
          onClick={() => setIsVisible((wasVisible) => !wasVisible)}
          aria-label={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={isVisible}
          aria-controls={fieldId}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {isVisible ? (
            <EyeOff aria-hidden className="size-4" />
          ) : (
            <Eye aria-hidden className="size-4" />
          )}
        </button>
      </div>

      {hint === undefined ? null : (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}

      {meter === 'STRENGTH' ? (
        <PasswordStrengthMeter password={value ?? ''} describedById={meterId} />
      ) : null}

      {error ? (
        <p id={errorId} className="flex items-start gap-2 text-sm text-destructive">
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
