import { z } from 'zod';

import { callBackend, type BackendResult } from '@shared/infrastructure/backend-api';

/**
 * The person's correction of a classification, and its undo. The backend owns
 * the rule — the override outranks the policy chain for that transaction, and
 * every figure derived from it recomputes there.
 */
const classificationSchema = z.object({
  transaction: z.object({
    id: z.string(),
    bet: z
      .object({
        matchedBy: z.enum(['GAMBLING_MCC', 'LICENSED_CNPJ', 'DESCRIPTION_KEYWORD']),
        confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
        source: z.enum(['POLICY', 'USER_OVERRIDE']),
      })
      .nullable(),
    yieldEquivalent: z.object({ amountInCents: z.number().int(), currency: z.literal('BRL') }).nullable(),
  }),
  override: z
    .object({
      verdict: z.literal('NOT_A_BET'),
      overriddenAt: z.iso.datetime({ offset: true }),
      isReversible: z.boolean(),
    })
    .nullable(),
});

export type Classification = z.infer<typeof classificationSchema>;

function overridePath(transactionId: string): string {
  return `/transactions/${encodeURIComponent(transactionId)}/classification-override`;
}

/** `POST …/classification-override` — "Isto não é uma aposta". */
export async function overrideClassification(
  sessionToken: string,
  transactionId: string,
): Promise<BackendResult<Classification>> {
  return callBackend({
    method: 'POST',
    path: overridePath(transactionId),
    body: { verdict: 'NOT_A_BET' },
    sessionToken,
    responseSchema: classificationSchema,
  });
}

/** `DELETE …/classification-override` — the policy chain's verdict applies again. */
export async function revertClassificationOverride(
  sessionToken: string,
  transactionId: string,
): Promise<BackendResult<Classification>> {
  return callBackend({
    method: 'DELETE',
    path: overridePath(transactionId),
    sessionToken,
    responseSchema: classificationSchema,
  });
}
