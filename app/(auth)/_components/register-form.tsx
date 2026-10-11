'use client';

import { startTransition, useActionState, useState } from 'react';

import { Button } from '@/components/ui/button';

import { INITIAL_AUTH_FORM_STATE } from '../_auth-form-state';
import { PASSWORD_MINIMUM_LENGTH } from '../_password-strength';
import { registerAction } from '../actions';
import { AuthTextField } from './auth-text-field';
import { ConsentField } from './consent-field';
import { FormFailureNotice } from './form-failure-notice';
import { PasswordField } from './password-field';

const MISMATCH_MESSAGE = 'As duas senhas não são iguais.';
const CONSENT_MESSAGE = 'Para criar a conta é preciso autorizar o uso do nome e do e-mail.';

/**
 * The registration form.
 *
 * Submitted from `onSubmit` for the same reasons as sign-in — native validation
 * runs first, and React's post-action reset would wipe what the person typed on
 * a failure — plus two checks the browser cannot express on its own: that the
 * two passwords match, and that consent was given. The backend re-checks both;
 * these exist so the person hears about a typo without a round trip.
 *
 * When the browser's answer and the server's disagree about a field, the
 * browser's wins: it reflects what is on screen now, while the server's is
 * about the last submit.
 */
export function RegisterForm() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [hasConsented, setHasConsented] = useState(false);
  const [wasChecked, setWasChecked] = useState(false);
  const [state, submitAction, isPending] = useActionState(
    registerAction,
    INITIAL_AUTH_FORM_STATE,
  );

  /* While the confirmation is still a prefix of the password the person is simply
     mid-word, so there is nothing to correct yet. Nagging from the second
     keystroke is how a mismatch warning ends up permanently on screen and
     therefore ignored. `wasChecked` covers the case the prefix rule misses: a
     confirmation that stops short of the full password. */
  const isDiverging = confirmation !== '' && !password.startsWith(confirmation);
  const confirmationError =
    isDiverging || (wasChecked && confirmation !== password) ? MISMATCH_MESSAGE : null;
  const consentError = wasChecked && !hasConsented ? CONSENT_MESSAGE : null;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWasChecked(true);

    if (password !== confirmation || !hasConsented) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    startTransition(() => submitAction(formData));
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <AuthTextField
        name="name"
        label="Nome"
        kind="name"
        autoComplete="name"
        hint="Como você quer ser chamado no app."
        error={state.fieldErrors['name']}
        enterKeyHint="next"
      />

      <AuthTextField
        name="email"
        label="E-mail"
        kind="email"
        autoComplete="email"
        placeholder="voce@exemplo.com"
        error={state.fieldErrors['email']}
        enterKeyHint="next"
      />

      <PasswordField
        name="password"
        label="Senha"
        autoComplete="new-password"
        meter="STRENGTH"
        value={password}
        onValueChange={setPassword}
        hint={`Pelo menos ${PASSWORD_MINIMUM_LENGTH} caracteres.`}
        error={state.fieldErrors['password']}
        enterKeyHint="next"
      />

      <PasswordField
        name="passwordConfirmation"
        label="Repetir a senha"
        autoComplete="new-password"
        meter="NONE"
        value={confirmation}
        onValueChange={setConfirmation}
        error={confirmationError ?? state.fieldErrors['passwordConfirmation']}
        enterKeyHint="done"
      />

      <ConsentField
        checked={hasConsented}
        onCheckedChange={setHasConsented}
        error={consentError ?? state.fieldErrors['acceptedRegistrationConsent'] ?? null}
      />

      <Button type="submit" size="lg" className="h-10 w-full" disabled={isPending}>
        {isPending ? 'Criando conta…' : 'Criar conta'}
      </Button>

      <FormFailureNotice message={state.message} />
    </form>
  );
}
