'use server';

import { z } from 'zod';

import { readSessionToken, requireSession } from '@modules/identity';
import { listRecentTransactions } from '@modules/open-finance';

/** One line of the arrival toast: what the statement now shows at its top. */
export type ArrivalLine = {
  readonly id: string;
  readonly counterparty: string;
  readonly amountInCents: number;
  /** `null` for a row that is not a bet; `LOW` is shown as "Possível aposta". */
  readonly betConfidence: 'HIGH' | 'MEDIUM' | 'LOW' | null;
};

const countSchema = z.number().int().min(1).max(1_000);

/**
 * The newest lines of the statement, for the toast that says movements arrived.
 *
 * The notification itself carries only a count, on purpose: what the movements
 * were is the statement's to say, behind the session — so the toast asks the
 * statement. These are the **newest** lines, which after a bank notice are the
 * ones that just arrived; the toast says "mais recentes" rather than claiming
 * more than that.
 */
export async function describeArrivalsAction(count: unknown): Promise<readonly ArrivalLine[]> {
  await requireSession();
  const token = await readSessionToken();
  const parsed = countSchema.safeParse(count);

  if (token === null || !parsed.success) return [];

  const result = await listRecentTransactions(token);

  if (!result.ok) return [];

  return result.value.slice(0, parsed.data).map((transaction) => ({
    id: transaction.id,
    counterparty: transaction.counterparty,
    amountInCents: transaction.amount.amountInCents,
    betConfidence: transaction.bet?.confidence ?? null,
  }));
}
