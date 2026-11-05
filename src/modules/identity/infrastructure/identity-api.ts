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

const accountSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    registeredAt: z.iso.datetime({ offset: true }),
  }),
  registrationConsent: z.object({
    acceptedAt: z.iso.datetime({ offset: true }),
    policyVersion: z.string(),
    scope: z.string(),
  }),
  activeSessionCount: z.number().int().nonnegative(),
});

/** What `/settings` shows. */
export type Account = z.infer<typeof accountSchema>;


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
  /** Cloudflare Turnstile's single-use token; the backend verifies it. */
  readonly humanVerificationToken: string;
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

/** `GET /identity/users/current` — the account, the consent behind it, its open sessions. */
export async function fetchAccount(sessionToken: string): Promise<BackendResult<Account>> {
  return callBackend({
    method: 'GET',
    path: '/identity/users/current',
    sessionToken,
    responseSchema: accountSchema,
  });
}

/** `PUT /identity/users/current/display-name` */
export async function changeDisplayName(
  sessionToken: string,
  name: string,
): Promise<BackendResult<null>> {
  return callBackend({
    method: 'PUT',
    path: '/identity/users/current/display-name',
    body: { name },
    sessionToken,
    responseSchema: noContentSchema,
  });
}

/** `PUT /identity/users/current/email` — needs the password; the address is not verified. */
export async function changeEmail(
  sessionToken: string,
  request: { readonly email: string; readonly currentPassword: string },
): Promise<BackendResult<null>> {
  return callBackend({
    method: 'PUT',
    path: '/identity/users/current/email',
    body: request,
    sessionToken,
    responseSchema: noContentSchema,
  });
}

/** `PUT /identity/users/current/password` — ends every other session, keeps this one. */
export async function changePassword(
  sessionToken: string,
  request: {
    readonly currentPassword: string;
    readonly password: string;
    readonly passwordConfirmation: string;
  },
): Promise<BackendResult<null>> {
  return callBackend({
    method: 'PUT',
    path: '/identity/users/current/password',
    body: request,
    sessionToken,
    responseSchema: noContentSchema,
  });
}

/** `DELETE /identity/sessions/others` */
export async function endOtherSessions(sessionToken: string): Promise<BackendResult<null>> {
  return callBackend({
    method: 'DELETE',
    path: '/identity/sessions/others',
    sessionToken,
    responseSchema: noContentSchema,
  });
}

/** `POST /identity/users/current/deletion` — erases the account at once, sessions included. */
export async function deleteAccount(
  sessionToken: string,
  currentPassword: string,
): Promise<BackendResult<null>> {
  return callBackend({
    method: 'POST',
    path: '/identity/users/current/deletion',
    body: { currentPassword },
    sessionToken,
    responseSchema: noContentSchema,
  });
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
