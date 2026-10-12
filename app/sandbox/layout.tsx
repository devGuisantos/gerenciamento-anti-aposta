import type { Metadata } from 'next';
import { Landmark } from 'lucide-react';

import { ThemeToggle } from '@shared/ui/theme-toggle';

export const metadata: Metadata = {
  title: 'Banco Andorinha — ambiente simulado',
  robots: { index: false, follow: false },
};

/**
 * The simulated bank's screens. Deliberately **not** inside the platform's
 * chrome: in the real flow the person leaves anti-aposta and lands on their
 * bank, and the screenshot for the paper has to show that hand-over. So no
 * sidebar, no anti-aposta logo — the bank's own name in the header.
 *
 * Built from the same tokens as everything else (the palette rules hold here
 * too), and it says on every screen that the bank is fictional: nobody should
 * mistake this for a page that wants their real banking credentials.
 */
export default function SandboxBankLayout({ children }: LayoutProps<'/sandbox'>) {
  return (
    <div className="flex min-h-full flex-col bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center gap-2 px-4 sm:px-6">
          <span
            aria-hidden
            className="flex size-8 items-center justify-center rounded-md bg-foreground text-background"
          >
            <Landmark className="size-4" />
          </span>
          <span className="font-heading font-semibold tracking-tight">Banco Andorinha</span>
          <span className="ml-2 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
            Banco simulado
          </span>
          <span className="ml-auto">
            <ThemeToggle />
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">{children}</main>

      <footer className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        <p className="text-xs text-muted-foreground">
          Instituição fictícia, parte do ambiente acadêmico de demonstração do anti-aposta. Nenhuma
          conta, saldo ou movimentação aqui é real, e nenhuma credencial bancária é pedida.
        </p>
      </footer>
    </div>
  );
}
