import Link from 'next/link';
import { CloudOff, Landmark, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { assertNever } from '@shared/domain/assert-never';

/**
 * Why there are no figures, in words. Each of these would otherwise render as
 * an empty list and a R$ 0,00 hero — which reads as "you spent nothing on
 * bets", a claim nothing here can support.
 */
export type StatementUnavailableReason =
  | { readonly kind: 'NO_CONSENT' }
  | { readonly kind: 'SYNCING' }
  | { readonly kind: 'FAILED'; readonly message: string };

export function StatementUnavailable({ reason }: { readonly reason: StatementUnavailableReason }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <Body reason={reason} />
      </CardContent>
    </Card>
  );
}

function Body({ reason }: { readonly reason: StatementUnavailableReason }) {
  switch (reason.kind) {
    case 'NO_CONSENT':
      return (
        <>
          <Landmark aria-hidden className="size-6 text-muted-foreground" />
          <Copy
            title="Nenhuma conta conectada"
            detail="Para ver o extrato aqui, autorize o compartilhamento de uma conta pelo Open Finance. Você escolhe o que é lido e pode revogar quando quiser."
          />
          <Button asChild size="sm" className="h-9">
            <Link href="/accounts">Conectar uma conta</Link>
          </Button>
        </>
      );
    case 'SYNCING':
      return (
        <>
          <RefreshCw aria-hidden className="size-6 text-muted-foreground" />
          <Copy
            title="Lendo suas transações"
            detail="A conta foi conectada e a primeira leitura do banco ainda não terminou. Os números aparecem aqui assim que ela acabar."
          />
        </>
      );
    case 'FAILED':
      return (
        <>
          <CloudOff aria-hidden className="size-6 text-muted-foreground" />
          <Copy title="Não conseguimos carregar agora" detail={reason.message} />
        </>
      );
    default:
      return assertNever(reason);
  }
}

function Copy({ title, detail }: { readonly title: string; readonly detail: string }) {
  return (
    <div className="max-w-md space-y-1">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}
