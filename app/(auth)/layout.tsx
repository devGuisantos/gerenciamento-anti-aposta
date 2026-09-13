import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Logo } from "@shared/ui/logo";
import { ThemeToggle } from "@shared/ui/theme-toggle";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
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

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">{children}</div>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 py-6">
        <p className="text-xs text-muted-foreground">
          Ambiente acadêmico de demonstração. Não utilize credenciais bancárias reais.
        </p>
      </footer>
    </div>
  );
}
