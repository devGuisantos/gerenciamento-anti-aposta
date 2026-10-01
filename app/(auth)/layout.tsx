import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Logo } from "@shared/ui/logo";
import { ThemeToggle } from "@shared/ui/theme-toggle";

import { AuthAside } from "./_components/auth-aside";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Voltar ao início
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center px-4 py-10 sm:px-6">
        {/*
          Two columns on desktop: the context on the left at roughly two thirds,
          the card on the right at a fixed 22rem. The card column is fixed rather
          than fractional because a form has a width below which it stops being
          comfortable, and a percentage would happily go under it on a 1280px
          laptop.

          The card is **first in the DOM** and placed into the second column, so a
          keyboard or screen-reader user reaches the form before the prose. That
          only stays safe while `AuthAside` holds nothing focusable — a link in
          there would send the tab order jumping backwards across the screen. Its
          own doc comment carries the rule.

          On mobile it collapses to one column with the card on top, which is the
          right order there too: the person came to fill in a form, not to read.
        */}
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[1fr_22rem] lg:items-center lg:gap-12">
          <div className="mx-auto w-full max-w-sm lg:col-start-2 lg:row-start-1 lg:max-w-none">
            {children}
          </div>

          <AuthAside className="lg:col-start-1 lg:row-start-1" />
        </div>
      </main>

      {/*
        The support line is here for the same reason the marketing footer carries
        it: somebody who arrives in crisis must find help without getting through a
        sign-in — and these screens are the ones where a person is stuck at a door.
        One line, no framing, no appeal.
      */}
      <footer className="mx-auto w-full max-w-7xl space-y-1 px-4 py-6 sm:px-6">
        <p className="text-xs text-muted-foreground">
          Ambiente acadêmico de demonstração. Não utilize credenciais bancárias reais.
        </p>
        <p className="text-xs text-muted-foreground">
          Precisa de ajuda com apostas?{" "}
          <a
            href="tel:188"
            className="font-medium text-foreground underline underline-offset-4"
          >
            CVV — 188
          </a>
          {", gratuito e sigiloso, 24 horas por dia."}
        </p>
      </footer>
    </div>
  );
}
