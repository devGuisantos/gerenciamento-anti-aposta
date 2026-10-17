'use server';

import { refresh } from 'next/cache';
import { z } from 'zod';

import { overrideClassification, revertClassificationOverride } from '@modules/bet-detection';
import { readSessionToken, requireSession } from '@modules/identity';
import { LEDGER_PERIODS, LEDGER_TYPES, listTransactions } from '@modules/open-finance';

import { BOOKMAKER_ID_MAXIMUM_LENGTH, SEARCH_MAXIMUM_LENGTH } from './_statement-params';
import {
  toClassificationPatch,
  toStatementRows,
  type ClassificationPatch,
  type StatementRow,
} from './_statement-view';

const SESSION_LOST = 'Sua sessão terminou. Entre de novo para continuar.';

/** Longer than any cursor the backend issues; it decodes and rejects the rest. */
const CURSOR_MAXIMUM_LENGTH = 512;

export type NextPageState =
  | { readonly ok: true; readonly rows: readonly StatementRow[]; readonly nextCursor: string | null }
  | { readonly ok: false; readonly message: string };

export type CorrectionState =
  | { readonly ok: true; readonly message: string; readonly patch: ClassificationPatch }
  | { readonly ok: false; readonly message: string };

/**
 * Every action here is a public POST endpoint, so each one asks who is calling
 * before anything else. The backend scopes every row by that caller — an id
 * that is not theirs answers 404 there.
 */
async function callerToken(): Promise<string | null> {
  await requireSession();

  return readSessionToken();
}

const nextPageSchema = z.object({
  filters: z.object({
    type: z.enum(LEDGER_TYPES),
    period: z.enum(LEDGER_PERIODS),
    accountId: z.uuid().nullable(),
    bookmakerId: z.string().min(1).max(BOOKMAKER_ID_MAXIMUM_LENGTH).nullable(),
    search: z.string().max(SEARCH_MAXIMUM_LENGTH),
  }),
  cursor: z.string().min(1).max(CURSOR_MAXIMUM_LENGTH),
});

/** "Carregar mais": the next page of the same slice, continued from the backend's cursor. */
export async function loadNextPageAction(input: unknown): Promise<NextPageState> {
  const token = await callerToken();
  const parsed = nextPageSchema.safeParse(input);

  if (token === null) return { ok: false, message: SESSION_LOST };
  if (!parsed.success) return { ok: false, message: 'Não conseguimos aplicar esses filtros.' };

  const result = await listTransactions(token, { ...parsed.data.filters, cursor: parsed.data.cursor });

  if (!result.ok) return { ok: false, message: result.failure.message };

  return {
    ok: true,
    rows: toStatementRows(result.value.items, new Date()),
    nextCursor: result.value.nextCursor,
  };
}

const transactionIdSchema = z.uuid();

/**
 * "Isto não é uma aposta". The correction outranks the classifier for good —
 * and because the hero, the charts, the streak, the ceiling and the support
 * offer all follow the classification, the whole screen re-reads afterwards.
 */
export async function markNotABetAction(transactionId: string): Promise<CorrectionState> {
  const token = await callerToken();
  const id = transactionIdSchema.safeParse(transactionId);

  if (token === null || !id.success) return { ok: false, message: SESSION_LOST };

  const result = await overrideClassification(token, id.data);

  if (!result.ok) return { ok: false, message: result.failure.message };

  refresh();

  return {
    ok: true,
    message: 'Correção registrada. Esta transação não conta mais como aposta.',
    patch: toClassificationPatch(result.value),
  };
}

/** The same person undoing their own correction: the classifier's verdict applies again. */
export async function undoNotABetAction(transactionId: string): Promise<CorrectionState> {
  const token = await callerToken();
  const id = transactionIdSchema.safeParse(transactionId);

  if (token === null || !id.success) return { ok: false, message: SESSION_LOST };

  const result = await revertClassificationOverride(token, id.data);

  if (!result.ok) return { ok: false, message: result.failure.message };

  refresh();

  return {
    ok: true,
    message: 'Correção desfeita. A transação voltou a ser identificada como aposta.',
    patch: toClassificationPatch(result.value),
  };
}
