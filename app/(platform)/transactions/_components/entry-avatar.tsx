import { CreditCard, Landmark } from 'lucide-react';

import type { AccountKind, ConnectedAccount } from '../_accounts';
import { CategoryIcon } from './category-icon';

/** `Record<AccountKind, …>` keeps this exhaustive: a new kind fails to compile. */
const ACCOUNT_ICONS: Readonly<Record<AccountKind, typeof Landmark>> = {
  CHECKING: Landmark,
  CREDIT_CARD: CreditCard,
};

type EntryAvatarProps = {
  readonly category: string;
  readonly account: ConnectedAccount;
};

/**
 * Category glyph with the account stamped on its corner, the way aggregator apps
 * mark which institution a row came from.
 *
 * The palette is monochrome by design, so accounts cannot be told apart by colour
 * the way a single-bank app would do it. The badge carries **shape** instead —
 * and because shape alone cannot scale past a handful of accounts, the row
 * subtitle still names the account in words and this marker stays `aria-hidden`.
 */
export function EntryAvatar({ category, account }: EntryAvatarProps) {
  const AccountIcon = ACCOUNT_ICONS[account.kind];

  return (
    <span aria-hidden className="relative shrink-0">
      <CategoryIcon category={category} />
      <span className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full bg-foreground text-background ring-2 ring-card">
        <AccountIcon className="size-2.5" />
      </span>
    </span>
  );
}
