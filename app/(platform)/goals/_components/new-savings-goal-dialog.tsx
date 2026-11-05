'use client';

import { useId, useState, useTransition } from 'react';
import { Plus } from 'lucide-react';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { createSavingsGoalAction } from '../_actions';
import {
  GOAL_TITLE_MAXIMUM_LENGTH,
  GOAL_TITLE_MINIMUM_LENGTH,
  type GoalPurpose,
} from '../_savings-goal';
import { AmountField } from './amount-field';
import { PurposeField } from './purpose-field';
import { FormError } from '@shared/ui/form-error';

const DEFAULT_PURPOSE: GoalPurpose = 'EMERGENCY_FUND';

/**
 * Creating a goal: the user writes the name, picks what it is for, and says how
 * much it adds up to. All three are theirs — we suggest nothing, because a target
 * the product picked is a target the product owns, and autonomy is the whole
 * mechanic this screen rests on.
 */
export function NewSavingsGoalDialog() {
  const titleId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [purpose, setPurpose] = useState<GoalPurpose>(DEFAULT_PURPOSE);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  /* Submitting through a transition rather than `useActionState` so the dialog can
     close itself on success without a `setState` inside an effect, which React 19
     lints and which would run a render later than the close belongs. */
  function submit(formData: FormData) {
    startSaving(async () => {
      const result = await createSavingsGoalAction(formData);
      if (result.status === 'FAILED') {
        setError(result.error);
        return;
      }
      setError(null);
      setPurpose(DEFAULT_PURPOSE);
      setIsOpen(false);
    });
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="h-9">
          <Plus />
          Nova meta
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova meta</DialogTitle>
          <DialogDescription>
            Você anota aqui quanto quer juntar e para quê. O valor guardado é você que registra — a
            plataforma não movimenta dinheiro nem lê a sua poupança.
          </DialogDescription>
        </DialogHeader>

        <form action={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={titleId}>Nome da meta</Label>
            <Input
              id={titleId}
              name="title"
              className="h-10"
              type="text"
              autoComplete="off"
              placeholder="Trocar a geladeira"
              minLength={GOAL_TITLE_MINIMUM_LENGTH}
              maxLength={GOAL_TITLE_MAXIMUM_LENGTH}
              required
            />
          </div>

          <PurposeField purpose={purpose} onPurposeChange={setPurpose} />

          <AmountField
            name="targetInCents"
            label="Quanto quer juntar"
            hint="O total da meta. Você pode mudar de ideia depois."
          />

          <FormError message={error} />

          <DialogFooter>
            <Button type="submit" className="h-10 w-full" disabled={isSaving}>
              {isSaving ? 'Salvando…' : 'Criar meta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
