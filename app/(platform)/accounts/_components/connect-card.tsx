import { Check, X } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Consent } from '@modules/open-finance';

import { connectBankAction } from '../_actions';
import { PREVIOUS_CONSENT_COPY } from '../_consent-copy';
import { SubmitButton } from './submit-button';

/** Said before the person leaves for the bank, so nothing there is a surprise. */
const WHAT_IS_READ: readonly string[] = [
  'O extrato das contas que você escolher no banco',
  'O tipo e o final do número de cada conta',
];

const WHAT_IS_NOT: readonly string[] = [
  'Nenhum pagamento, transferência ou bloqueio: só leitura',
  'Nada além das contas que você escolher',
  'Nada depois que você revogar — e revogar apaga o que foi lido',
];

/**
 * The way in. The button posts a plain form, so it works before hydration; the
 * action registers the consent at the bank and sends the browser to the bank's
 * own authorisation screen.
 */
export function ConnectCard({ previous }: { readonly previous: Consent | null }) {
  const previousNote =
    previous === null || previous.status === 'AUTHORISED'
      ? null
      : PREVIOUS_CONSENT_COPY[previous.status];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conectar uma instituição</CardTitle>
        <CardDescription>
          Pelo Open Finance, você autoriza no próprio banco que o anti-aposta leia o seu extrato.
          Neste ambiente de demonstração, o banco é o Banco Andorinha, uma instituição simulada.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {previousNote === null ? null : (
          <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">{previousNote}</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <PointList title="O que vamos ler" items={WHAT_IS_READ} icon={Check} />
          <PointList title="O que não vamos fazer" items={WHAT_IS_NOT} icon={X} />
        </div>

        <form action={connectBankAction}>
          <SubmitButton pendingLabel="Abrindo o banco…">Conectar Banco Andorinha</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

function PointList({
  title,
  items,
  icon: Icon,
}: {
  readonly title: string;
  readonly items: readonly string[];
  readonly icon: typeof Check;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
