import { z } from 'zod';

const LOOPBACK_HOSTS: ReadonlySet<string> = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Passwords and session tokens travel this link, so in production it is HTTPS
 * unless it never leaves the machine. A plain-HTTP backend on another host is
 * a misconfiguration that would otherwise work silently.
 */
function isSafeBackendUrl(value: string): boolean {
  const url = new URL(value);

  return (
    process.env.NODE_ENV !== 'production' ||
    url.protocol === 'https:' ||
    LOOPBACK_HOSTS.has(url.hostname)
  );
}

/** Cloudflare's always-passing test site key; it shows a "Somente para teste" banner. */
const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';

/** Cloudflare's test keys are a digit, `x`, then zeros; a real one is `0x4AAA…`. */
const TURNSTILE_TEST_KEY_PATTERN = /^[1-3]x0{10,}/;

/**
 * Locally and on previews, the test key. In Vercel production a missing or test
 * key would leave `/register` unprotected without anybody noticing, so the
 * build fails instead.
 */
function withTurnstileSiteKey<
  TFields extends { readonly TURNSTILE_SITE_KEY?: string | undefined; readonly VERCEL_ENV?: string | undefined },
>(
  fields: TFields,
  context: z.RefinementCtx,
): TFields & { TURNSTILE_SITE_KEY: string } {
  const siteKey = fields.TURNSTILE_SITE_KEY;

  if (fields.VERCEL_ENV !== 'production') {
    return { ...fields, TURNSTILE_SITE_KEY: siteKey ?? TURNSTILE_TEST_SITE_KEY };
  }

  if (siteKey === undefined || TURNSTILE_TEST_KEY_PATTERN.test(siteKey)) {
    context.addIssue({
      code: 'custom',
      path: ['TURNSTILE_SITE_KEY'],
      message: 'production needs the real site key from the Turnstile dashboard, not a test key',
    });

    return z.NEVER;
  }

  return { ...fields, TURNSTILE_SITE_KEY: siteKey };
}

/**
 * The only file allowed to read `process.env`. Parsed on first import, so a
 * missing or malformed variable fails loudly at the first request instead of
 * surfacing as a confusing `fetch` error deep inside an action.
 *
 * Nothing here is `NEXT_PUBLIC_`: every value is server-only, and importing this
 * file from a Client Component would be a bug.
 */
const environmentSchema = z.object({
  BACKEND_API_URL: z
    .url()
    .refine(isSafeBackendUrl, {
      message: 'BACKEND_API_URL must use https in production, unless it is on this machine.',
    })
    // Paths are appended as `/api/...`; a trailing slash would double it.
    .transform((value) => value.replace(/\/+$/, '')),
  /**
   * Cloudflare Turnstile's site key for `/register`. Public by design — it ends
   * up in the page — but read here and handed down as a prop rather than made
   * `NEXT_PUBLIC_`. Optional outside Vercel production; see
   * `withTurnstileSiteKey`.
   */
  TURNSTILE_SITE_KEY: z.string().min(1).optional(),
  /**
   * Set by Vercel itself, never by hand; absent locally. `NODE_ENV` cannot tell
   * a deployment apart: `next build` sets it to `production` everywhere, on
   * this machine and on previews too.
   */
  VERCEL_ENV: z.string().optional(),
}).transform(withTurnstileSiteKey);

export const env = environmentSchema.parse({
  BACKEND_API_URL: process.env.BACKEND_API_URL,
  TURNSTILE_SITE_KEY: process.env.TURNSTILE_SITE_KEY,
  VERCEL_ENV: process.env.VERCEL_ENV,
});
