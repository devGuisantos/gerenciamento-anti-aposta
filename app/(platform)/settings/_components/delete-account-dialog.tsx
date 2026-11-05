'use client';

import { FormFailureNotice } from '@/app/(auth)/_components/form-failure-notice';
import { PasswordField } from '@/app/(auth)/_components/password-field';
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

import { deleteAccountAction } from '../_actions';
import { useSettingsForm } from './use-settings-form';

/**
 * Says what goes and that there is no way back, and stops. Leaving is a right
 * (LGPD art. 18), so there is no red, no "tem certeza?", no list of what the person
 * would be giving up and nothing arguing for staying. The password is there
 * because a stolen session must not be able to do this, not to slow anybody down.
 */
export function DeleteAccountDialog() {
  const { form, isSaving, submit } = useSettingsForm(deleteAccountAction);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="h-10 shrink-0">
          Excluir conta
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir conta</DialogTitle>
          <DialogDescription>
            A exclusão é imediata e não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Apagamos agora seu cadastro, metas, conquistas, notificações, extrato e contas
            conectadas, e você sai de todos os aparelhos. O e-mail fica livre para uma nova conta.
          </p>
          <p>
            Avisamos o banco que o consentimento terminou. Ele mantém os próprios registros.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <PasswordField
            name="currentPassword"
            label="Senha atual"
            autoComplete="current-password"
            meter="NONE"
            error={form.fieldErrors['currentPassword']}
          />
          <FormFailureNotice message={form.message} />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="h-10">
                Voltar
              </Button>
            </DialogClose>
            <Button type="submit" variant="outline" className="h-10" disabled={isSaving}>
              {isSaving ? 'Excluindo…' : 'Excluir minha conta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
