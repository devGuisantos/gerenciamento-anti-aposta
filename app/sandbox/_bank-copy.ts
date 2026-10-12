import type { BankAccountType, Permission } from '@modules/sandbox-bank';

/**
 * What each permission means, in the words a person reads before saying yes.
 * Plain and complete: a consent screen that summarises away what is shared is
 * the dark pattern this screen exists to avoid.
 */
export const PERMISSION_COPY: Readonly<Record<Permission, string>> = {
  ACCOUNTS_READ: 'Dados das contas escolhidas: tipo, agência e número',
  ACCOUNTS_TRANSACTIONS_READ: 'Extrato das contas escolhidas: valor, data e descrição de cada lançamento',
  RESOURCES_READ: 'A lista das contas que você escolheu compartilhar',
};

export const ACCOUNT_TYPE_COPY: Readonly<Record<BankAccountType, string>> = {
  CONTA_DEPOSITO_A_VISTA: 'Conta corrente',
  CARTAO_CREDITO: 'Cartão de crédito',
};

const DATE = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
});

export function formatLongDate(iso: string): string {
  return DATE.format(new Date(iso));
}
