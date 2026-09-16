import {
  ArrowLeftRight,
  Car,
  CircleDollarSign,
  Dices,
  HeartPulse,
  House,
  Repeat,
  ShoppingBag,
  ShoppingCart,
  UtensilsCrossed,
} from 'lucide-react';

import { cn } from 'cn';

/**
 * Bank apps lean on merchant logos to make a long list scannable. We have no
 * logo feed, so the category carries that job — and it stays legible in both
 * themes, which a fetched logo would not.
 */
const CATEGORY_ICONS: Readonly<Record<string, typeof Dices>> = {
  Apostas: Dices,
  Mercado: ShoppingCart,
  Alimentação: UtensilsCrossed,
  Transporte: Car,
  Saúde: HeartPulse,
  Assinaturas: Repeat,
  Moradia: House,
  Renda: CircleDollarSign,
  Transferências: ArrowLeftRight,
  Compras: ShoppingBag,
};

type CategoryIconProps = {
  readonly category: string;
  readonly className?: string;
};

export function CategoryIcon({ category, className }: CategoryIconProps) {
  const Icon = CATEGORY_ICONS[category] ?? CircleDollarSign;

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
