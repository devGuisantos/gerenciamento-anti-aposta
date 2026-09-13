import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TriangleAlert } from 'lucide-react';

import { isDemoConsoleEnabled } from '@modules/notifications';

import { NotificationConsole } from './_components/notification-console';

/** Read ENABLE_DEMO_CONSOLE per request, not once at build time. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Console de demonstração',
  // Reachable only by typing the URL — keep it out of search engines too.
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  // Off in production unless ENABLE_DEMO_CONSOLE=true, because anyone who finds
  // the URL can push a notification to every connected browser.
  if (!isDemoConsoleEnabled()) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Console de demonstração
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Dispara manualmente as notificações que os módulos de análise
          comportamental e gamificação emitirão automaticamente. Serve para
          demonstrar o fluxo enquanto o back-end não existe.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div className="space-y-1">
          <p className="font-medium">Ferramenta interna, sem autenticação</p>
          <p className="text-muted-foreground">
            Esta página não aparece na navegação e é acessível apenas pela URL.
            Publica para <strong>todas</strong> as abas conectadas, não para um
            usuário específico. Fica indisponível em produção, a menos que
            <code className="mx-1">ENABLE_DEMO_CONSOLE=true</code> seja definida.
          </p>
        </div>
      </div>

      <NotificationConsole />

      <p className="text-xs text-muted-foreground">
        Abra <code>/dashboard</code> em outra aba para ver a notificação chegar
        pelo stream de Server-Sent Events.
      </p>
    </div>
  );
}
