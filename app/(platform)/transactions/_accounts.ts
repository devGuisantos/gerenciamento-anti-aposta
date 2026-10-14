/**
 * The accounts shared through Open Finance. Two of them, matching
 * `connectedAccounts` on the dashboard snapshot — change one and change the other.
 *
 * Institutions are invented on purpose: nothing here may look like a real bank.
 *
 * Account numbers are masked **by us, on ingest** — not by the DataHolder. The
 * spec's `GET /accounts` returns `number` and `checkDigit` in full, so data
 * minimisation is our job: only the last four digits ever reach the app.
 *
 * The statement no longer reads this: it uses `ConnectedAccount` from
 * `@modules/open-finance`. It stays for the fixture ledger the dashboard, Apostas
 * and Conquistas still read, and retires with it. The label functions below are
 * structural, so they serve both.
 */

export const ACCOUNT_IDS = ['andorinha-checking', 'vela-credit'] as const;

export type AccountId = (typeof ACCOUNT_IDS)[number];

/** Drives the icon on each row; a debit card draws on the checking account. */
export type AccountKind = 'CHECKING' | 'CREDIT_CARD';

export type ConnectedAccount = {
  readonly id: AccountId;
  readonly institution: string;
  /** Enough to tell two accounts apart in a row that also carries a merchant name. */
  readonly shortName: string;
  readonly product: string;
  readonly maskedNumber: string;
  readonly kind: AccountKind;
};

export const CONNECTED_ACCOUNTS: Readonly<Record<AccountId, ConnectedAccount>> = {
  'andorinha-checking': {
    id: 'andorinha-checking',
    institution: 'Banco Andorinha',
    shortName: 'Andorinha',
    product: 'Conta corrente',
    maskedNumber: '•• 4471',
    kind: 'CHECKING',
  },
  'vela-credit': {
    id: 'vela-credit',
    institution: 'Vela Crédito',
    shortName: 'Vela',
    product: 'Cartão de crédito',
    maskedNumber: '•• 8032',
    kind: 'CREDIT_CARD',
  },
};

/** The fields a label needs — structural, so the backend's `ConnectedAccount` fits too. */
type AccountNaming = Pick<ConnectedAccount, 'institution' | 'shortName' | 'product' | 'maskedNumber'>;

/** For a transaction row, where the merchant name already owns the line. */
export function toAccountShortLabel(account: AccountNaming): string {
  return `${account.shortName} ${account.maskedNumber}`;
}

/** For the filter and the detail dialog, where there is room to be unambiguous. */
export function toAccountFullLabel(account: AccountNaming): string {
  return `${account.institution} · ${account.product} ${account.maskedNumber}`;
}
