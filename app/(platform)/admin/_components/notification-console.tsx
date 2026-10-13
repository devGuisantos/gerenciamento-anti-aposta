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
import type { DemoNotificationDraft } from '@modules/notifications';

import { sendDemoNotificationAction } from '../_actions';

/**
 * One badge per family, so a demo can show each mark and both kinds of evidence.
 *
 * `badgeId` is a real id from `achievements/_badge.ts`: the dialog reads the mark
 * and the criterion from the catalogue, and this payload carries only what the
 * catalogue cannot know — which badge, and what the user actually did to satisfy
 * it. The evidence lines below are written to match what
 * `_badges-view.ts` produces for real.
 */
const BADGE_PRESETS = [
  {
    label: 'Conquista · sequência',
    badgeId: 'streak-7',
    title: 'Uma semana sem apostas',
    description: '7 dias, de 05 de março a 11 de março.',
  },
  {
    label: 'Conquista · teto',
    badgeId: 'ceiling-1',
    title: 'Um mês dentro do teto',
    description: '1 mês fechado dentro do teto: julho de 2026.',
  },
  {
    label: 'Conquista · queda',
    badgeId: 'reduction-1',
    title: 'Um mês de queda',
    description: '1 mês fechado com queda: agosto de 2026.',
  },
  {
    label: 'Conquista · poupança',
    badgeId: 'savings-1',
    title: 'Primeira meta concluída',
    description: 'Concluída: Curso técnico.',
  },
] as const;

function toBadgeDraft(preset: (typeof BADGE_PRESETS)[number]): DemoNotificationDraft {
  return {
    kind: 'BADGE_AWARDED',
    badgeId: preset.badgeId,
    title: preset.title,
    description: preset.description,
  };
}

/** Presets so a demo needs one click, with the nudge fields still editable. */
const PRESETS = {
  streak: { kind: 'STREAK_BROKEN', previousDays: 11 },
  goal: {
    kind: 'GOAL_REACHED',
    label: 'Guardar R$ 500,00 até o fim do mês',
    amountInCents: 50_000,
  },
} as const satisfies Record<string, DemoNotificationDraft>;

type NotificationConsoleProps = {
  /** A whole user id, or `null` while none is chosen — then nothing can be sent. */
  readonly recipientId: string | null;
};

/**
 * Sends, by hand, the notifications the detection and gamification flows will
 * emit on their own — to one person, through the backend's stream. A nudge
 * carries the amount and nothing computed from it: the backend reframes it
 * with the awareness context's rate, so the console cannot show a figure the
 * product would not.
 */
export function NotificationConsole({ recipientId }: NotificationConsoleProps) {
  const [merchant, setMerchant] = React.useState('Bet365');
  const [amount, setAmount] = React.useState('500,00');
  const [monthlyTotal, setMonthlyTotal] = React.useState('1840,00');
  const [matchedBy, setMatchedBy] = React.useState('MCC 7995');
  const [isSending, startSending] = React.useTransition();
  const isDisabled = isSending || recipientId === null;

  function send(draft: DemoNotificationDraft) {
    if (recipientId === null) {
      return;
    }

    startSending(async () => {
      const result = await sendDemoNotificationAction(recipientId, draft);

      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function sendNudge() {
    send({
      kind: 'AWARENESS_NUDGE',
      merchant,
      // A bet leaves the account, so it travels as a debit, like on the statement.
      amountInCents: -toCents(amount),
      monthlyTotalInCents: toCents(monthlyTotal),
      matchedBy,
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Nudge de conscientização</CardTitle>
          <CardDescription>
            Abre o modal de reenquadramento nas abas abertas do destinatário. O rendimento é
            calculado pelo back-end, com a taxa do módulo de conscientização.
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

          <Button className="h-10 w-full" disabled={isDisabled} onClick={sendNudge}>
            <Send />
            Disparar nudge
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gamificação</CardTitle>
          <CardDescription>
            Uma conquista abre o modal de celebração, com confete. A sequência
            interrompida e a meta alcançada chegam como toast — reportar um
            tropeço em modal seria a plataforma dando bronca.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-2">
          {BADGE_PRESETS.map((preset) => (
            <Button
              key={preset.badgeId}
              variant="outline"
              className="h-10 w-full justify-start"
              disabled={isDisabled}
              onClick={() => send(toBadgeDraft(preset))}
            >
              {preset.label}
            </Button>
          ))}
          <Button
            variant="outline"
            className="h-10 w-full justify-start"
            disabled={isDisabled}
            onClick={() => send(PRESETS.streak)}
          >
            Sequência interrompida
          </Button>
          <Button
            variant="outline"
            className="h-10 w-full justify-start"
            disabled={isDisabled}
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

/**
 * "1840,00", "1.840,00" and "1840.00" all mean 184000 cents. With a comma the
 * dots are thousands separators; without one, a dot is the decimal point.
 */
function toCents(value: string): number {
  const trimmed = value.trim();
  const decimal = trimmed.includes(',') ? trimmed.replace(/\./g, '').replace(',', '.') : trimmed;
  const normalised = Number(decimal);

  return Number.isFinite(normalised) ? Math.round(normalised * 100) : 0;
}
