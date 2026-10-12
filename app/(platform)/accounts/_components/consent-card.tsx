import { CreditCard, Landmark } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ConnectedAccount, Consent } from '@modules/open-finance';

import { CONSENT_STATUS_COPY, formatDate, formatDateTime } from '../_consent-copy';
import { RevokeConsentDialog } from './revoke-consent-dialog';
import { SynchroniseButton } from './synchronise-button';

type ConsentCardProps = {
  readonly consent: Consent;
  readonly accounts: readonly ConnectedAccount[];
};

/**
 * The authorised consent: what is shared, since and until when, and the two
 * things a person can do about it. The status badge is neutral on purpose —
 * a status is not a figure, so it never wears the brand hue or red.
 */
export function ConsentCard({ consent, accounts }: ConsentCardProps) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>Banco Andorinha</CardTitle>
          <Badge variant="outline">{CONSENT_STATUS_COPY[consent.status]}</Badge>
        </div>
        <CardDescription>
          Autorizado em {formatDate(consent.createdAt)} · válido até {formatDate(consent.expiresAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="space-y-0.5">
            <dt className="text-muted-foreground">Última sincronização</dt>
            <dd className="font-medium">
              {consent.lastSyncedAt === null
                ? 'Primeira leitura em andamento'
                : formatDateTime(consent.lastSyncedAt)}
            </dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-muted-foreground">Contas compartilhadas</dt>
            <dd className="font-medium">{accounts.length}</dd>
          </div>
        </dl>

        <ul className="space-y-2">
          {accounts.map((account) => (
            <AccountRow key={account.id} account={account} />
          ))}
        </ul>

        <div className="flex flex-col gap-2 sm:flex-row">
          <SynchroniseButton consentId={consent.id} />
          <RevokeConsentDialog consentId={consent.id} />
        </div>
        <p className="text-xs text-muted-foreground">
          O anti-aposta lê o extrato quando você sincroniza. Ele não vê pagamentos no momento em que
          acontecem e não pode impedir nenhum deles.
        </p>
      </CardContent>
    </Card>
  );
}

function AccountRow({ account }: { readonly account: ConnectedAccount }) {
  const Icon = account.kind === 'CREDIT_CARD' ? CreditCard : Landmark;

  return (
    <li className="flex items-center gap-3 rounded-lg bg-muted p-3">
      <Icon aria-hidden className="size-4 text-muted-foreground" />
      <span className="grid leading-tight">
        <span className="text-sm font-medium">{account.product}</span>
        <span className="text-xs text-muted-foreground">
          {account.institution} · {account.maskedNumber}
        </span>
      </span>
    </li>
  );
}
