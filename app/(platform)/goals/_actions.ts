'use server';

import { refresh } from 'next/cache';
import { z } from 'zod';

import {
  createSavingsGoal,
  listGoalMovements,
  recordGoalMovement,
  setBettingCeiling,
} from '@modules/gamification';
import { readSessionToken, requireSession } from '@modules/identity';
import type { BackendFailure } from '@shared/infrastructure/backend-api';
import { formatBRL } from '@shared/ui/money-text';

import { toMonthName } from './_ceiling-view';
import {
  AMOUNT_PATTERN,
  GOAL_PURPOSES,
  GOAL_TITLE_MAXIMUM_LENGTH,
  GOAL_TITLE_MINIMUM_LENGTH,
} from './_savings-goal';
import { toMovementRows, type MovementRow } from './_savings-goals-view';

/**
 * The goals write side, and the history's pages.
 *
 * A Server Action is a **public POST endpoint** — anyone can call these, from
 * anywhere, with anything — so each one asks who is calling first, and the
 * backend scopes every goal by that caller: an id that is not theirs answers
 * 404 there. The bounds the form already enforces are re-checked here, because
 * an action never trusts its input whichever page it was reachable from; the
 * rules themselves — the balance, the over-withdrawal, the crossing of a
 * target, the month a ceiling starts — are the backend's.
 */

const SESSION_LOST = 'Sua sessão terminou. Entre de novo para continuar.';

/**
 * Every message is written in Portuguese, including the ones for fields the user
 * never fills in. An action is reachable with any payload at all, and a Zod
 * default would surface "Invalid option: expected one of…" in a dialog.
 */
const GENERIC_FAILURE = 'Não foi possível salvar. Recarregue a página e tente de novo.';

/** The same rule the input enforces, anchored for a whole-string match. */
const ANCHORED_AMOUNT_PATTERN = new RegExp(`^${AMOUNT_PATTERN.source}$`);

/** Longer than any cursor the backend issues; it decodes and rejects the rest. */
const CURSOR_MAXIMUM_LENGTH = 512;

async function callerToken(): Promise<string | null> {
  await requireSession();

  return readSessionToken();
}

const amountInCents = z
  .string({ message: 'Informe um valor.' })
  .trim()
  .regex(ANCHORED_AMOUNT_PATTERN, 'Escreva o valor como 250 ou 250,50, sem ponto de milhar.')
  .transform((raw) => Math.round(Number(raw.replace(',', '.')) * 100))
  .refine((cents) => cents > 0, 'O valor precisa ser maior que zero.');

const createSavingsGoalSchema = z.object({
  title: z
    .string({ message: 'Dê um nome à meta.' })
    .trim()
    .min(GOAL_TITLE_MINIMUM_LENGTH, 'Dê um nome com pelo menos 3 letras.')
    .max(GOAL_TITLE_MAXIMUM_LENGTH, 'O nome ficou longo demais.'),
  purpose: z.enum(GOAL_PURPOSES, { message: 'Escolha para que serve esta meta.' }),
  targetInCents: amountInCents,
});

const recordMovementSchema = z.object({
  /* All three come from hidden fields, so a failure here is a broken page rather
     than something the user typed — the message says what they can actually do. */
  goalId: z.uuid({ message: GENERIC_FAILURE }),
  direction: z.enum(['DEPOSIT', 'WITHDRAWAL'], { message: GENERIC_FAILURE }),
  idempotencyKey: z.uuid({ message: GENERIC_FAILURE }),
  amountInCents: amountInCents,
});

/** What the dialogs render. `SAVED` is what tells a form it may close itself. */
export type GoalActionResult =
  | {
      readonly status: 'SAVED';
      /**
       * Set only when this write is the one that reached a goal. The backend
       * decides it, never the browser: a celebration the client talked itself
       * into is a celebration for something that may not have happened.
       */
      readonly reachedGoalTitle: string | null;
    }
  | { readonly status: 'FAILED'; readonly error: string };

function toFirstMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? GENERIC_FAILURE;
}

/** The backend's sentence, or — for a refused withdrawal — the balance in the reader's format. */
function toFailureMessage(failure: BackendFailure): string {
  const savedInCents = failure.details['savedInCents'];

  if (failure.code === 'INSUFFICIENT_BALANCE' && typeof savedInCents === 'number') {
    return `Esta meta tem ${formatBRL(savedInCents)} guardados. Não é possível retirar mais do que isso.`;
  }

  return failure.message;
}

