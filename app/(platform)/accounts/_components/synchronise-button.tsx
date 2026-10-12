'use client';

import { useTransition } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { synchroniseAction } from '../_actions';

/**
 * Asks the bank for what is new. Safe to press again: the backend ingests a
 * transaction once, however many times it is read. The answer is a count, said
 * plainly — including "nothing new", which is an answer, not a failure.
 */
export function SynchroniseButton({ consentId }: { readonly consentId: string }) {
  const [isPending, startTransition] = useTransition();

  function synchronise() {
    startTransition(async () => {
      const result = await synchroniseAction(consentId);

      if (result.ok) {
        toast(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Button type="button" className="h-10" onClick={synchronise} disabled={isPending}>
      <RefreshCw aria-hidden className={isPending ? 'animate-spin motion-reduce:animate-none' : undefined} />
      {isPending ? 'Sincronizando…' : 'Sincronizar agora'}
    </Button>
  );
}
