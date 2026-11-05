'use server';

import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { toAuthFormState, type AuthFormState } from '@/app/(auth)/_auth-form-state';
import { ACCOUNT_DELETED, ACCOUNT_NOTICE_PARAMETER } from '@/app/_account-notice';
import {
  changeDisplayName,
  changeEmail,
  changePassword,
  clearSession,
  deleteAccount,
  endOtherSessions,
  readSessionToken,
  requireSession,
} from '@modules/identity';

/**
 * The account's write side. A Server Action is a public POST endpoint, so each one
 * asks who is calling first. These schemas check shape only: every rule, and
 * whether the password is right, is the backend's.
 */

const SESSION_LOST = 'Sua sessão terminou. Entre de novo para continuar.';
const MALFORMED_FORM = 'Confira os campos destacados.';

export type SettingsActionResult =
  | { readonly status: 'SAVED'; readonly message: string }
  | { readonly status: 'FAILED'; readonly form: AuthFormState };

const refusal = (message: string): SettingsActionResult => ({
  status: 'FAILED',
  form: { message, fieldErrors: {} },
});

async function callerToken(): Promise<string | null> {
  await requireSession();

  return readSessionToken();
}

const nameSchema = z.object({ name: z.string() });
const emailSchema = z.object({ email: z.string(), currentPassword: z.string() });
const passwordSchema = z.object({
  currentPassword: z.string(),
  password: z.string(),
  passwordConfirmation: z.string(),
});
const deletionSchema = z.object({ currentPassword: z.string() });

export async function changeNameAction(formData: FormData): Promise<SettingsActionResult> {
  const token = await callerToken();
  const fields = nameSchema.safeParse(Object.fromEntries(formData));

  if (token === null) return refusal(SESSION_LOST);
  if (!fields.success) return refusal(MALFORMED_FORM);

  const result = await changeDisplayName(token, fields.data.name);
  if (!result.ok) return { status: 'FAILED', form: toAuthFormState(result.failure) };

  refresh();

  return { status: 'SAVED', message: 'Nome atualizado.' };
}

export async function changeEmailAction(formData: FormData): Promise<SettingsActionResult> {
  const token = await callerToken();
  const fields = emailSchema.safeParse(Object.fromEntries(formData));

  if (token === null) return refusal(SESSION_LOST);
  if (!fields.success) return refusal(MALFORMED_FORM);

  const result = await changeEmail(token, fields.data);
  if (!result.ok) return { status: 'FAILED', form: toAuthFormState(result.failure) };

  refresh();

  return { status: 'SAVED', message: 'E-mail atualizado. Use o novo endereço para entrar.' };
}

export async function changePasswordAction(formData: FormData): Promise<SettingsActionResult> {
  const token = await callerToken();
  const fields = passwordSchema.safeParse(Object.fromEntries(formData));

  if (token === null) return refusal(SESSION_LOST);
  if (!fields.success) return refusal(MALFORMED_FORM);

  const result = await changePassword(token, fields.data);
  if (!result.ok) return { status: 'FAILED', form: toAuthFormState(result.failure) };

  refresh();

  return { status: 'SAVED', message: 'Senha alterada. Os outros aparelhos foram desconectados.' };
}

export async function endOtherSessionsAction(): Promise<SettingsActionResult> {
  const token = await callerToken();

  if (token === null) return refusal(SESSION_LOST);

  const result = await endOtherSessions(token);
  if (!result.ok) return refusal(result.failure.message);

  refresh();

  return { status: 'SAVED', message: 'Os outros aparelhos foram desconectados.' };
}

/**
 * The sessions went with the account, so the cookie goes too. A failure leaves the
 * account as it was, and the dialog stays open for another try.
 */
export async function deleteAccountAction(formData: FormData): Promise<SettingsActionResult> {
  const token = await callerToken();
  const fields = deletionSchema.safeParse(Object.fromEntries(formData));

  if (token === null) return refusal(SESSION_LOST);
  if (!fields.success) return refusal(MALFORMED_FORM);

  const result = await deleteAccount(token, fields.data.currentPassword);
  if (!result.ok) return { status: 'FAILED', form: toAuthFormState(result.failure) };

  await clearSession();
  redirect(`/login?${ACCOUNT_NOTICE_PARAMETER}=${ACCOUNT_DELETED}`);
}
