import type { EntryType } from '@modules/sandbox-bank';

/** How the bank's movement types read to a person. */
export const ENTRY_TYPE_COPY: Readonly<Record<EntryType, string>> = {
  PIX: 'PIX',
  CARTAO: 'Cartão',
  TED: 'TED',
  BOLETO: 'Boleto',
  CONVENIO_ARRECADACAO: 'Débito automático',
  FOLHA_PAGAMENTO: 'Salário',
  TRANSFERENCIA_MESMA_INSTITUICAO: 'Transferência entre contas',
};

/**
 * The same shape the backend accepts for a user id. Checked in the browser so a
 * half-typed id does not ask the bank for anything, and again in every action.
 */
export const USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
