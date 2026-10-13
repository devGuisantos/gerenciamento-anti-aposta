'use server';

import { z } from 'zod';

import { readSessionToken, requireSession } from '@modules/identity';
import { sendDemoNotification, type DemoNotificationDraft } from '@modules/notifications';
import {
  bookLedgerEntryFor,
  ENTRY_TYPES,
  listCustomerBankAccounts,
  type BankAccount,
} from '@modules/sandbox-bank';

import { USER_ID_PATTERN } from './_admin-copy';
import { AMOUNT_PATTERN } from './_ledger-entry-form';

/** What a command on this console hands back: one line, and whether it worked. */
export type AdminCommandState = {
  readonly ok: boolean;
  readonly message: string;
};

/** A command that did not happen, and why: fits every answer type on this console. */
type Refusal = { readonly ok: false; readonly message: string };

export type RecipientAccountsState =
  | { readonly ok: true; readonly accounts: readonly BankAccount[] }
  | Refusal;

const SESSION_LOST: Refusal = {
  ok: false,
  message: 'Sua sessão terminou. Entre de novo para continuar.',
};

const INVALID_RECIPIENT: Refusal = {
  ok: false,
  message: 'Informe o identificador completo da pessoa, como aparece no topo desta página.',
};

/** The backend answers 404 for a route it never mounted: demo writes are off there. */
const DEMO_SWITCHED_OFF = 'O console de demonstração não está disponível neste ambiente.';

const recipientSchema = z.string().trim().regex(USER_ID_PATTERN);

/**
 * Every action here is a public POST endpoint, so each one asks who is calling
 * before anything else. Any signed-in person may use the console — which is why
 * the backend mounts its routes only where demo writes are on, never in
 * production.
 */
async function callerToken(): Promise<string | null> {
  await requireSession();

  return readSessionToken();
}

/** Somebody's accounts at the simulated bank, so a movement can be booked for them. */
export async function listRecipientAccountsAction(
  recipientId: string,
): Promise<RecipientAccountsState> {
  const token = await callerToken();
  const recipient = recipientSchema.safeParse(recipientId);

  if (token === null) {
    return SESSION_LOST;
  }

  if (!recipient.success) {
    return INVALID_RECIPIENT;
  }

  const result = await listCustomerBankAccounts(token, recipient.data);

  if (!result.ok) {
    return { ok: false, message: describeFailure(result.failure.code, result.failure.message) };
  }

  return { ok: true, accounts: result.value };
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
 * Books a movement at the simulated bank, on the recipient's account. The bank
 * then tells the platform, which reads it at once if that person has an active
 * consent — so their open screen updates without anybody pressing a button.
 */
export async function bookLedgerEntryForAction(
  recipientId: string,
  input: LedgerEntryFormInput,
): Promise<AdminCommandState> {
  const token = await callerToken();
  const recipient = recipientSchema.safeParse(recipientId);
  const fields = ledgerEntrySchema.safeParse(input);

  if (token === null) {
    return SESSION_LOST;
  }

  if (!recipient.success) {
    return INVALID_RECIPIENT;
  }

  if (!fields.success) {
    return { ok: false, message: fields.error.issues[0]?.message ?? 'Confira os campos.' };
  }

  const { direction, amount, merchantCategoryCode, payeeDocument, ...entry } = fields.data;
  const result = await bookLedgerEntryFor(token, recipient.data, {
    ...entry,
    amountInCents: direction === 'DEBIT' ? -amount : amount,
    merchantCategoryCode: merchantCategoryCode === '' ? null : Number(merchantCategoryCode),
    payeeDocument: payeeDocument === '' ? null : payeeDocument,
  });

  if (!result.ok) {
    return { ok: false, message: describeFailure(result.failure.code, result.failure.message) };
  }

  return {
    ok: true,
    message:
      'Lançamento registrado no banco. Se a pessoa tiver um consentimento ativo, ele aparece na tela dela em instantes.',
  };
}

const text = z.string().trim().min(1, 'Preencha todos os campos.').max(140, 'Use no máximo 140 caracteres.');
const cents = z.number().int('Use um valor em reais, com até dois decimais.');

/** The console's drafts. A nudge carries no yield: the backend reframes the amount itself. */
const demoDraftSchema = z.discriminatedUnion(
  'kind',
  [
    z.object({
      kind: z.literal('AWARENESS_NUDGE'),
      merchant: text,
      amountInCents: cents.refine((value) => value !== 0, 'O valor da aposta precisa ser maior que zero.'),
      monthlyTotalInCents: cents.nonnegative('O total do mês não pode ser negativo.'),
      matchedBy: text,
    }),
    z.object({ kind: z.literal('BADGE_AWARDED'), badgeId: text, title: text, description: text }),
    z.object({ kind: z.literal('STREAK_BROKEN'), previousDays: z.number().int().positive() }),
    z.object({ kind: z.literal('GOAL_REACHED'), label: text, amountInCents: cents.positive() }),
  ],
  { message: 'Escolha um tipo de notificação conhecido.' },
);

/** Sends one notification to one person, through the backend's stream. */
export async function sendDemoNotificationAction(
  recipientId: string,
  draft: DemoNotificationDraft,
): Promise<AdminCommandState> {
  const token = await callerToken();
  const recipient = recipientSchema.safeParse(recipientId);
  const parsed = demoDraftSchema.safeParse(draft);

  if (token === null) {
    return SESSION_LOST;
  }

  if (!recipient.success) {
    return INVALID_RECIPIENT;
  }

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Confira os campos.' };
  }

  const result = await sendDemoNotification(token, recipient.data, parsed.data);

  if (!result.ok) {
    return { ok: false, message: describeFailure(result.failure.code, result.failure.message) };
  }

  return { ok: true, message: 'Notificação enviada. Ela aparece nas abas abertas dessa pessoa.' };
}

/**
 * The backend's own sentence, except where a code means the console itself is
 * unavailable here rather than that something about the request was wrong.
 */
function describeFailure(code: string, message: string): string {
  return code === 'NOT_FOUND' ? DEMO_SWITCHED_OFF : message;
}
