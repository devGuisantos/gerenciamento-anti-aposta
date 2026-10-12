import type { ConsentStatus } from '@modules/open-finance';
import type { EntryType } from '@modules/sandbox-bank';

/** The consent's status, in words. The backend decides it; this only names it. */
export const CONSENT_STATUS_COPY: Readonly<Record<ConsentStatus, string>> = {
  AWAITING_AUTHORISATION: 'Aguardando autorização no banco',
  AUTHORISED: 'Ativo',
  REJECTED: 'Não autorizado',
  REVOKED: 'Revogado',
  EXPIRED: 'Expirado',
};

/**
 * What the connect card says about the last attempt, when there was one. Each
 * line states a fact and stops — no nudge to try again, no warning tone.
 */
export const PREVIOUS_CONSENT_COPY: Readonly<Record<Exclude<ConsentStatus, 'AUTHORISED'>, string>> = {
  AWAITING_AUTHORISATION:
    'Você começou uma conexão e não concluiu a autorização no banco. Nada foi compartilhado.',
  REJECTED: 'Na última tentativa, a autorização não foi concedida no banco. Nada foi compartilhado.',
  REVOKED:
    'Você revogou o último consentimento. As transações e contas que tínhamos lido foram apagadas.',
  EXPIRED: 'O último consentimento expirou. Nenhum dado novo é lido até você conectar de novo.',
};

/**
 * The callback's outcome, by code. The page renders only these: anything else
 * in the query string falls back to the generic line, so a crafted link cannot
 * put words of its choosing on this screen.
 */
export const CONNECTION_FAILURE_COPY: Readonly<Record<string, string>> = {
  AUTHORISATION_STATE_MISMATCH:
    'Não foi possível confirmar que o retorno do banco era seu. Nada foi registrado — conecte de novo.',
  AUTHORISATION_EXPIRED: 'O tempo para autorizar no banco terminou. Conecte de novo.',
  AUTHORISATION_NOT_PENDING:
    'Não encontramos uma conexão em andamento. Se você já autorizou, confira o status abaixo; se não, conecte de novo.',
  AUTHORISATION_REFUSED: 'O banco não aceitou a autorização. Conecte de novo.',
  DATA_HOLDER_UNAVAILABLE:
    'Não conseguimos falar com o banco agora. Seus dados não foram alterados — tente em instantes.',
  CONSENT_ALREADY_AUTHORISED:
    'Você já tem um consentimento ativo. Revogue o atual antes de conectar de novo.',
};

export const GENERIC_CONNECTION_FAILURE =
  'Não foi possível concluir a conexão. Seus dados não foram alterados — tente de novo.';

export const ENTRY_TYPE_COPY: Readonly<Record<EntryType, string>> = {
  PIX: 'PIX',
  CARTAO: 'Cartão',
  TED: 'TED',
  BOLETO: 'Boleto',
  CONVENIO_ARRECADACAO: 'Débito automático',
  FOLHA_PAGAMENTO: 'Salário',
  TRANSFERENCIA_MESMA_INSTITUICAO: 'Transferência entre contas',
};

const DATE = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
});

const DATE_TIME = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

/** Resolved on the server, in São Paulo time, as every date in the app. */
export function formatDate(iso: string): string {
  return DATE.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso));
}