export async function createSavingsGoalAction(formData: FormData): Promise<GoalActionResult> {
  const token = await callerToken();
  if (token === null) return { status: 'FAILED', error: SESSION_LOST };

  const parsed = createSavingsGoalSchema.safeParse({
    title: formData.get('title'),
    purpose: formData.get('purpose'),
    targetInCents: formData.get('targetInCents'),
  });

  if (!parsed.success) return { status: 'FAILED', error: toFirstMessage(parsed.error) };

  const result = await createSavingsGoal(token, parsed.data);
  if (!result.ok) return { status: 'FAILED', error: toFailureMessage(result.failure) };

  refresh();

  /* A new goal starts empty and its target is positive, so nothing is reached by creating one. */
  return { status: 'SAVED', reachedGoalTitle: null };
}

export async function recordMovementAction(formData: FormData): Promise<GoalActionResult> {
  const token = await callerToken();
  if (token === null) return { status: 'FAILED', error: SESSION_LOST };

  const parsed = recordMovementSchema.safeParse({
    goalId: formData.get('goalId'),
    direction: formData.get('direction'),
    idempotencyKey: formData.get('idempotencyKey'),
    amountInCents: formData.get('amountInCents'),
  });

  if (!parsed.success) return { status: 'FAILED', error: toFirstMessage(parsed.error) };

  const result = await recordGoalMovement(token, parsed.data);
  if (!result.ok) return { status: 'FAILED', error: toFailureMessage(result.failure) };

  refresh();

  return {
    status: 'SAVED',
    reachedGoalTitle: result.value.reachedNow ? result.value.goal.title : null,
  };
}

export type MovementPageState =
  | { readonly ok: true; readonly rows: readonly MovementRow[]; readonly nextCursor: string | null }
  | { readonly ok: false; readonly message: string };

const movementPageSchema = z.object({
  goalId: z.uuid(),
  cursor: z.string().min(1).max(CURSOR_MAXIMUM_LENGTH).nullable(),
});

/** One page of a goal's history, newest first, with every date already a label. */
export async function loadMovementsAction(input: unknown): Promise<MovementPageState> {
  const token = await callerToken();
  const parsed = movementPageSchema.safeParse(input);

  if (token === null) return { ok: false, message: SESSION_LOST };
  if (!parsed.success) return { ok: false, message: GENERIC_FAILURE };

  const result = await listGoalMovements(token, parsed.data.goalId, parsed.data.cursor);
  if (!result.ok) return { ok: false, message: result.failure.message };

  return { ok: true, rows: toMovementRows(result.value.items), nextCursor: result.value.nextCursor };
}

export type CeilingActionResult =
  | { readonly status: 'SAVED'; readonly message: string }
  | { readonly status: 'FAILED'; readonly message: string };

/** Whole cents, never negative, at most the backend's cap — the slider can send nothing else. */
const ceilingSchema = z.number().int().min(0).max(1_000_000_000);

/**
 * "Usar R$ X como minha meta". The answer says from when the value governs,
 * because the month under way keeps the ceiling it started with — a change that
 * silently waited would read as one that did not happen.
 */
export async function setCeilingAction(ceilingInCents: number): Promise<CeilingActionResult> {
  const token = await callerToken();
  const parsed = ceilingSchema.safeParse(ceilingInCents);

  if (token === null) return { status: 'FAILED', message: SESSION_LOST };
  if (!parsed.success) return { status: 'FAILED', message: GENERIC_FAILURE };

  const result = await setBettingCeiling(token, parsed.data);
  if (!result.ok) return { status: 'FAILED', message: result.failure.message };

  refresh();

  const amount = formatBRL(parsed.data);
  const startsLater = result.value.scheduled?.effectiveFromMonthKey === result.value.effectiveFromMonthKey;

  return {
    status: 'SAVED',
    message: startsLater
      ? `O teto de ${amount} começa a valer em ${toMonthName(result.value.effectiveFromMonthKey)}. Este mês continua com o teto que já estava valendo.`
      : `O teto deste mês é ${amount}.`,
  };
}
