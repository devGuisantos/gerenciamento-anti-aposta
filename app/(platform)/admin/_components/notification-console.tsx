'use client';

import * as React from 'react';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PlatformNotification } from '@modules/notifications';

const FIXED_INCOME_ANNUAL_RATE_PERCENT = 11.4;

/** Presets so a demo needs one click, with the nudge fields still editable. */
const PRESETS = {
  badge: {
    kind: 'badge-awarded',
    id: '',
    title: 'Sete dias sem apostar',
    description: 'Você manteve uma semana inteira sem transações com BETs.',
  },
  streak: { kind: 'streak-broken', id: '', previousDays: 11 },
  goal: {
    kind: 'goal-reached',
    id: '',
    label: 'Guardar R$ 500,00 até o fim do mês',
    amountInCents: 50_000,
  },
} as const satisfies Record<string, PlatformNotification>;

async function publish(notification: PlatformNotification) {
  const response = await fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notification),
  });

  if (!response.ok) {
    toast.error('Não foi possível publicar a notificação.');
    return;
  }

  const { delivered } = (await response.json()) as { delivered: number };
  toast.success(
    delivered === 0
      ? 'Publicada, mas nenhuma aba está conectada ao stream.'
      : `Publicada para ${delivered} aba(s) conectada(s).`,
  );
}

export function NotificationConsole() {
  const [merchant, setMerchant] = React.useState('Bet365');
  const [amount, setAmount] = React.useState('500,00');
  const [monthlyTotal, setMonthlyTotal] = React.useState('1840,00');
  const [matchedBy, setMatchedBy] = React.useState('MCC 7995');
  const [isSending, setIsSending] = React.useState(false);

  const send = async (notification: PlatformNotification) => {
    setIsSending(true);
    try {
      await publish(notification);
    } finally {
      setIsSending(false);
    }
  };

  const sendNudge = () => {
    const amountInCents = toCents(amount);

    return send({
      kind: 'awareness-nudge',
      id: '',
      merchant,
      amountInCents,
      yieldInCents: Math.round(
        amountInCents * (1 + FIXED_INCOME_ANNUAL_RATE_PERCENT / 100),
      ),
      annualRatePercent: FIXED_INCOME_ANNUAL_RATE_PERCENT,
      monthlyTotalInCents: toCents(monthlyTotal),
      matchedBy,
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Nudge de conscientização</CardTitle>
          <CardDescription>
            Abre o modal de reenquadramento em todas as abas conectadas. O
            rendimento é calculado a {String(FIXED_INCOME_ANNUAL_RATE_PERCENT).replace('.', ',')}% ao
            ano sobre o valor informado.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="merchant"
              label="Casa de apostas"
              value={merchant}
              onChange={setMerchant}
            />
            <Field
              id="matchedBy"
              label="Identificada por"
              value={matchedBy}
              onChange={setMatchedBy}
            />
            <Field
              id="amount"
              label="Valor da aposta (R$)"
              value={amount}
              onChange={setAmount}
              inputMode="decimal"
            />
            <Field
              id="monthlyTotal"
              label="Total do mês (R$)"
              value={monthlyTotal}
              onChange={setMonthlyTotal}
              inputMode="decimal"
            />
          </div>

          <Button
            className="h-10 w-full"
            disabled={isSending}
            onClick={sendNudge}
          >
            <Send />
            Disparar nudge
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gamificação</CardTitle>
          <CardDescription>
            Eventos que chegam como toast, sem interromper a navegação.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="h-10 w-full justify-start"
            disabled={isSending}
            onClick={() => send(PRESETS.badge)}
          >
            Conquista desbloqueada
          </Button>
          <Button
            variant="outline"
            className="h-10 w-full justify-start"
            disabled={isSending}
            onClick={() => send(PRESETS.streak)}
          >
            Sequência interrompida
          </Button>
          <Button
            variant="outline"
            className="h-10 w-full justify-start"
            disabled={isSending}
            onClick={() => send(PRESETS.goal)}
          >
            Meta alcançada
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  inputMode,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly inputMode?: 'decimal';
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        className="h-10"
        value={value}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

/** "1840,00" and "1840.00" both mean 184000 cents. */
function toCents(value: string): number {
  const normalised = Number(value.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(normalised) ? Math.round(normalised * 100) : 0;
}
