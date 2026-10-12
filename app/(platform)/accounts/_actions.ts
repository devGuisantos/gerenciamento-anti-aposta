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
import { bookLedgerEntry, ENTRY_TYPES } from '@modules/sandbox-bank';

import { AMOUNT_PATTERN } from './_ledger-entry-form';

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

const ANCHORED_AMOUNT_PATTERN = new RegExp(`^${AMOUNT_PATTERN.source}$`);
const DIGITS_ONLY = /^\d+$/;

/**
 * Every message in Portuguese, including for fields the form never leaves
 * empty: an action is reachable with any payload, and a Zod default would put
 * "Invalid input" on the screen.
 */
const ledgerEntrySchema = z.object({
  accountId: z.string({ message: 'Escolha uma conta.' }).min(1, 'Escolha uma conta.'),
  direction: z.enum(['DEBIT', 'CREDIT'], { message: 'Diga se é uma saída ou uma entrada.' }),
  amount: z
    .string({ message: 'Informe o valor.' })
    .trim()
    .regex(ANCHORED_AMOUNT_PATTERN, 'Escreva o valor como 50 ou 50,90, sem ponto de milhar.')
    .transform((raw) => Math.round(Number(raw.replace(',', '.')) * 100))
    .refine((cents) => cents > 0, 'O valor precisa ser maior que zero.'),
  transactionName: z
    .string({ message: 'Escreva a descrição.' })
    .trim()
    .min(1, 'Escreva a descrição, como ela apareceria no extrato.')
    .max(140, 'Use no máximo 140 caracteres.'),
  type: z.enum(ENTRY_TYPES, { message: 'Escolha como o dinheiro se moveu.' }),
  merchantCategoryCode: z
    .string()
    .trim()
    .refine((value) => value === '' || (DIGITS_ONLY.test(value) && value.length <= 4), 'O MCC tem até 4 dígitos.'),
  payeeDocument: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || (DIGITS_ONLY.test(value) && [11, 14].includes(value.length)),
      'Use 11 dígitos (CPF) ou 14 (CNPJ), só números.',
    ),
});

export type LedgerEntryFormInput = z.input<typeof ledgerEntrySchema>;

/**
 * Books a movement at the simulated bank. It writes to the bank only: the
 * platform sees it at the next synchronisation, exactly as with a real bank.
 */
export async function bookLedgerEntryAction(
  input: LedgerEntryFormInput,
): Promise<AccountsCommandState> {
  const token = await callerToken();
  const fields = ledgerEntrySchema.safeParse(input);

  if (token === null) {
    return SESSION_LOST;
  }

  if (!fields.success) {
    return { ok: false, message: fields.error.issues[0]?.message ?? 'Confira os campos.' };
  }

  const { direction, amount, merchantCategoryCode, payeeDocument, ...entry } = fields.data;
  const result = await bookLedgerEntry(token, {
    ...entry,
    amountInCents: direction === 'DEBIT' ? -amount : amount,
    merchantCategoryCode: merchantCategoryCode === '' ? null : Number(merchantCategoryCode),
    payeeDocument: payeeDocument === '' ? null : payeeDocument,
  });

  if (!result.ok) {
    return { ok: false, message: describeBookingFailure(result.failure.code, result.failure.message) };
  }

  return {
    ok: true,
    message: 'Lançamento registrado no banco. Ele chega ao anti-aposta na próxima sincronização.',
  };
}

/** The route is not mounted where the backend switched ledger writes off. */
function describeBookingFailure(code: string, message: string): string {
  return code === 'NOT_FOUND'
    ? 'O banco simulado não aceita lançamentos neste ambiente.'
    : message;
}
