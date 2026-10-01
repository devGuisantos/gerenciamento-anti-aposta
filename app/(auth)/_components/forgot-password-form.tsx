'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { AuthTextField } from './auth-text-field';
import { PendingFormNotice } from './pending-form-notice';

/**
 * The password-recovery request.
 *
 * This screen exists because `/login` linked to it and the route did not — a link
 * with no destination is a broken link, and on a sign-in screen it is a broken
 * link in front of somebody who cannot get in.
 *
 * It is the place where faking success would do the most damage: "enviamos um
 * e-mail para você" when nothing was sent leaves a person waiting on a message
 * that will never arrive, checking their spam folder, locked out. So the notice
 * says plainly that nothing was sent.
 *
 * TODO(identity): wire to a `RequestPasswordReset` use case. When it lands, the
 * response must be **identical whether or not the address exists** — a different
 * message for an unknown e-mail turns this form into a way to enumerate the
 * platform's users, which for this product is a list of people who may be
 * gambling. The token is single-use, short-lived, and never logged.
 */
export function ForgotPasswordForm() {
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
        label="E-mail da conta"
        kind="email"
        autoComplete="email"
        placeholder="voce@exemplo.com"
        hint="Enviaremos um link de redefinição para este endereço."
        enterKeyHint="done"
      />

      <Button type="submit" size="lg" className="h-10 w-full">
        Enviar link de redefinição
      </Button>

      {hasSubmitted ? (
        <PendingFormNotice>
          A recuperação de senha ainda não está conectada — o módulo de contas do projeto não
          existe. <span className="text-foreground">Nenhum e-mail foi enviado</span>, então não
          espere por um. Nenhum dado foi enviado para o servidor.
        </PendingFormNotice>
      ) : null}
    </form>
  );
}
