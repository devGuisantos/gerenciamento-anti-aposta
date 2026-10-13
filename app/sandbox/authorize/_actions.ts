'use server';

import { z } from 'zod';

import { readSessionToken, requireSession } from '@modules/identity';
import { decideAuthorisation } from '@modules/sandbox-bank';

/**
 * `redirectTo` is where the bank sends the browser next. It is handed back
 * instead of `redirect()`ed because the target is a Route Handler, and a
 * Server Action redirect is a client-side navigation: the router would render
 * the page the handler bounces to while keeping the handler's URL as the
 * current one, so the next Server Action on that page would be POSTed to the
 * handler and answered `405`. A real bank is another origin and gets a full
 * page load; this one has to ask for it.
 */
export type AuthorisationFormState = {
  readonly message: string | null;
  readonly redirectTo: string | null;
};

/** The form arrived without the request it answers — a crafted POST, not a person. */
const MALFORMED_STATE: AuthorisationFormState = {
  message: 'Não conseguimos ler esta autorização. Volte ao anti-aposta e comece de novo.',
  redirectTo: null,
};

/**
 * Shape only. The bank checks everything that matters — the client, the exact
 * redirect, that the consent still waits, that every account is the person's —
 * and an action is a public endpoint, so nothing the page rendered counts.
 */
const decisionSchema = z.object({
  clientId: z.string().min(1),
  redirectUri: z.string().min(1),
  scope: z.string().min(1),
  state: z.string().min(1),
  codeChallenge: z.string().min(1),
  codeChallengeMethod: z.string().min(1),
  decision: z.enum(['APPROVE', 'REJECT']),
  accountIds: z.array(z.string()),
});

/**
 * The person's answer. Either way the browser goes back to anti-aposta's
 * registered redirect, carrying a code or `access_denied` — the bank decides
 * which URL, never this action, so nothing here can be steered elsewhere.
 */
export async function decideAuthorisationAction(
  _previous: AuthorisationFormState,
  formData: FormData,
): Promise<AuthorisationFormState> {
  await requireSession();
  const token = await readSessionToken();
  const fields = decisionSchema.safeParse({
    ...Object.fromEntries(formData),
    accountIds: formData.getAll('accountIds'),
  });

  if (token === null || !fields.success) {
    return MALFORMED_STATE;
  }

  const result = await decideAuthorisation(token, fields.data);

  if (!result.ok) {
    return { message: result.failure.message, redirectTo: null };
  }

  return { message: null, redirectTo: result.value };
}
