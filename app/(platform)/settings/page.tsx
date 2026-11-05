import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { fetchAccount, readSessionToken, requireSession, type Account } from '@modules/identity';
import { SupportContacts } from '@shared/ui/support-contacts';

import { DeleteAccountDialog } from './_components/delete-account-dialog';
import { OtherSessionsButton } from './_components/other-sessions-button';
import { PasswordForm } from './_components/password-form';
import { EmailForm, NameForm } from './_components/profile-forms';

export const metadata: Metadata = { title: 'Configurações' };

/** One person's account: a static render would show somebody else's. */
export const dynamic = 'force-dynamic';

const LONG_DATE = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function toLongDate(instant: string): string {
  return LONG_DATE.format(new Date(instant));
}

async function readAccount(): Promise<Account> {
  const token = await readSessionToken();
  const result = token === null ? null : await fetchAccount(token);

  if (result === null || !result.ok) {
    throw new Error('The account could not be read');
  }

  return result.value;
}

export default async function SettingsPage() {
  await requireSession();

  const account = await readAccount();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Sua conta, sua segurança e seus dados.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Como você aparece no app e o e-mail com que entra.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Keyed by value: a saved change remounts the form on the backend's answer. */}
          <NameForm key={account.user.name} name={account.user.name} />
          <Separator />
          <EmailForm key={account.user.email} email={account.user.email} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
          <CardDescription>
            Ao mudar a senha, os outros aparelhos são desconectados. Este continua conectado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <PasswordForm />
          <Separator />
          <SessionsRow count={account.activeSessionCount} />
        </CardContent>
      </Card>

      <PrivacyCard account={account} />

      <Card>
        <CardHeader>
          <CardTitle>Apoio</CardTitle>
          <CardDescription>
            Se quiser conversar com alguém, estes serviços atendem de graça.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SupportContacts />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h2 className="font-heading text-base font-semibold">Excluir conta</h2>
            <p className="text-sm text-muted-foreground">
              Apaga sua conta e seus dados na hora, sem volta.
            </p>
          </div>
          <DeleteAccountDialog />
        </CardContent>
      </Card>
    </div>
  );
}

function SessionsRow({ count }: { readonly count: number }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {count === 1 ? 'Só este aparelho está conectado.' : `${count} aparelhos conectados.`}
      </p>
      {count > 1 ? <OtherSessionsButton /> : null}
    </div>
  );
}

/** Says what the platform holds and on what authority, in the terms the person agreed to. */
function PrivacyCard({ account }: { readonly account: Account }) {
  const { registrationConsent, user } = account;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacidade e dados</CardTitle>
        <CardDescription>
          O nome e o e-mail vêm do seu cadastro. Os dados financeiros só existem enquanto você
          compartilha uma conta, e revogar esse consentimento apaga o extrato daqui.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Conta criada em</dt>
            <dd>{toLongDate(user.registeredAt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Uso do nome e do e-mail autorizado em</dt>
            <dd>
              {toLongDate(registrationConsent.acceptedAt)} (versão{' '}
              {registrationConsent.policyVersion})
            </dd>
          </div>
        </dl>
        <Button asChild variant="outline" className="h-10">
          <Link href="/accounts">Ver contas conectadas</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
