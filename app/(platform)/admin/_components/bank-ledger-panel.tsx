'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DemoMovement, EntryType } from '@modules/sandbox-bank';

import { listRecipientAccountsAction, type RecipientAccountsState } from '../_actions';
import { BankLedgerForm } from './bank-ledger-form';

/** The bank's answer, and which recipient it was for. */
type Answer = {
  readonly recipientId: string;
  readonly result: RecipientAccountsState;
};

type BankLedgerPanelProps = {
  /** A whole user id, or `null` while none is chosen. */
  readonly recipientId: string | null;
  readonly movements: readonly DemoMovement[];
  readonly entryTypes: readonly EntryType[];
  readonly gamblingMcc: number;
};

/**
 * The simulated bank's side of the demonstration, for the chosen person. It
 * reads their accounts at the bank each time the recipient changes; the bank
 * opens accounts only when somebody first reaches it, so a person who never
 * connected has none to book on yet — and the panel says so instead of
 * inventing any.
 *
 * "Loading" is not stored: it is an answer that belongs to another recipient,
 * which is also what keeps a slow, stale answer from showing for a new one.
 */
export function BankLedgerPanel({ recipientId, ...vocabulary }: BankLedgerPanelProps) {
  const [answer, setAnswer] = useState<Answer | null>(null);

  useEffect(() => {
    if (recipientId === null) {
      return;
    }

    let isCurrent = true;

    async function load(id: string) {
      const result = await listRecipientAccountsAction(id);

      if (isCurrent) {
        setAnswer({ recipientId: id, result });
      }
    }

    void load(recipientId);

    return () => {
      isCurrent = false;
    };
  }, [recipientId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Banco simulado: registrar um lançamento</CardTitle>
        <CardDescription>
          Ambiente de demonstração. Isto acontece do lado do Banco Andorinha, como se a pessoa tivesse
          usado a conta ou o cartão. O banco avisa o anti-aposta, que lê o extrato em seguida: com um
          consentimento ativo, o lançamento aparece na tela dela em instantes. Nenhum valor aqui é
          real.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PanelBody recipientId={recipientId} answer={answer} {...vocabulary} />
      </CardContent>
    </Card>
  );
}

function PanelBody({
  recipientId,
  answer,
  ...vocabulary
}: BankLedgerPanelProps & { readonly answer: Answer | null }) {
  if (recipientId === null) {
    return <Hint>Escolha o destinatário acima para ver as contas dele no banco.</Hint>;
  }

  if (answer?.recipientId !== recipientId) {
    return <Hint>Lendo as contas no banco…</Hint>;
  }

  if (!answer.result.ok) {
    return <Hint>{answer.result.message}</Hint>;
  }

  if (answer.result.accounts.length === 0) {
    return (
      <Hint>
        Essa pessoa ainda não tem contas no Banco Andorinha. As contas são abertas quando ela conecta
        o banco pela primeira vez, em Contas conectadas.
      </Hint>
    );
  }

  return (
    <BankLedgerForm
      key={recipientId}
      recipientId={recipientId}
      accounts={answer.result.accounts}
      {...vocabulary}
    />
  );
}

function Hint({ children }: { readonly children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}
