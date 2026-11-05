'use client';

import { AuthTextField } from '@/app/(auth)/_components/auth-text-field';
import { FormFailureNotice } from '@/app/(auth)/_components/form-failure-notice';
import { PasswordField } from '@/app/(auth)/_components/password-field';
import { Button } from '@/components/ui/button';

import { changeEmailAction, changeNameAction } from '../_actions';
import { useSettingsForm } from './use-settings-form';

/** The name asks for no password: it opens nothing and locks nobody out. */
export function NameForm({ name }: { readonly name: string }) {
  const { form, isSaving, submit } = useSettingsForm(changeNameAction);

  return (
    <form onSubmit={submit} className="space-y-4">
      <AuthTextField
        name="name"
        label="Nome de exibição"
        kind="name"
        autoComplete="name"
        defaultValue={name}
        error={form.fieldErrors['name']}
      />
      <FormFailureNotice message={form.message} />
      <Button type="submit" variant="outline" className="h-10" disabled={isSaving}>
        {isSaving ? 'Salvando…' : 'Salvar nome'}
      </Button>
    </form>
  );
}

/**
 * The address is what somebody signs in with, so it asks for the password, and it
 * says plainly that nothing checks the new one: a typo here is a sign-in that
 * fails, and no confirmation e-mail exists to catch it.
 */
export function EmailForm({ email }: { readonly email: string }) {
  const { form, isSaving, submit } = useSettingsForm(changeEmailAction, (element) =>
    element.reset(),
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <AuthTextField
        name="email"
        label="E-mail"
        kind="email"
        autoComplete="email"
        defaultValue={email}
        hint="É com ele que você entra. Não enviamos confirmação, então confira se está certo."
        error={form.fieldErrors['email']}
      />
      <PasswordField
        name="currentPassword"
        label="Senha atual"
        autoComplete="current-password"
        meter="NONE"
        error={form.fieldErrors['currentPassword']}
      />
      <FormFailureNotice message={form.message} />
      <Button type="submit" variant="outline" className="h-10" disabled={isSaving}>
        {isSaving ? 'Salvando…' : 'Salvar e-mail'}
      </Button>
    </form>
  );
}
