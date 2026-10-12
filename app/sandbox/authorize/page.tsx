import { CircleAlert, ShieldCheck } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { readSessionToken, requireSession } from '@modules/identity';
import { describeAuthorisationRequest, type AuthorisationQuery } from '@modules/sandbox-bank';

import { formatLongDate, PERMISSION_COPY } from '../_bank-copy';
import { AuthorisationForm } from './_components/authorisation-form';

/** Never cached: it shows one person's accounts for one request. */
export const dynamic = 'force-dynamic';

/** The OAuth parameters the client sent; anything else in the URL is ignored. */
const OAUTH_PARAMETERS = [
  'response_type',
  'client_id',
  'redirect_uri',
  'scope',
  'state',
  'code_challenge',
  'code_challenge_method',
] as const;

function toQuery(searchParams: Record<string, string | string[] | undefined>): AuthorisationQuery {
  return Object.fromEntries(
    OAUTH_PARAMETERS.flatMap((name) => {
      const value = searchParams[name];

      return typeof value === 'string' ? [[name, value]] : [];
    }),
  );
}

/**
 * The bank's authorisation screen: where anti-aposta sends the person, and the
 * screen the paper screenshots. It shows who is asking, exactly what would be
 * shared and until when, and lets the person pick accounts and answer.
 *
 * A request the bank refuses — an unknown client, a redirect it never
 * registered, a consent no longer waiting — is answered **here**, on the bank's
 * own screen, and never redirected: a bad redirect is precisely where an
 * authorisation code must not go.
 */
export default async function AuthorizePage({ searchParams }: PageProps<'/sandbox/authorize'>) {
  await requireSession();
  const token = await readSessionToken();
  const query = toQuery(await searchParams);
  const result = token === null ? null : await describeAuthorisationRequest(token, query);

  if (result === null || !result.ok) {
    return <RefusedRequest message={result?.failure.message ?? null} />;
  }

  const { client, consent, accounts } = result.value;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          {client.displayName} quer acessar dados da sua conta
        </CardTitle>
        <CardDescription>
          Pelo Open Finance, você decide o que compartilhar e pode revogar a qualquer momento, no
          banco ou no {client.displayName}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section aria-labelledby="shared-heading" className="space-y-2 rounded-lg bg-muted p-4">
          <h2 id="shared-heading" className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck aria-hidden className="size-4" />
            O que será compartilhado
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {consent.permissions.map((permission) => (
              <li key={permission}>{PERMISSION_COPY[permission]}</li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            Válido até <strong className="text-foreground">{formatLongDate(consent.expiresAt)}</strong>
            . Apenas leitura: ninguém poderá fazer pagamentos ou movimentar seu dinheiro.
          </p>
        </section>

        <AuthorisationForm
          accounts={accounts}
          request={{
            clientId: query['client_id'] ?? '',
            redirectUri: query['redirect_uri'] ?? '',
            scope: query['scope'] ?? '',
            state: query['state'] ?? '',
            codeChallenge: query['code_challenge'] ?? '',
            codeChallengeMethod: query['code_challenge_method'] ?? '',
          }}
        />
      </CardContent>
    </Card>
  );
}

function RefusedRequest({ message }: { readonly message: string | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <CircleAlert aria-hidden className="size-5" />
          Não foi possível abrir esta autorização
        </CardTitle>
        <CardDescription>
          {message ?? 'O pedido de autorização não é válido.'} Volte ao anti-aposta e comece a
          conexão de novo. Nada foi compartilhado.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
