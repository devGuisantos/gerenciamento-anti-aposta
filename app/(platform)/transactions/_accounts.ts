/**
 * How a connected account is named on the statement. The accounts themselves
 * are `open-finance`'s, with numbers masked on ingest by the backend — only the
 * last four digits ever reach the app.
 */
import type { ConnectedAccount } from '@modules/open-finance';

type AccountNaming = Pick<ConnectedAccount, 'institution' | 'shortName' | 'product' | 'maskedNumber'>;

/** For a transaction row, where the merchant name already owns the line. */
export function toAccountShortLabel(account: AccountNaming): string {
  return `${account.shortName} ${account.maskedNumber}`;
}

/** For the filter and the detail dialog, where there is room to be unambiguous. */
export function toAccountFullLabel(account: AccountNaming): string {
  return `${account.institution} · ${account.product} ${account.maskedNumber}`;
}
