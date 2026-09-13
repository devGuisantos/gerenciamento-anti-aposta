import { cn } from 'cn';

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/**
 * Money is carried as integer cents everywhere in the codebase; this is the only
 * place that turns it into something a person reads.
 */
export function formatBRL(cents: number): string {
  return BRL.format(cents / 100);
}

export function formatSignedBRL(cents: number): string {
  const sign = cents > 0 ? '+' : '';
  return `${sign}${formatBRL(cents)}`;
}

type MoneyTextProps = {
  readonly cents: number;
  readonly signed?: boolean;
  /** Aligns digits vertically. Use in columns of numbers, never on a large standalone figure. */
  readonly tabular?: boolean;
  readonly className?: string;
};

export function MoneyText({
  cents,
  signed = false,
  tabular = false,
  className,
}: MoneyTextProps) {
  return (
    <span className={cn(tabular && 'tabular-nums', className)}>
      {signed ? formatSignedBRL(cents) : formatBRL(cents)}
    </span>
  );
}
