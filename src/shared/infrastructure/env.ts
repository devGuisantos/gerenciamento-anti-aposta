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

/**
 * The only file allowed to read `process.env`. Parsed on first import, so a
 * missing or malformed variable fails loudly at the first request instead of
 * surfacing as a confusing `fetch` error deep inside an action.
 *
 * Nothing here is `NEXT_PUBLIC_`: every value is server-only, and importing this
 * file from a Client Component would be a bug.
 */
const environmentSchema = z.object({
  BACKEND_API_URL: z.url().refine(isSafeBackendUrl, {
    message: 'BACKEND_API_URL must use https in production, unless it is on this machine.',
  }),
});

export const env = environmentSchema.parse({
  BACKEND_API_URL: process.env.BACKEND_API_URL,
});
