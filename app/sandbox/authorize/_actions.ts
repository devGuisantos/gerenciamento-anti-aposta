'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { readSessionToken, requireSession } from '@modules/identity';
import { decideAuthorisation } from '@modules/sandbox-bank';

export type AuthorisationFormState = { readonly message: string | null };

/** The form arrived without the request it answers — a crafted POST, not a person. */
const MALFORMED_STATE: AuthorisationFormState = {
  message: 'Não conseguimos ler esta autorização. Volte ao anti-aposta e comece de novo.',
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
    return { message: result.failure.message };
  }

  redirect(result.value);
}
