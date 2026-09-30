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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { createSavingsGoalAction } from '../_actions';
import { GOAL_PURPOSE_DESCRIPTORS } from '../_goal-purposes';
import {
  GOAL_PURPOSES,
  GOAL_TITLE_MAXIMUM_LENGTH,
  GOAL_TITLE_MINIMUM_LENGTH,
  type GoalPurpose,
} from '../_savings-goal';
import { AmountField } from './amount-field';
import { FormError } from './form-error';

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

type PurposeFieldProps = {
  readonly purpose: GoalPurpose;
  readonly onPurposeChange: (purpose: GoalPurpose) => void;
};

function PurposeField({ purpose, onPurposeChange }: PurposeFieldProps) {
  const fieldId = useId();
  const SelectedIcon = GOAL_PURPOSE_DESCRIPTORS[purpose].icon;

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>Para que serve</Label>
      {/* A hidden input rather than Radix's own `name`, so what the action reads is
          the value this component is holding and nothing else. */}
      <input type="hidden" name="purpose" value={purpose} />
      <Select value={purpose} onValueChange={onPurposeChange}>
        <SelectTrigger id={fieldId} className="h-10 w-full">
          {/* `SelectValue` needs explicit children: its items only register once the
              portal opens, so an empty one renders blank on the server. */}
          <SelectValue>
            <span className="flex items-center gap-2">
              <SelectedIcon aria-hidden className="size-4 text-muted-foreground" />
              {GOAL_PURPOSE_DESCRIPTORS[purpose].label}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {GOAL_PURPOSES.map((option) => {
            const { label, icon: Icon } = GOAL_PURPOSE_DESCRIPTORS[option];

            return (
              <SelectItem key={option} value={option}>
                <Icon aria-hidden className="size-4 text-muted-foreground" />
                {label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
