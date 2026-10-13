'use client';

import { useId } from 'react';
import { Copy, UserRound } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type RecipientFieldProps = {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly ownUserId: string;
  /** `false` while what is typed is not a whole id yet. */
  readonly isValid: boolean;
};

/**
 * Who everything on this page is sent to. A presenter copies their own id from
 * here on the screen being demonstrated, and pastes it on the console — the
 * console never guesses, lists or searches for people.
 */
export function RecipientField({ value, onChange, ownUserId, isValid }: RecipientFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const showsProblem = value.trim() !== '' && !isValid;

  async function copyOwnId() {
    try {
      await navigator.clipboard.writeText(ownUserId);
      toast('Identificador copiado.');
    } catch {
      // Clipboard access can be refused; the id is on screen to copy by hand.
      toast.error('Não foi possível copiar. Selecione o identificador e copie manualmente.');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Destinatário</CardTitle>
        <CardDescription>
          Os lançamentos e as notificações abaixo vão para esta pessoa, e só para ela.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={id}>Identificador da pessoa</Label>
          <Input
            id={id}
            className="h-10 font-mono"
            autoComplete="off"
            spellCheck={false}
            aria-describedby={hintId}
            aria-invalid={showsProblem}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
          <p id={hintId} className="text-xs text-muted-foreground">
            {showsProblem
              ? 'Cole o identificador completo, com os hífens.'
              : 'A pessoa encontra o próprio identificador nesta mesma página.'}
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg bg-muted p-3 sm:flex-row sm:items-center">
          <UserRound aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-xs text-muted-foreground">Seu identificador</p>
            <p className="font-mono text-sm break-all">{ownUserId}</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="h-9" onClick={copyOwnId}>
              <Copy aria-hidden />
              Copiar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => onChange(ownUserId)}
            >
              Usar o meu
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
