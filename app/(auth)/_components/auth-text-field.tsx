'use client';

import { useId } from 'react';
import { CircleAlert } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Keyboard and autofill behaviour per field kind, declared once.
 *
 * These are not polish. An Android keyboard capitalises the first letter of every
 * field by default, so an e-mail box left alone offers "Voce@exemplo.com" and the
 * sign-in fails for a reason the person cannot see — and autocorrect will happily
 * rewrite an address it does not recognise. This audience is on cheap phones, and
 * a login that fails once is a login somebody does not try twice.
 */
const FIELD_BEHAVIOUR = {
  email: {
    type: 'email',
    inputMode: 'email',
    autoCapitalize: 'none',
    autoCorrect: 'off',
    spellCheck: false,
  },
  name: {
    type: 'text',
    inputMode: 'text',
    autoCapitalize: 'words',
    autoCorrect: 'off',
    spellCheck: false,
  },
} as const satisfies Record<string, React.ComponentProps<'input'>>;

export type AuthFieldKind = keyof typeof FIELD_BEHAVIOUR;

type AuthTextFieldProps = {
  /** The form field name the action will read. */
  readonly name: string;
  readonly label: string;
  readonly kind: AuthFieldKind;
  readonly autoComplete: 'name' | 'email';
  readonly placeholder?: string;
  /** Shown under the input and wired with `aria-describedby`, never a placeholder. */
  readonly hint?: string;
  /** Rendered under the input with `aria-invalid`, next to the field that failed. */
  readonly error?: string | null;
  readonly enterKeyHint?: 'next' | 'done';
};

export function AuthTextField({
  name,
  label,
  kind,
  autoComplete,
  placeholder,
  hint,
  error,
  enterKeyHint,
}: AuthTextFieldProps) {
  const fieldId = useId();
  const hintId = useId();
  const errorId = useId();

  const describedBy = [hint === undefined ? null : hintId, error ? errorId : null]
    .filter((id) => id !== null)
    .join(' ');

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <Input
        {...FIELD_BEHAVIOUR[kind]}
        id={fieldId}
        name={name}
        autoComplete={autoComplete}
        enterKeyHint={enterKeyHint}
        placeholder={placeholder}
        className="h-10"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy === '' ? undefined : describedBy}
        required
      />
      {hint === undefined ? null : (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error ? (
        <p id={errorId} className="flex items-start gap-2 text-sm text-destructive">
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
