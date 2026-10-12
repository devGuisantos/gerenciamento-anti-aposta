import { CircleAlert } from 'lucide-react';

/**
 * What went wrong, next to the form that caused it.
 *
 * `role="alert"` because the message appears after a submit the user has already
 * looked away from — a validation error nobody is told about is a form that seems
 * to do nothing. Red is right here: it is a genuinely negative signal about the
 * action itself, and the icon plus the wording carry the meaning on their own.
 */
export function FormError({ message }: { readonly message: string | null }) {
  if (message === null) return null;

  return (
    <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  );
}
