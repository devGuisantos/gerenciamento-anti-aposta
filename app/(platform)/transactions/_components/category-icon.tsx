import {
  ArrowLeftRight,
  Car,
  CircleDashed,
  CircleDollarSign,
  Dices,
  HeartPulse,
  House,
  Repeat,
  ShoppingBag,
  ShoppingCart,
  UtensilsCrossed,
} from 'lucide-react';

import type { TransactionCategory } from '@modules/open-finance';
import { cn } from 'cn';

/**
 * Bank apps lean on merchant logos to make a long list scannable. We have no
 * logo feed, so the category carries that job — and it stays legible in both
 * themes, which a fetched logo would not.
 *
 * `Record<TransactionCategory, …>` keeps it exhaustive: a category the backend
 * adds fails to compile here instead of rendering a blank circle.
 */
const CATEGORY_ICONS: Readonly<Record<TransactionCategory, typeof Dices>> = {
  BETS: Dices,
  GROCERIES: ShoppingCart,
  DINING: UtensilsCrossed,
  TRANSPORT: Car,
  HEALTH: HeartPulse,
  SUBSCRIPTIONS: Repeat,
  HOUSING: House,
  INCOME: CircleDollarSign,
  TRANSFER: ArrowLeftRight,
  SHOPPING: ShoppingBag,
  OTHER: CircleDashed,
};

type CategoryIconProps = {
  readonly category: TransactionCategory;
  readonly className?: string;
};

export function CategoryIcon({ category, className }: CategoryIconProps) {
  const Icon = CATEGORY_ICONS[category];

  return (
    <span
      aria-hidden
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground',
        className,
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}
