import Link from 'next/link';
import {
  ArrowRight,
  BellRing,
  Flame,
  Plug,
  ScanSearch,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const NATIONAL_FIGURES = [
  {
    value: 'R$ 240 bi',
    label: 'movimentados em casas de apostas pelos brasileiros em 2024',
    source: 'Banco Central do Brasil, 2024',
  },
  {
    value: '24 milhões',
    label: 'de pessoas físicas fizeram algum tipo de aposta no período',
    source: 'Banco Central do Brasil, 2024',
  },
  {
    value: '56%',
    label: 'dizem que o dinheiro gasto com apostas faz falta no fim do mês',
    source: 'FEBRABAN/IPESPE, 2024',
  },
  {
    value: '79%',
    label: 'acreditam que as apostas causam mais problemas do que resolvem',
    source: 'FEBRABAN/IPESPE, 2024',
  },
] as const;

const HOW_IT_WORKS = [
  {
    icon: Plug,
    title: 'Conecte sua conta',
    description:
      'Você autoriza o compartilhamento pelo fluxo de consentimento do Open Finance. Nada é lido sem a sua autorização, e você revoga quando quiser.',
  },
  {
    icon: ScanSearch,
    title: 'Identificamos as apostas',
    description:
      'Cada transação é analisada pelo código da categoria do estabelecimento (MCC 7995), pelo CNPJ da casa de apostas e pela descrição do lançamento.',
  },
  {
    icon: TrendingUp,
    title: 'Veja o custo real',
    description:
      'Traduzimos o valor apostado no que ele renderia investido. O número que você não viu na hora da aposta aparece aqui, somado e por extenso.',
  },
] as const;

const HABIT_FEATURES = [
  {
    icon: Target,
    title: 'Metas suas',
    description:
      'Você define quanto quer deixar de gastar e para onde esse dinheiro vai. A meta é sua, não nossa.',
  },
  {
    icon: Flame,
    title: 'Sequências',
    description:
      'Dias consecutivos sem transações com apostas, contados de forma visível — progresso que dá para enxergar.',
  },
  {
    icon: Trophy,
    title: 'Conquistas',
    description:
      'Marcos de redução de gastos e de constância, sem recompensa aleatória e sem nenhuma mecânica que imite um cassino.',
  },
] as const;

const PLATFORM_LIMITS = [
  'Não bloqueamos, não cancelamos e não impedimos nenhuma transação — o Open Finance permite ler dados, não barrar pagamentos.',
  'Não julgamos e não enviamos cobrança moral. O aplicativo mostra números; a decisão continua sendo sua.',
  'Não somos tratamento de saúde. Se a aposta já virou algo fora do controle, procure ajuda profissional — deixamos os contatos no rodapé.',
] as const;

export default function LandingPage() {
  return (
    <>
      <section className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
        <div className="space-y-6">
          <Badge variant="outline" className="gap-1.5">
            <span className="size-1.5 rounded-full bg-foreground" />
            Baseado no Open Finance Brasil
          </Badge>

          <h1 className="font-heading text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl">
            Você não gastou R$ 500 em apostas.{' '}
            <span className="text-muted-foreground">
              Você abriu mão de R$ 557 no fim do ano.
            </span>
          </h1>

          <p className="max-w-xl text-base text-muted-foreground">
            O anti-aposta conecta sua conta pelo Open Finance, encontra
            automaticamente as transações com casas de apostas e mostra quanto
            aquele mesmo dinheiro renderia investido. Sem bloqueio, sem sermão:
            só o número que ninguém te mostra na hora da aposta.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-10 px-4">
              <Link href="/register">
                Criar conta gratuita
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-10 px-4">
              <Link href="/login">Já tenho conta</Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Projeto acadêmico. Os dados bancários exibidos vêm de uma API
            simulada da Fase 2 do Open Finance Brasil.
          </p>
        </div>

        <NudgePreview />
      </section>

      <section id="numeros" className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-14">
          <div className="max-w-2xl space-y-3">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              O problema não é pequeno, e não é só seu
            </h2>
            <p className="text-sm text-muted-foreground">
              As apostas online deixaram de ser entretenimento pontual e viraram
              um item fixo no orçamento de milhões de famílias brasileiras.
            </p>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {NATIONAL_FIGURES.map((figure) => (
              <div key={figure.value} className="space-y-2">
                <p className="font-heading text-3xl font-semibold tracking-tight">
                  {figure.value}
                </p>
                <p className="text-sm text-muted-foreground">{figure.label}</p>
                <p className="text-xs text-muted-foreground/70">
                  {figure.source}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="como-funciona"
        className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-16"
      >
        <div className="max-w-2xl space-y-3">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Como funciona
          </h2>
          <p className="text-sm text-muted-foreground">
            Três passos, sem planilha e sem anotar gasto nenhum na mão.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {HOW_IT_WORKS.map((step, index) => (
            <Card key={step.title} className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                    <step.icon className="size-4.5" />
                  </span>
                  <span className="font-heading text-sm text-muted-foreground/60">
                    0{index + 1}
                  </span>
                </div>
                <CardTitle className="mt-3">{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-16">
        <div className="max-w-2xl space-y-3">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Consciência vira hábito
          </h2>
          <p className="text-sm text-muted-foreground">
            Enxergar o gasto uma vez muda pouco. O que muda é acompanhar o
            próprio progresso.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {HABIT_FEATURES.map((feature) => (
            <Card key={feature.title} className="h-full">
              <CardHeader>
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <feature.icon className="size-4.5" />
                </span>
                <CardTitle className="mt-3">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section id="limites" className="border-t border-border/60 bg-muted/30">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              O que a plataforma não faz
            </h2>
            <p className="text-sm text-muted-foreground">
              Preferimos ser honestos sobre os limites a prometer o que nenhuma
              ferramenta de Open Finance consegue entregar.
            </p>
          </div>

          <ul className="space-y-4">
            {PLATFORM_LIMITS.map((limit) => (
              <li
                key={limit}
                className="flex gap-3 text-sm text-muted-foreground"
              >
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground/30" />
                {limit}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-20 text-center">
        <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance">
          Descubra quanto as apostas já custaram a você
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Leva menos de dois minutos para conectar uma conta e ver o histórico
          completo organizado.
        </p>
        <Button asChild size="lg" className="mt-6 h-10 px-4">
          <Link href="/register">
            Começar agora
            <ArrowRight />
          </Link>
        </Button>
      </section>
    </>
  );
}

function NudgePreview() {
  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BellRing className="size-4" />
          <span className="text-xs font-medium tracking-wide uppercase">
            Transação identificada
          </span>
        </div>
        <CardTitle className="mt-2 text-lg">Aposta de R$ 500,00</CardTitle>
        <CardDescription>
          Detectada pelo MCC 7995 · hoje, 21h47 · Cartão de crédito
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Esse valor, investido em renda fixa por 12 meses
          </p>
          <p className="font-heading text-3xl font-semibold tracking-tight">
            R$ 557,00
          </p>
          <p className="text-xs text-muted-foreground">
            Rendimento estimado de R$ 57,00 a 11,4% ao ano
          </p>
        </div>

        <Separator />

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Nos últimos 30 dias você transferiu
          </p>
          <div className="flex items-baseline justify-between">
            <span className="font-heading text-2xl font-semibold tracking-tight">
              R$ 1.840,00
            </span>
            <span className="text-xs text-muted-foreground">
              em 11 transações
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[68%] rounded-full bg-primary" />
          </div>
          <p className="text-xs text-muted-foreground">
            68% do que você separou para investir neste mês.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
