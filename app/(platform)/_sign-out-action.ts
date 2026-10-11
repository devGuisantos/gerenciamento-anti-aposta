'use server';

import { redirect } from 'next/navigation';

import { clearSession, endSession, readSessionToken } from '@modules/identity';

/**
 * Revokes the session on the backend, then drops the cookie whatever the
 * backend answered: somebody who pressed "Sair" must leave signed out even if
 * the server was unreachable, and the backend's `DELETE` is idempotent anyway.
 */
export async function signOutAction(): Promise<void> {
  const token = await readSessionToken();

  if (token !== null) {
    await endSession(token);
  }

  await clearSession();
  redirect('/login');
}
