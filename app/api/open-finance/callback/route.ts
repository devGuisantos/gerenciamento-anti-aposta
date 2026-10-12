import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

import { findCurrentUser, readSessionToken } from '@modules/identity';
import {
  completeAuthorisation,
  takePendingConsent,
  type AuthorisationCallback,
} from '@modules/open-finance';

const ACCOUNTS_PATH = '/accounts';
const SIGN_IN_PATH = '/login';

/**
 * The redirect URI registered at the bank. The browser lands here with
 * `?code&state` after a yes, or `?error&state` after a no, and this relays it
 * to the backend — which checks the `state`, exchanges the code with the PKCE
 * verifier it kept, and runs the first synchronisation. Nothing here decides
 * anything; it only carries the answer across.
 *
 * A GET with side effects because OAuth defines it that way: the bank can only
 * send the browser back with a redirect. The outcome is passed on as a code,
 * never as text, so a crafted URL cannot put words on the accounts screen.
 */
export async function GET(request: NextRequest): Promise<never> {
  if ((await findCurrentUser()) === null) {
    redirect(SIGN_IN_PATH);
  }

  const outcome = await relay(request.nextUrl.searchParams);

  redirect(`${ACCOUNTS_PATH}?${new URLSearchParams(outcome).toString()}`);
}

async function relay(query: URLSearchParams): Promise<Record<string, string>> {
  const token = await readSessionToken();
  const consentId = await takePendingConsent();
  const callback = toCallback(query);

  if (token === null || consentId === null || callback === null) {
    return { conexao: 'erro', motivo: 'AUTHORISATION_NOT_PENDING' };
  }

  const result = await completeAuthorisation(token, consentId, callback);

  if (!result.ok) {
    return { conexao: 'erro', motivo: result.failure.code };
  }

  return result.value.consent.status === 'AUTHORISED'
    ? { conexao: 'ativa', novas: String(result.value.ingestedCount) }
    : { conexao: 'recusada' };
}

function toCallback(query: URLSearchParams): AuthorisationCallback | null {
  const state = query.get('state');
  const code = query.get('code');
  const error = query.get('error');

  if (state === null) {
    return null;
  }

  if (code !== null) {
    return { state, code };
  }

  return error === null ? null : { state, error };
}
