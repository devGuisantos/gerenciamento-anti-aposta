import { cookies } from 'next/headers';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * The bank's callback carries a `code` and a `state` and nothing else — not
 * which consent it is about. The id travels across the round trip here, as an
 * OAuth client keeps its pending request: first-party, `httpOnly`, and gone
 * after ten minutes, which is as long as the backend keeps the request open.
 *
 * It is not a security boundary. The backend checks the `state` against the
 * consent and refuses a mismatch; this only saves putting the id in a URL.
 */
const PENDING_CONSENT_COOKIE = IS_PRODUCTION
  ? '__Host-anti_aposta_pending_consent'
  : 'anti_aposta_pending_consent';
const PENDING_CONSENT_MAX_AGE_IN_SECONDS = 10 * 60;

function cookieOptions() {
  return { httpOnly: true, secure: IS_PRODUCTION, sameSite: 'lax', path: '/' } as const;
}

/** Only from a Server Action or Route Handler, like any cookie write. */
export async function rememberPendingConsent(consentId: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(PENDING_CONSENT_COOKIE, consentId, {
    ...cookieOptions(),
    maxAge: PENDING_CONSENT_MAX_AGE_IN_SECONDS,
  });
}

/** Reads the pending id and forgets it: a callback is answered once. */
export async function takePendingConsent(): Promise<string | null> {
  const cookieStore = await cookies();
  const consentId = cookieStore.get(PENDING_CONSENT_COOKIE)?.value ?? null;

  cookieStore.set(PENDING_CONSENT_COOKIE, '', { ...cookieOptions(), maxAge: 0 });

  return consentId;
}
