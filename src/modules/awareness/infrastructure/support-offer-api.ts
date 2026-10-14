import { z } from 'zod';

import { callBackend, type BackendResult } from '@shared/infrastructure/backend-api';

/**
 * Whether to surface support resources, as `awareness.EvaluateSupportOffer`
 * decides it. It takes no window and no filter on purpose: whether somebody is
 * shown a support line cannot depend on a chart option.
 */
const supportOfferSchema = z.object({
  shouldOffer: z.boolean(),
  sustainedMonths: z.number().int().nonnegative(),
  isRising: z.boolean(),
  thresholdInCents: z.number().int().nonnegative(),
});

export type SupportOffer = z.infer<typeof supportOfferSchema>;

/** `GET /awareness/support-offer`. A failure renders nothing, never an alarm. */
export async function fetchSupportOffer(
  sessionToken: string,
): Promise<BackendResult<SupportOffer>> {
  return callBackend({
    method: 'GET',
    path: '/awareness/support-offer',
    sessionToken,
    responseSchema: supportOfferSchema,
  });
}
