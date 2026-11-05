'use client';

import * as React from 'react';
import { Bell } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from 'cn';
import type { MovementLine, PlatformNotification } from '@modules/notifications';
import { assertNever } from '@shared/domain/assert-never';
import { MoneyText } from '@shared/ui/money-text';

import { markNotificationsReadAction } from '../_notifications-actions';
import { DETECTION_LABELS, toBetBadgeLabel } from '../transactions/_detection';
import { describeNotification } from './notification-copy';
import { useNotificationFeed, type FeedStatus } from './notification-feed';

/** Past this the badge stops counting: it says there is something, not a score. */
const BADGE_MAXIMUM = 9;

/** Before anything was read, every id sorts after this one. */
const NOTHING_READ = '';

const DELIVERED_AT = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function describeUnread(count: number): string {
  if (count === 0) return 'Notificações';

  return `Notificações, ${count} não ${count === 1 ? 'lida' : 'lidas'}`;
}

/**
 * The list of what the platform told this person, beside the theme toggle.
 *
 * **Opening it is the reading.** There is no "mark as read" control: whatever
 * is unread while the panel is open gets its receipt at once, including what
 * arrives during that time. Marking on arrival instead would clear the badge
 * before anybody had looked, which is the one thing the badge is there to say.
 *
 * A receipt names the ids actually on screen, and one that fails leaves them
 * unread for the next opening: the badge never says read when the backend does
 * not. The marks beside the new ones stay until the panel closes, because
 * they would otherwise vanish the moment the reader's eye reached them.
 *
 * **A movement says what it was.** Amount, date and whether it was classified as
 * a bet, and how, the same way a statement row does: red only on a betting amount
 * and beside the badge naming it, and "Possível aposta" for a weak match. The
 * other case reads "não identificada", never "não é aposta", because the
 * classifier can miss one and this line must not claim otherwise.
 *
 * The badge is neutral on purpose. Red means a gambling amount, the brand hue
 * never lands on a figure, and nothing here pulses or moves to pull the eye back.
 */
