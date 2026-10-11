'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { registerUser, signIn, storeSession } from '@modules/identity';

import { toAuthFormState, type AuthFormState } from './_auth-form-state';

const AFTER_SIGN_IN_PATH = '/dashboard';

/** Shown when the form arrives without its fields — a crafted POST, not a person. */
const MALFORMED_FORM_STATE: AuthFormState = {
  message: 'Confira os campos destacados.',
  fieldErrors: {},
};

/**
 * Shape only. Every rule — the password length, the confirmation match, the
 * consent — is re-checked by the backend, which is the system of record; nothing
 * the browser verified counts, and repeating the rules here would only let the
 * two copies drift.
 */
const signInFieldsSchema = z.object({
  email: z.string(),
  password: z.string(),
});

const registrationFieldsSchema = z.object({
  name: z.string(),
  email: z.string(),
  password: z.string(),
  passwordConfirmation: z.string(),
});

/** A Radix checkbox posts `"on"` when ticked and nothing at all when not. */
const CHECKED_VALUE = 'on';

export async function signInAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const fields = signInFieldsSchema.safeParse(Object.fromEntries(formData));

  if (!fields.success) {
    return MALFORMED_FORM_STATE;
  }

  const result = await signIn(fields.data);

  if (!result.ok) {
    return toAuthFormState(result.failure);
  }

  await storeSession(result.value);
  redirect(AFTER_SIGN_IN_PATH);
}

export async function registerAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const fields = registrationFieldsSchema.safeParse(Object.fromEntries(formData));

  if (!fields.success) {
    return MALFORMED_FORM_STATE;
  }

  const result = await registerUser({
    ...fields.data,
    acceptedRegistrationConsent: formData.get('consent') === CHECKED_VALUE,
  });

  if (!result.ok) {
    return toAuthFormState(result.failure);
  }

  await storeSession(result.value);
  redirect(AFTER_SIGN_IN_PATH);
}
