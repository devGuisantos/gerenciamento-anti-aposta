'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { PASSWORD_MINIMUM_LENGTH } from '../_password-strength';
import { AuthTextField } from './auth-text-field';
import { ConsentField } from './consent-field';
import { PasswordField } from './password-field';
import { PendingFormNotice } from './pending-form-notice';

const MISMATCH_MESSAGE = 'As duas senhas não são iguais.';
const CONSENT_MESSAGE = 'Para criar a conta é preciso autorizar o uso do nome e do e-mail.';

/**
 * The registration form.
 *
 * Client-side for the same reason sign-in is — a form with no `action` GETs the
 * password into the URL — plus two checks the browser cannot express on its own:
 * that the two passwords match, and that consent was given. Both are real
 * validation that works today, which is the opposite of the pending notice: that
 * one appears only once the form is genuinely complete.
 *
 * TODO(identity): replace the handler with a Server Action calling
 * `container.registerUser`, and delete `PendingFormNotice` from this file. The
 * action re-parses every field with Zod and re-checks both of these — a Server
 * Action is a public POST endpoint, and nothing the browser verified counts.
 */
export function RegisterForm() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [hasConsented, setHasConsented] = useState(false);
  const [wasChecked, setWasChecked] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

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
      setHasSubmitted(false);
      return;
    }

    setHasSubmitted(true);
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <AuthTextField
        name="name"
        label="Nome"
        kind="name"
        autoComplete="name"
        hint="Como você quer ser chamado no app."
        enterKeyHint="next"
      />

      <AuthTextField
        name="email"
        label="E-mail"
        kind="email"
        autoComplete="email"
        placeholder="voce@exemplo.com"
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
        enterKeyHint="next"
      />

      <PasswordField
        name="passwordConfirmation"
        label="Repetir a senha"
        autoComplete="new-password"
        meter="NONE"
        value={confirmation}
        onValueChange={setConfirmation}
        error={confirmationError}
        enterKeyHint="done"
      />

      <ConsentField
        checked={hasConsented}
        onCheckedChange={setHasConsented}
        error={consentError}
      />

      <Button type="submit" size="lg" className="h-10 w-full">
        Criar conta
      </Button>

      {hasSubmitted ? (
        <PendingFormNotice>
          O cadastro ainda não está conectado — o módulo de contas do projeto não existe. Nenhuma
          conta foi criada e nenhum dado foi enviado. Para ver o app, use a demonstração abaixo.
        </PendingFormNotice>
      ) : null}
    </form>
  );
}
