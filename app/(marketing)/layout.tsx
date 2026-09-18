import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Logo } from "@shared/ui/logo";
import { SupportContacts } from "@shared/ui/support-contacts";
import { ThemeToggle } from "@shared/ui/theme-toggle";

const NAV_LINKS = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#numeros", label: "O problema" },
  { href: "#limites", label: "Nossos limites" },
] as const;

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />

          <nav className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="h-9 md:h-8">
              <Link href="/dashboard">Entrar</Link>
            </Button>
            <Button asChild size="sm" className="h-9 md:h-8">
              <Link href="/register">Criar conta</Link>
            </Button>
          </div>
        </div>

        {/* Mobile: the anchors have no room in the bar, so they get their own scrollable row. */}
        <nav className="flex gap-4 overflow-x-auto border-t border-border/60 px-4 py-2 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 text-xs whitespace-nowrap text-muted-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm space-y-3">
            <Logo />
            <p className="text-sm text-muted-foreground">
              Plataforma acadêmica de controle financeiro pessoal para mitigar os prejuízos
              socioeconômicos das apostas online no Brasil.
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-medium">Precisa de ajuda agora? É gratuito e sigiloso:</p>
            <SupportContacts />
          </div>
        </div>

        <div className="border-t border-border/60">
          <p className="mx-auto w-full max-w-6xl px-4 py-4 text-xs sm:px-6 text-muted-foreground">
            Trabalho de Conclusão de Curso · Guilherme de Sousa Santos e João Marcelo Pedrini
            Ramalho de Campos. Ambiente de demonstração: os dados do Open Finance são simulados.
          </p>
        </div>
      </footer>
    </div>
  );
}
