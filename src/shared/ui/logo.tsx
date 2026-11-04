import Image from 'next/image';
import Link from 'next/link';
import { cn } from 'cn';

const LOGO_NAME = 'PausaBet';
const LOGO_MARK_SIZE = 28;

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
      <Image
        data-slot="logo-mark"
        src="/pausabet-icone.svg"
        alt={showText ? '' : LOGO_NAME}
        width={LOGO_MARK_SIZE}
        height={LOGO_MARK_SIZE}
        className="size-7 shrink-0"
      />
      {showText ? (
        <span data-slot="logo-text" className="whitespace-nowrap">
          {LOGO_NAME}
        </span>
      ) : null}
    </Link>
  );
}
