'use server';

import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { readSessionToken, requireSession } from '@modules/identity';
import {
  rememberPendingConsent,
  requestConsent,
  revokeConsent,
  synchroniseConsent,
} from '@modules/open-finance';

/** What a command on this screen hands back: one line, and whether it worked. */
export type AccountsCommandState = {
  readonly ok: boolean;
  readonly message: string;
};

const SESSION_LOST: AccountsCommandState = {
  ok: false,
  message: 'Sua sessão terminou. Entre de novo para continuar.',
};

/**
 * Every action here is a public POST endpoint, so each one asks who is calling
 * before anything else, and the backend scopes every consent and account by
 * that caller — an id that is not theirs answers 404 there.
 */
async function callerToken(): Promise<string | null> {
  await requireSession();

  return readSessionToken();
}

/**
 * "Conectar": registers the consent at the bank and sends the browser there.
 * The consent id waits in a short-lived cookie, because the bank's callback
 * carries only a code and a state.
 */
export async function connectBankAction(): Promise<void> {
  const token = await callerToken();

  if (token === null) {
    redirect('/login');
  }

  const result = await requestConsent(token);

  if (!result.ok) {
    redirect(`/accounts?conexao=erro&motivo=${encodeURIComponent(result.failure.code)}`);
  }

  await rememberPendingConsent(result.value.consent.id);
  redirect(result.value.authorisationUrl);
}

const consentIdSchema = z.string().min(1);

/** "Sincronizar": the platform asks the bank for what is new, as it would any bank. */
export async function synchroniseAction(consentId: string): Promise<AccountsCommandState> {
  const token = await callerToken();
  const id = consentIdSchema.safeParse(consentId);

  if (token === null || !id.success) {
    return SESSION_LOST;
  }

  const result = await synchroniseConsent(token, id.data);

  if (!result.ok) {
    return { ok: false, message: result.failure.message };
  }

  refresh();

  return { ok: true, message: describeIngestion(result.value.ingestedCount) };
}

function describeIngestion(count: number): string {
  if (count === 0) {
    return 'Tudo em dia: o banco não tinha transações novas.';
  }

  return count === 1 ? '1 transação nova recebida do banco.' : `${count} transações novas recebidas do banco.`;
}

/** "Revogar": the backend deletes every row it derived, then tells the bank. */
export async function revokeAction(consentId: string): Promise<AccountsCommandState> {
  const token = await callerToken();
  const id = consentIdSchema.safeParse(consentId);

  if (token === null || !id.success) {
    return SESSION_LOST;
  }

  const result = await revokeConsent(token, id.data);

  if (!result.ok) {
    return { ok: false, message: result.failure.message };
  }

  refresh();

  return {
    ok: true,
    message: 'Consentimento revogado. As transações e contas lidas foram apagadas.',
  };
}
