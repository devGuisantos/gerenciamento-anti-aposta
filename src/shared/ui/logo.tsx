import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { cn } from 'cn';

type LogoProps = {
  readonly className?: string;
  readonly href?: string;
};

export function Logo({ className, href = '/' }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-2 font-heading text-base font-semibold tracking-tight',
        className,
      )}
    >
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <ShieldCheck className="size-4" />
      </span>
      anti-aposta
    </Link>
  );
}
