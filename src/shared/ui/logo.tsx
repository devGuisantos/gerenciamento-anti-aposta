import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { cn } from 'cn';

type LogoProps = {
  readonly className?: string;
  readonly href?: string;
  /** When false, only the mark renders — used by the collapsed sidebar. */
  readonly showText?: boolean;
};

export function Logo({ className, href = '/', showText = true }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-2 font-heading text-base font-semibold tracking-tight',
        className,
      )}
    >
      <span
        data-slot="logo-mark"
        className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
      >
        <ShieldCheck className="size-4" />
      </span>
      {showText ? (
        <span data-slot="logo-text" className="whitespace-nowrap">
          anti-aposta
        </span>
      ) : null}
    </Link>
  );
}
