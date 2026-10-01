'use client';

import { useState, useTransition } from 'react';
import { HandCoins, PiggyBank } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';
import {
  createConfettiBurst,
  MilestoneConfetti,
  type ConfettiBurst,
} from '@shared/ui/milestone-confetti';
import { formatBRL } from '@shared/ui/money-text';

import { recordMovementAction } from '../_actions';
import type { MovementDirection } from '../_savings-goal';
import { AmountField } from './amount-field';
import { FormError } from './form-error';

type MovementCopy = {
  readonly triggerLabel: string;
  readonly icon: typeof PiggyBank;
  readonly title: string;
  readonly description: string;
  readonly fieldLabel: string;
  readonly submitLabel: string;
};

/**
 * Both directions read from one place so they stay parallel in tone.
 *
 * The withdrawal copy says what a withdrawal does and then stops. It has to carry
 * the trade-off — the user asked to be told — without becoming a guilt trip or a
 * speed bump: no warning colour, no "tem certeza?", no delay, no second
 * confirmation. Manufactured loss aversion is on the product's forbidden list, and
 * a person moving their own money back into their own week may have a very good
 * reason the app knows nothing about. It informs; it never argues.
 */
const MOVEMENT_COPY: Readonly<Record<MovementDirection, MovementCopy>> = {
  DEPOSIT: {
    triggerLabel: 'Guardar',
    icon: PiggyBank,
    title: 'Registrar um valor guardado',
    description:
      'Anote quanto você separou para esta meta. Este é o seu registro: a plataforma não movimenta dinheiro e não vê a sua poupança.',
    fieldLabel: 'Quanto você guardou',
    submitLabel: 'Registrar',
  },
  WITHDRAWAL: {
    triggerLabel: 'Retirar',
    icon: HandCoins,
    title: 'Registrar uma retirada',
    description:
      'Anote quanto você tirou desta meta. O valor sai do total guardado e a meta fica mais distante — retirar é sempre possível, e a decisão é sua.',
    fieldLabel: 'Quanto você retirou',
    submitLabel: 'Registrar retirada',
  },
};

type RecordMovementDialogProps = {
  readonly goalId: string;
  readonly goalTitle: string;
  readonly direction: MovementDirection;
  /** What the goal holds right now, so a withdrawal knows its own ceiling. */
  readonly savedInCents: number;
};

export function RecordMovementDialog({
  goalId,
  goalTitle,
  direction,
  savedInCents,
}: RecordMovementDialogProps) {
  const copy = MOVEMENT_COPY[direction];
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [burst, setBurst] = useState<ConfettiBurst | null>(null);
  const [isSaving, startSaving] = useTransition();
  const prefersReducedMotion = usePrefersReducedMotion();
  const TriggerIcon = copy.icon;

  /**
   * Only the server knows whether this movement finished the goal, so the
   * celebration follows its answer rather than comparing numbers here.
   *
   * The toast is the part that carries the news; the confetti is decoration on top
   * of it, and it is skipped entirely for anyone who asked their system for less
   * motion. Nothing is lost that way — WCAG 2.3.3, and the card's "Alcançada"
   * badge says the same thing without moving.
   */
  function celebrate(reachedGoalTitle: string) {
    toast.success(`Meta alcançada: ${reachedGoalTitle}`);
    if (prefersReducedMotion) return;
    setBurst(createConfettiBurst());
  }

  function submit(formData: FormData) {
    startSaving(async () => {
      const result = await recordMovementAction(formData);
      if (result.status === 'FAILED') {
        setError(result.error);
        return;
      }
      setError(null);
      setIsOpen(false);
      if (result.reachedGoalTitle !== null) celebrate(result.reachedGoalTitle);
    });
  }

  return (
    <>
      <MilestoneConfetti burst={burst} onFinished={() => setBurst(null)} />
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          setError(null);
        }}
      >
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 flex-1"
            /* The card lists several goals, so the label alone ("Retirar") does not
               say which one this belongs to for anyone navigating by buttons. */
            aria-label={`${copy.triggerLabel} — ${goalTitle}`}
            disabled={direction === 'WITHDRAWAL' && savedInCents === 0}
          >
            <TriggerIcon />
            {copy.triggerLabel}
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogDescription>{goalTitle}</DialogDescription>
            <DialogTitle>{copy.title}</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">{copy.description}</p>

          <form action={submit} className="space-y-4">
            <input type="hidden" name="goalId" value={goalId} />
            <input type="hidden" name="direction" value={direction} />

            <AmountField
              name="amountInCents"
              label={copy.fieldLabel}
              hint={`Esta meta tem ${formatBRL(savedInCents)} guardados no seu registro.`}
            />

            <FormError message={error} />

            <DialogFooter>
              <Button type="submit" className="h-10 w-full" disabled={isSaving}>
                {isSaving ? 'Salvando…' : copy.submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
