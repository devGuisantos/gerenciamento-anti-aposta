import { CircleAlert } from 'lucide-react';

/**
 * A failure that belongs to the form rather than to one field.
 *
 * "E-mail ou senha incorretos" is the case that matters: anchoring it under
 * either field would reveal which half of the pair was wrong. Everything that
 * *does* belong to a field is rendered next to that field instead.
 *
 * `role="alert"`, unlike `PendingFormNotice`'s `status`: this is announced the
 * moment it appears, because the person is waiting on the answer to a submit.
 */
export function FormFailureNotice({ message }: { readonly message: string | null }) {
  if (message === null) {
    return null;
  }

  return (
    <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  );
}
