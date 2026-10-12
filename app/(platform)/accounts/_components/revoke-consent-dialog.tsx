'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FormError } from '@shared/ui/form-error';

import { revokeAction } from '../_actions';

/**
 * Revoking deletes data, so the dialog says exactly what goes and what stays —
 * and nothing else. No warning colour on the way out, no "tem certeza?" guilt,
 * no friction beyond reading one paragraph: withdrawing consent is a right
 * (LGPD art. 18), and a screen that argues against it is a dark pattern.
 */
export function RevokeConsentDialog({ consentId }: { readonly consentId: string }) {
  const [open, setOpen] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function revoke() {
    startTransition(async () => {
      const result = await revokeAction(consentId);

      if (!result.ok) {
        setFailure(result.message);

        return;
      }

      setOpen(false);
      toast(result.message);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="h-10">
          Revogar consentimento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revogar o consentimento</DialogTitle>
          <DialogDescription>
            O anti-aposta para de ler o seu extrato e apaga as transações, as contas e as
            classificações que leu até agora. O banco é avisado e invalida o acesso. Seu
            histórico no banco continua lá, e você pode conectar de novo quando quiser.
          </DialogDescription>
        </DialogHeader>
        <FormError message={failure} />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="h-10">
              Manter conectado
            </Button>
          </DialogClose>
          <Button type="button" className="h-10" onClick={revoke} disabled={isPending}>
            {isPending ? 'Revogando…' : 'Revogar e apagar dados'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
