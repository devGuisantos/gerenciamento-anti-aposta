import { Plug, ScanSearch, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from 'cn';

/**
 * The context column beside the auth card.
 *
 * **It carries no focusable element, and that is load-bearing.** The card comes
 * first in the DOM so the form is the first thing a keyboard or screen-reader user
 * reaches, while the grid places this column to its left on desktop. A visual
 * order that differs from the DOM order is only safe while nothing here can be
 * tabbed to — put a link in this column and the tab order starts jumping
 * backwards across the screen. Anything interactive belongs in the card.
 *
 * What it deliberately does **not** carry:
 *
 * - **No national statistics**, even the sourced ones from the landing page.
 *   Leading with "56% dizem que o dinheiro faz falta" builds a case against the
 *   reader before they have been offered anything, which is the mistake
 *   `SupportCard` documents and avoids. The landing page is where the argument
 *   belongs; by the time somebody is at the door they have heard it.
 * - **No urgency and no social proof.** No counters, no "junte-se a X pessoas".
 * - **No claim the platform blocks anything** — the limits below say the opposite,
 *   in as many words, because that is what separates this product from the thing
 *   it opposes.
 *
 * The figures in the headline are the product's own arithmetic: R$ 500,00 at the
 * 11,4% a.a. that `FIXED_INCOME_ANNUAL_RATE` carries is R$ 557,00 in twelve
 * months. Change the rate and change this line with it.
 */

const HOW_IT_WORKS = [
  {
    icon: Plug,
    title: 'Você conecta a conta',
    description:
      'Pelo fluxo de consentimento do Open Finance. Nada é lido sem a sua autorização, e você revoga quando quiser.',
  },
  {
    icon: ScanSearch,
    title: 'A gente identifica as apostas',
    description:
      'Pelo código da categoria do estabelecimento (MCC 7995), pelo CNPJ da casa e pela descrição do lançamento.',
  },
  {
    icon: TrendingUp,
    title: 'Você vê o custo real',
    description:
      'O valor apostado traduzido no que ele renderia investido — somado, e por extenso.',
  },
] as const;

/**
 * The same three limits the landing page's `#limites` carries. Mandatory there and
 * worth repeating here: this is the last screen before somebody hands over
 * financial data, and it is the right moment to be clear about what will not
 * happen with it.
 */
const PLATFORM_LIMITS = [
  'Não bloqueamos nem impedimos nenhuma transação — o Open Finance permite ler dados, não barrar pagamentos.',
  'Não julgamos e não mandamos cobrança moral. O app mostra números; a decisão continua sendo sua.',
  'Não movimentamos o seu dinheiro e não somos tratamento de saúde.',
] as const;

export function AuthAside({ className }: { readonly className?: string }) {
  return (
    <aside className={cn('space-y-8', className)}>
      <div className="space-y-5">
        <Badge variant="outline" className="gap-1.5">
          <span aria-hidden className="size-1.5 rounded-full bg-foreground" />
          Baseado no Open Finance Brasil
        </Badge>

        <h2 className="max-w-xl font-heading text-3xl leading-[1.15] font-semibold tracking-tight text-balance sm:text-4xl">
          Você não gastou R$ 500 em apostas.{' '}
          <span className="text-muted-foreground">
            Você abriu mão de R$ 557 no fim do ano.
          </span>
        </h2>

        <p className="max-w-xl text-sm text-muted-foreground">
          O anti-aposta encontra sozinho as transações com casas de apostas no seu extrato e mostra
          quanto aquele mesmo dinheiro renderia investido. Sem bloqueio e sem sermão.
        </p>
      </div>

      <Separator className="max-w-xl" />

      <ul className="grid max-w-xl gap-6 sm:grid-cols-3">
        {HOW_IT_WORKS.map((step) => (
          <li key={step.title} className="space-y-2">
            <span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"
            >
              <step.icon className="size-4" />
            </span>
            <h3 className="text-sm font-medium">{step.title}</h3>
            <p className="text-xs text-muted-foreground">{step.description}</p>
          </li>
        ))}
      </ul>

      <div className="max-w-xl space-y-3 rounded-xl bg-muted p-5">
        <h3 className="text-sm font-medium">O que a plataforma não faz</h3>
        <ul className="space-y-2">
          {PLATFORM_LIMITS.map((limit) => (
            <li key={limit} className="flex gap-2 text-xs text-muted-foreground">
              <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
              {limit}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
