import Link from 'next/link';
import { ArrowUpRight, CreditCard, Landmark } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ConnectedAccount } from '@modules/open-finance';

/**
 * What the consent shares, named the way `/accounts` names it. Numbers arrive
 * masked from the backend; only the last four digits exist in the app.
 */
export function ConnectedAccountsCard({
  accounts,
}: {
  readonly accounts: readonly ConnectedAccount[] | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contas conectadas</CardTitle>
        <CardDescription>
          Compartilhamento via Open Finance, revogável a qualquer momento.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {accounts === null || accounts.length === 0 ? null : (
          <ul className="space-y-2">
            {accounts.map((account) => (
              <AccountLine key={account.id} account={account} />
            ))}
          </ul>
        )}
        <Button asChild variant="outline" size="sm" className="h-9 w-full">
          <Link href="/accounts">
            Gerenciar consentimento
            <ArrowUpRight />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function AccountLine({ account }: { readonly account: ConnectedAccount }) {
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
