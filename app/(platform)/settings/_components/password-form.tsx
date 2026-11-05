'use client';

import { useState } from 'react';

import { FormFailureNotice } from '@/app/(auth)/_components/form-failure-notice';
import { PasswordField } from '@/app/(auth)/_components/password-field';
import { Button } from '@/components/ui/button';

import { changePasswordAction } from '../_actions';
import { useSettingsForm } from './use-settings-form';

/** The meter advises and never blocks, as on the register screen. */
export function PasswordForm() {
  const [password, setPassword] = useState('');
  const { form, isSaving, submit } = useSettingsForm(changePasswordAction, (element) => {
    element.reset();
    setPassword('');
  });

  return (
    <form onSubmit={submit} className="space-y-4">
      <PasswordField
        name="currentPassword"
        label="Senha atual"
        autoComplete="current-password"
        meter="NONE"
        error={form.fieldErrors['currentPassword']}
      />
      <PasswordField
        name="password"
        label="Nova senha"
        autoComplete="new-password"
        meter="STRENGTH"
        value={password}
        onValueChange={setPassword}
        hint="Use pelo menos 8 caracteres."
        error={form.fieldErrors['password']}
      />
      <PasswordField
        name="passwordConfirmation"
        label="Repita a nova senha"
        autoComplete="new-password"
        meter="NONE"
        error={form.fieldErrors['passwordConfirmation']}
      />
      <FormFailureNotice message={form.message} />
      <Button type="submit" variant="outline" className="h-10" disabled={isSaving}>
        {isSaving ? 'Salvando…' : 'Alterar senha'}
      </Button>
    </form>
  );
}
