import { headers } from 'next/headers';
import { z } from 'zod';

import { env } from './env';

const API_PREFIX = '/api/v1';

/** Shown when the backend is unreachable or answers with something unexpected. */
const BACKEND_UNAVAILABLE_MESSAGE = 'Não conseguimos conectar ao servidor. Tente novamente em instantes.';

/** The single error envelope every backend failure arrives in. */
const failureEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
  }),
});

export type BackendFailure = z.infer<typeof failureEnvelopeSchema>['error'];

export type BackendResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly failure: BackendFailure };

const UNAVAILABLE: BackendFailure = {
  code: 'BACKEND_UNAVAILABLE',
  message: BACKEND_UNAVAILABLE_MESSAGE,
  details: {},
};

type BackendRequest<T> = {
  readonly method: 'GET' | 'POST' | 'DELETE';
  /** Relative to `/api/v1`, e.g. `/identity/sessions`. */
  readonly path: string;
  readonly body?: unknown;
  readonly sessionToken?: string;
  /** Parses the success body; the wire is a boundary like any other. */
  readonly responseSchema: z.ZodType<T>;
};

/**
 * Every call to backend-anti-aposta goes through here, so the base URL, the
 * bearer header and the error envelope are handled in exactly one place.
 * Server-only: it reads `env`, and the session token must never reach the browser.
 */
export async function callBackend<T>(request: BackendRequest<T>): Promise<BackendResult<T>> {
  const response = await fetch(`${env.BACKEND_API_URL}${API_PREFIX}${request.path}`, {
    method: request.method,
    headers: { ...headersFor(request), ...(await forwardedClientAddress()) },
    body: request.body === undefined ? undefined : JSON.stringify(request.body),
    cache: 'no-store',
  }).catch(() => null);

  if (response === null) {
    return { ok: false, failure: UNAVAILABLE };
  }

  const payload: unknown = await response.json().catch(() => null);

  return response.ok ? parseSuccess(payload, request.responseSchema) : parseFailure(payload);
}

function headersFor(request: BackendRequest<unknown>): HeadersInit {
  return {
    ...(request.body === undefined ? {} : { 'Content-Type': 'application/json' }),
    ...(request.sessionToken === undefined
      ? {}
      : { Authorization: `Bearer ${request.sessionToken}` }),
  };
}

/**
 * Every browser request reaches the backend from this server, so without this
 * the backend's per-IP limits would count all users as one and a single person
 * could spend the sign-in quota for everybody. The backend trusts this header
 * only from this server's address (its `TRUST_PROXY`).
 *
 * The **rightmost** entry, because it is the one added by the hop closest to us.
 * Next.js only fills the header in when the request arrives without one, so
 * when this server is exposed directly a visitor can still write their own —
 * in production it must sit behind a reverse proxy that sets the header.
 */
async function forwardedClientAddress(): Promise<Record<string, string>> {
  const forwardedFor = (await headers()).get('x-forwarded-for');
  const clientAddress = forwardedFor?.split(',').at(-1)?.trim();

  return clientAddress ? { 'X-Forwarded-For': clientAddress } : {};
}

function parseSuccess<T>(payload: unknown, schema: z.ZodType<T>): BackendResult<T> {
  const parsed = schema.safeParse(payload);

  return parsed.success ? { ok: true, value: parsed.data } : { ok: false, failure: UNAVAILABLE };
}

function parseFailure(payload: unknown): BackendResult<never> {
  const parsed = failureEnvelopeSchema.safeParse(payload);

  return { ok: false, failure: parsed.success ? parsed.data.error : UNAVAILABLE };
}
