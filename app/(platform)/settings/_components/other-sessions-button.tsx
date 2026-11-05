'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { endOtherSessionsAction } from '../_actions';

/** For a phone left behind or a shared computer. This one stays signed in. */
export function OtherSessionsButton() {
  const [isEnding, startEnding] = useTransition();

  function endOthers() {
    startEnding(async () => {
      const result = await endOtherSessionsAction();

      if (result.status === 'SAVED') {
        toast.success(result.message);

        return;
      }

      toast.error(result.form.message);
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="h-10 shrink-0"
      disabled={isEnding}
      onClick={endOthers}
    >
      {isEnding ? 'Saindo…' : 'Sair dos outros aparelhos'}
    </Button>
  );
}
