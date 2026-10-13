'use client';

import { useState } from 'react';

import type { DemoMovement, EntryType } from '@modules/sandbox-bank';

import { USER_ID_PATTERN } from '../_admin-copy';
import { BankLedgerPanel } from './bank-ledger-panel';
import { NotificationConsole } from './notification-console';
import { RecipientField } from './recipient-field';

type AdminConsoleProps = {
  readonly ownUserId: string;
  /*
   * The bank's vocabulary arrives as props: `@modules/sandbox-bank` is a
   * server module, and a Client Component imports only types from a module.
   */
  readonly movements: readonly DemoMovement[];
  readonly entryTypes: readonly EntryType[];
  readonly gamblingMcc: number;
};

/**
 * One recipient for the whole console. It starts as the presenter themselves,
 * which is the common demo — book on your own account, watch your other tab —
 * and takes anybody's id pasted in.
 */
export function AdminConsole({ ownUserId, ...vocabulary }: AdminConsoleProps) {
  const [recipient, setRecipient] = useState(ownUserId);
  const trimmed = recipient.trim();
  const recipientId = USER_ID_PATTERN.test(trimmed) ? trimmed.toLowerCase() : null;

  return (
    <div className="space-y-6">
      <RecipientField
        value={recipient}
        onChange={setRecipient}
        ownUserId={ownUserId}
        isValid={recipientId !== null}
      />
      <BankLedgerPanel recipientId={recipientId} {...vocabulary} />
      <NotificationConsole recipientId={recipientId} />
    </div>
  );
}
