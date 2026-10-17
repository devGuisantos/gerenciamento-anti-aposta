'use client';

import { useTransition } from 'react';
import { Target } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { formatBRL } from '@shared/ui/money-text';

import { setCeilingAction } from '../_actions';

/**
 * Adopting the simulated value as the ceiling.
 *
 * The month already under way keeps the ceiling it started with — moving it
 * mid-month would rewrite an outcome the user is living through — so a change
 * starts next month, and the toast says from when. A first ceiling applies at
 * once. The backend decides which, never this button.
 *
 * No "tem certeza?": the choice is the user's, and choosing again replaces it.
 * The screen changes only on the backend's answer, never optimistically.
 */
export function SetCeilingAction({ ceilingInCents }: { readonly ceilingInCents: number }) {
  const [isSaving, startSaving] = useTransition();

  function adopt() {
    startSaving(async () => {
      const result = await setCeilingAction(ceilingInCents);
      if (result.status === 'FAILED') {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-9 w-full"
      disabled={isSaving}
      onClick={adopt}
    >
      <Target />
      {isSaving ? 'Salvando…' : `Usar ${formatBRL(ceilingInCents)} como minha meta`}
    </Button>
  );
}
