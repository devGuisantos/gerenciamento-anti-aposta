import { Construction } from 'lucide-react';

/**
 * What a completed auth form says instead of signing somebody in.
 *
 * Same family as `PendingActionButton` and `PlaceholderPage`: temporary by
 * construction and obvious about it. The one rule is that it **never fakes
 * success** — nobody may leave this screen believing an account exists, a reset
 * e-mail went out, or a session was opened.
 *
 * It is inline rather than a toast, which is the opposite of the choice
 * `PendingActionButton` made, and for a reason: a toast fades in four seconds and
 * this person is stuck at a door. The message has to stay on screen while they
 * read it and look for the way around.
 *
 * It is also not an error. No red, no alarm: nothing the reader did was wrong, the
 * software simply is not finished. `role="status"` rather than `role="alert"` for
 * the same reason.
 */
export function PendingFormNotice({ children }: { readonly children: React.ReactNode }) {
  return (
    <div role="status" className="flex gap-3 rounded-lg bg-muted p-4">
      <Construction aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
