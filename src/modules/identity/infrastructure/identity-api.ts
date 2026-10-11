import { z } from 'zod';

import { callBackend, type BackendResult } from '@shared/infrastructure/backend-api';

/** Registration and sign-in return the same `session` block, on purpose. */
const issuedSessionSchema = z.object({
  session: z.object({
    token: z.string(),
    expiresAt: z.iso.datetime(),
  }),
});

export type IssuedSession = z.infer<typeof issuedSessionSchema>['session'];

const currentSessionSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }),
});

/** Who is asking. Only what the delivery layer shows; never the token. */
export type CurrentUser = z.infer<typeof currentSessionSchema>['user'];

/** `DELETE` answers `204` with no body. */
const noContentSchema = z.null();

export type RegistrationRequest = {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly passwordConfirmation: string;
  readonly acceptedRegistrationConsent: boolean;
};

export type SignInRequest = {
  readonly email: string;
  readonly password: string;
};

/** `POST /identity/users` — creates the account and opens its first session. */
export async function registerUser(
  request: RegistrationRequest,
): Promise<BackendResult<IssuedSession>> {
  const result = await callBackend({
    method: 'POST',
    path: '/identity/users',
    body: request,
    responseSchema: issuedSessionSchema,
  });

  return result.ok ? { ok: true, value: result.value.session } : result;
}

/** `POST /identity/sessions` — exchanges an e-mail and password for a session. */
export async function signIn(request: SignInRequest): Promise<BackendResult<IssuedSession>> {
  const result = await callBackend({
    method: 'POST',
    path: '/identity/sessions',
    body: request,
    responseSchema: issuedSessionSchema,
  });

  return result.ok ? { ok: true, value: result.value.session } : result;
}

/** `GET /identity/sessions/current` — resolves the token and slides its expiry. */
export async function fetchCurrentUser(sessionToken: string): Promise<BackendResult<CurrentUser>> {
  const result = await callBackend({
    method: 'GET',
    path: '/identity/sessions/current',
    sessionToken,
    responseSchema: currentSessionSchema,
  });

  return result.ok ? { ok: true, value: result.value.user } : result;
}

/** `DELETE /identity/sessions/current` — revokes the session; idempotent. */
export async function endSession(sessionToken: string): Promise<BackendResult<null>> {
  return callBackend({
    method: 'DELETE',
    path: '/identity/sessions/current',
    sessionToken,
    responseSchema: noContentSchema,
  });
}
