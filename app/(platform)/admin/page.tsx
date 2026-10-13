import type { Metadata } from 'next';
import { FlaskConical } from 'lucide-react';

import { requireSession } from '@modules/identity';
import { DEMO_MOVEMENTS, ENTRY_TYPES, GAMBLING_MCC } from '@modules/sandbox-bank';

import { AdminConsole } from './_components/admin-console';

export const metadata: Metadata = {
  title: 'Console de demonstração',
  // Reachable only by typing the URL — keep it out of search engines too.
  robots: { index: false, follow: false },
};

/** Per request: it starts from the signed-in person's own id. */
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await requireSession();

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Console de demonstração
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Registra lançamentos no banco simulado e envia as notificações que os módulos de análise
          comportamental e gamificação emitirão sozinhos — para uma pessoa específica, pelo
          identificador dela, em tempo real.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-lg border bg-card p-4 text-sm">
        <FlaskConical aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="space-y-1">
          <p className="font-medium">Ferramenta de demonstração</p>
          <p className="text-muted-foreground">
            Não aparece na navegação. Exige uma sessão, e o back-end só a aceita quando os
            lançamentos simulados estão ligados — nunca em produção. Tudo vai para o destinatário
            escolhido, e só para ele.
          </p>
        </div>
      </div>

      <AdminConsole
        ownUserId={user.id}
        movements={DEMO_MOVEMENTS}
        entryTypes={ENTRY_TYPES}
        gamblingMcc={GAMBLING_MCC}
      />

      <p className="text-xs text-muted-foreground">
        Abra <code>/accounts</code> ou <code>/transactions</code> em outra aba, com a sessão do
        destinatário, para ver o lançamento e as notificações chegarem pelo stream de Server-Sent
        Events.
      </p>
    </div>
  );
}
