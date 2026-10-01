'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

import { AuthTextField } from './auth-text-field';
import { PasswordField } from './password-field';
import { PendingFormNotice } from './pending-form-notice';

/**
 * The sign-in form.
 *
 * It is a Client Component for one reason that matters more than the password
 * toggle: **it has to stop the submit**. A `<form>` with no `action` falls back to
 * a GET against the current URL, which puts the password in the address bar, in
 * browser history, and in every access log between here and the server. That was
 * the behaviour before this file existed, and it is the kind of bug that survives
 * review because the screen looks right.
 *
 * `preventDefault` in `onSubmit` rather than `type="button"` on the submit, so the
 * browser still runs native validation first: the person gets "preencha este
 * campo" on an empty field exactly as they will once the action is wired, and the
 * pending notice only appears for a form that was actually complete.
 *
 * TODO(identity): replace the handler with a Server Action calling
 * `container.signIn`, and delete `PendingFormNotice` from this file. The action
 * returns **one** message for a bad pair — "E-mail ou senha incorretos" — because
 * naming which half was wrong tells an attacker the address exists. Rate limiting
 * goes in `proxy.ts` or the use case, never here.
 */
export function SignInForm() {
  const [hasSubmitted, setHasSubmitted] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setHasSubmitted(true);
      }}
    >
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
        autoComplete="current-password"
        meter="NONE"
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

      <Button type="submit" size="lg" className="h-10 w-full">
        Entrar
      </Button>

      {hasSubmitted ? (
        <PendingFormNotice>
          O login ainda não está conectado — o módulo de contas do projeto não existe. Nenhum dado
          foi enviado. Para ver o app, use a demonstração abaixo.
        </PendingFormNotice>
      ) : null}
    </form>
  );
}
