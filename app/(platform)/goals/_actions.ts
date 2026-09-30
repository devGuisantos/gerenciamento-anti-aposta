'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { formatBRL } from '@shared/ui/money-text';

import {
  AMOUNT_PATTERN,
  GOAL_PURPOSES,
  GOAL_TITLE_MAXIMUM_LENGTH,
  GOAL_TITLE_MINIMUM_LENGTH,
} from './_savings-goal';
import { createSavingsGoal, recordMovement } from './_savings-goals-store';

/**
 * The savings-goal write side.
 *
 * TODO(identity, gamification): a Server Action is a **public POST endpoint** —
 * anyone can call these, from anywhere, with anything. Each one has to open with
 * `const session = await requireSession()` and pass `session.userId` into the use
 * case, and the store has to be keyed by that user. Until the identity module
 * lands there is one shared set of goals and no caller check at all: this is safe
 * only because the demo runs on one machine with nothing real in it. Do not ship
 * it as it stands.
 *
 * The parsing below is not the part that is missing. An action never trusts its
 * input regardless of which page it was reachable from, which is why the bounds
 * the form already enforces are all re-checked here.
 */

/** The same rule the input enforces, anchored for a whole-string match. */
const ANCHORED_AMOUNT_PATTERN = new RegExp(`^${AMOUNT_PATTERN.source}$`);

/**
 * Every message is written in Portuguese, including the ones for fields the user
 * never fills in. An action is reachable with any payload at all, and a Zod
 * default would surface "Invalid option: expected one of…" in a dialog.
 */
const GENERIC_FAILURE = 'Não foi possível salvar. Recarregue a página e tente de novo.';

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
  /* Both come from hidden fields, so a failure here is a broken page rather than
     something the user typed — the message says what they can actually do. */
  goalId: z.string({ message: GENERIC_FAILURE }).trim().min(1, GENERIC_FAILURE).max(64, GENERIC_FAILURE),
  direction: z.enum(['DEPOSIT', 'WITHDRAWAL'], { message: GENERIC_FAILURE }),
  amountInCents: amountInCents,
});

/** What the dialogs render. `SAVED` is what tells a form it may close itself. */
export type GoalActionResult =
  | {
      readonly status: 'SAVED';
      /**
       * Set only when this write is the one that reached a goal. The server decides
       * it, never the browser: a celebration the client talked itself into is a
       * celebration for something that may not have happened.
       */
      readonly reachedGoalTitle: string | null;
    }
  | { readonly status: 'FAILED'; readonly error: string };

function toFirstMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? GENERIC_FAILURE;
}

export async function createSavingsGoalAction(formData: FormData): Promise<GoalActionResult> {
  const parsed = createSavingsGoalSchema.safeParse({
    title: formData.get('title'),
    purpose: formData.get('purpose'),
    targetInCents: formData.get('targetInCents'),
  });

  if (!parsed.success) return { status: 'FAILED', error: toFirstMessage(parsed.error) };

  /* A new goal starts empty and the amount must be positive, so nothing can be
     reached by creating one. */
  createSavingsGoal(parsed.data);
  revalidatePath('/goals');

  return { status: 'SAVED', reachedGoalTitle: null };
}

export async function recordMovementAction(formData: FormData): Promise<GoalActionResult> {
  const parsed = recordMovementSchema.safeParse({
    goalId: formData.get('goalId'),
    direction: formData.get('direction'),
    amountInCents: formData.get('amountInCents'),
  });

  if (!parsed.success) return { status: 'FAILED', error: toFirstMessage(parsed.error) };

  const outcome = recordMovement(parsed.data);

  if (outcome.status === 'GOAL_NOT_FOUND') {
    return { status: 'FAILED', error: 'Esta meta não existe mais. Recarregue a página.' };
  }

  if (outcome.status === 'INSUFFICIENT_BALANCE') {
    return {
      status: 'FAILED',
      error: `Esta meta tem ${formatBRL(outcome.savedInCents)} guardados. Não é possível retirar mais do que isso.`,
    };
  }

  revalidatePath('/goals');
  return {
    status: 'SAVED',
    reachedGoalTitle: outcome.reachedNow ? outcome.goal.title : null,
  };
}
