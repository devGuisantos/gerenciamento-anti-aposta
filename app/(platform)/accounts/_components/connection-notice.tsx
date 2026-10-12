import { CircleAlert, CircleCheck, Info } from 'lucide-react';

import { assertNever } from '@shared/domain/assert-never';

import { CONNECTION_FAILURE_COPY, GENERIC_CONNECTION_FAILURE } from '../_consent-copy';

export type ConnectionOutcome =
  | { readonly kind: 'CONNECTED'; readonly ingestedCount: number }
  | { readonly kind: 'REJECTED' }
  | { readonly kind: 'FAILED'; readonly code: string };

/**
 * What happened at the bank, said once after the person comes back. The text
 * comes from a fixed table keyed by the outcome code — never from the URL.
 */
export function ConnectionNotice({ outcome }: { readonly outcome: ConnectionOutcome | null }) {
  if (outcome === null) {
    return null;
  }

  switch (outcome.kind) {
    case 'CONNECTED':
      return (
        <Notice icon={CircleCheck} role="status">
          Banco conectado. {describeFirstRead(outcome.ingestedCount)}
        </Notice>
      );
    case 'REJECTED':
      return (
        <Notice icon={Info} role="status">
          Você não autorizou o compartilhamento no banco. Nada foi lido.
        </Notice>
      );
    case 'FAILED':
      return (
        <Notice icon={CircleAlert} role="alert">
          {CONNECTION_FAILURE_COPY[outcome.code] ?? GENERIC_CONNECTION_FAILURE}
        </Notice>
      );
    default:
      return assertNever(outcome);
  }
}

function describeFirstRead(count: number): string {
  if (count === 0) {
    return 'O banco ainda não tinha transações nas contas escolhidas.';
  }

  return count === 1 ? 'Lemos 1 transação.' : `Lemos ${count} transações.`;
}

function Notice({
  icon: Icon,
  role,
  children,
}: {
  readonly icon: typeof Info;
  readonly role: 'status' | 'alert';
  readonly children: React.ReactNode;
}) {
  return (
    <p role={role} className="flex items-start gap-2 rounded-lg border bg-card p-3 text-sm">
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
