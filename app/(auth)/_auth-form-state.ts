import type { BackendFailure } from '@shared/infrastructure/backend-api';

/**
 * What an auth action hands back to its form. Field errors are keyed by the
 * backend's field names (`email`, `passwordConfirmation`,
 * `acceptedRegistrationConsent`, …), which is where each message is rendered.
 */
export type AuthFormState = {
  readonly message: string | null;
  readonly fieldErrors: Readonly<Record<string, string>>;
};

export const INITIAL_AUTH_FORM_STATE: AuthFormState = { message: null, fieldErrors: {} };

/**
 * Two shapes arrive in `details`: `{ field: 'email' }`, meaning the message
 * itself belongs under that field, or `{ email: '…', password: '…' }`, one
 * message per field. A failure with neither — `INVALID_CREDENTIALS` above all —
 * stays a form-level message on purpose: anchoring it to a field would reveal
 * which half of the pair was wrong.
 */
export function toAuthFormState(failure: BackendFailure): AuthFormState {
  const anchoredField = failure.details['field'];

  if (typeof anchoredField === 'string') {
    return { message: null, fieldErrors: { [anchoredField]: failure.message } };
  }

  const fieldErrors = Object.fromEntries(
    Object.entries(failure.details).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );

  return { message: failure.message, fieldErrors };
}
