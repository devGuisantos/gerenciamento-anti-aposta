'use client';

import { startTransition, useActionState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

import { INITIAL_AUTH_FORM_STATE } from '../_auth-form-state';
import { signInAction } from '../actions';
import { AuthTextField } from './auth-text-field';
import { FormFailureNotice } from './form-failure-notice';
import { PasswordField } from './password-field';

/**
 * The sign-in form.
 *
 * It submits from `onSubmit` with `preventDefault` rather than through
 * `<form action>`, for two reasons. The browser still runs native validation
 * first, so an empty field gets "preencha este campo" before anything is sent.
 * And React resets a form after an `action` completes, which here would wipe
 * the e-mail the person just typed every time the password was wrong.
 *
 * A wrong pair answers with **one** message — "E-mail ou senha incorretos" —
 * rendered for the whole form, never under a field. Rate limiting is the
 * backend's job, never this component's.
 */
export function SignInForm() {
  const [state, submitAction, isPending] = useActionState(
    signInAction,
    INITIAL_AUTH_FORM_STATE,
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => submitAction(formData));
      }}
    >
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
        autoComplete="current-password"
        meter="NONE"
        error={state.fieldErrors['password']}
        enterKeyHint="done"
        labelAction={
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Esqueci minha senha
          </Link>
        }
      />

      <Button type="submit" size="lg" className="h-10 w-full" disabled={isPending}>
        {isPending ? 'Entrando…' : 'Entrar'}
      </Button>

      <FormFailureNotice message={state.message} />
    </form>
  );
}