export function NotificationBell() {
  const { notifications, status, settleRead, synchronise } = useNotificationFeed();
  const [isOpen, setIsOpen] = React.useState(false);
  const [newestReadId, setNewestReadId] = React.useState(NOTHING_READ);
  const requestedIds = React.useRef(new Set<string>());

  const unreadCount = notifications.filter(({ readAt }) => readAt === null).length;

  React.useEffect(() => {
    if (!isOpen) return;

    const unreadIds = notifications
      .filter(({ id, readAt }) => readAt === null && !requestedIds.current.has(id))
      .map(({ id }) => id);

    if (unreadIds.length === 0) return;

    async function acknowledge() {
      unreadIds.forEach((id) => requestedIds.current.add(id));
      const recorded = await markNotificationsReadAction(unreadIds).catch(() => false);

      if (recorded) {
        settleRead(unreadIds);
      }
      unreadIds.forEach((id) => requestedIds.current.delete(id));
    }

    void acknowledge();
  }, [isOpen, notifications, settleRead]);

  function changeOpen(open: boolean) {
    if (open) {
      setNewestReadId(notifications.find(({ readAt }) => readAt !== null)?.id ?? NOTHING_READ);
      // A correction made since the last read has to show here too.
      void synchronise();
    }
    setIsOpen(open);
  }

  return (
    <Popover open={isOpen} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
          aria-label={describeUnread(unreadCount)}
          title="Notificações"
        >
          <Bell className="size-4" />
          {unreadCount > 0 ? (
            <span
              aria-hidden
              className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] leading-none font-medium text-background"
            >
              {unreadCount > BADGE_MAXIMUM ? `${BADGE_MAXIMUM}+` : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[calc(100vw-2rem)] max-w-sm gap-0 p-0">
        <p className="border-b px-4 py-3 font-heading text-sm font-semibold">Notificações</p>
        <NotificationList
          notifications={notifications}
          status={status}
          newestReadId={newestReadId}
        />
      </PopoverContent>
    </Popover>
  );
}

type NotificationListProps = {
  readonly notifications: readonly PlatformNotification[];
  readonly status: FeedStatus;
  readonly newestReadId: string;
};

function NotificationList({ notifications, status, newestReadId }: NotificationListProps) {
  if (notifications.length === 0) {
    return <p className="px-4 py-6 text-sm text-muted-foreground">{describeEmpty(status)}</p>;
  }

  return (
    <>
      <ul className="max-h-[min(24rem,60vh)] divide-y overflow-y-auto">
        {notifications.map((notification) => (
          <NotificationRow
            key={notification.id}
            notification={notification}
            isNew={notification.id > newestReadId}
          />
        ))}
      </ul>
      <p className="border-t px-4 py-2 text-xs text-muted-foreground">
        Mostramos as 50 notificações mais recentes.
      </p>
    </>
  );
}

function describeEmpty(status: FeedStatus): string {
  switch (status) {
    case 'LOADING':
      return 'Carregando…';
    case 'UNAVAILABLE':
      return 'Não foi possível carregar as notificações agora.';
    case 'READY':
      return 'Nenhuma notificação por enquanto.';
    default:
      return assertNever(status);
  }
}

type NotificationRowProps = {
  readonly notification: PlatformNotification;
  readonly isNew: boolean;
};

function NotificationRow({ notification, isNew }: NotificationRowProps) {
  const { title, detail } = describeNotification(notification);

  return (
    <li className="flex gap-3 px-4 py-3">
      {/* The slot stays when the mark is absent, so every row lines up. */}
      <span className="mt-1.5 size-2 shrink-0">
        {isNew ? (
          <span className="block size-2 rounded-full bg-foreground">
            <span className="sr-only">Nova</span>
          </span>
        ) : null}
      </span>
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium break-words">{title}</p>
        <p className="text-xs break-words text-muted-foreground">{detail}</p>
        {notification.kind === 'TRANSACTIONS_INGESTED' ? (
          <MovementList
            movements={notification.movements}
            ingestedCount={notification.ingestedCount}
          />
        ) : null}
        <time dateTime={notification.createdAt} className="text-xs text-muted-foreground">
          {DELIVERED_AT.format(new Date(notification.createdAt))}
        </time>
      </div>
    </li>
  );
}

type MovementListProps = {
  readonly movements: readonly MovementLine[];
  readonly ingestedCount: number;
};

function MovementList({ movements, ingestedCount }: MovementListProps) {
  if (movements.length === 0) return null;

  const remaining = ingestedCount - movements.length;

  return (
    <div className="space-y-1 py-1">
      <ul className="divide-y rounded-lg bg-muted px-3">
        {movements.map((movement) => (
          <MovementRow key={movement.transactionId} movement={movement} />
        ))}
      </ul>
      {remaining > 0 ? (
        <p className="text-xs text-muted-foreground">
          {remaining === 1 ? 'E mais 1 no extrato.' : `E mais ${remaining} no extrato.`}
        </p>
      ) : null}
    </div>
  );
}

function MovementRow({ movement }: { readonly movement: MovementLine }) {
  const { bet } = movement;

  return (
    <li className="space-y-1 py-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-sm font-medium">{movement.counterparty}</span>
        <MoneyText
          cents={movement.amountInCents}
          signed={movement.amountInCents > 0}
          tabular
          className={cn('shrink-0 text-sm font-medium', bet !== null && 'text-destructive')}
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <time dateTime={movement.occurredAt}>
          {DELIVERED_AT.format(new Date(movement.occurredAt))}
        </time>
        {bet === null ? (
          <span>Não identificada como aposta</span>
        ) : (
          <>
            <Badge variant={bet.confidence === 'LOW' ? 'outline' : 'destructive'}>
              {toBetBadgeLabel(bet.confidence)}
            </Badge>
            <span>{DETECTION_LABELS[bet.matchedBy]}</span>
          </>
        )}
      </div>
    </li>
  );
}
