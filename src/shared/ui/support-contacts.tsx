import { ExternalLink, Phone } from 'lucide-react';

import { cn } from 'cn';

/**
 * The crisis and support contacts, declared once.
 *
 * They appear on the public site and inside the app. A support line that goes
 * stale in one copy and not the other is a real harm rather than a formatting
 * inconsistency, so there is exactly one list and every screen renders it.
 *
 * Ordered by urgency, not by relevance to gambling: someone in acute distress
 * needs the 24-hour line first, whatever brought them here.
 *
 * Only CVV's `188` is written down as a number. It is a short code assigned
 * nationally and does not move; a private organisation's mobile number does, and
 * a support contact that quietly goes stale is worse than one extra click.
 *
 * Callers supply their own heading — the wording that introduces these depends on
 * where the reader is standing.
 */
export function SupportContacts({ className }: { readonly className?: string }) {
  return (
    <ul className={cn('space-y-3 text-sm', className)}>
      <li className="flex items-start gap-2">
        <Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <span className="text-muted-foreground">
          <a href="tel:188" className="font-medium text-foreground underline underline-offset-4">
            CVV — 188
          </a>
          <br />
          Apoio emocional por telefone, 24 horas por dia.
        </span>
      </li>

      <li className="flex items-start gap-2">
        <ExternalLink aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <span className="text-muted-foreground">
          <a
            href="https://www.iaapostador.org"
            className="font-medium text-foreground underline underline-offset-4"
            rel="noreferrer noopener"
            target="_blank"
          >
            Instituto de Apoio ao Apostador (IAA)
          </a>
          <br />
          Atendimento para apostadores e para familiares.{' '}
          <span className="text-xs">(abre em nova aba)</span>
        </span>
      </li>

      <li className="flex items-start gap-2">
        <ExternalLink aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <span className="text-muted-foreground">
          <a
            href="https://jogadoresanonimos.com.br"
            className="font-medium text-foreground underline underline-offset-4"
            rel="noreferrer noopener"
            target="_blank"
          >
            Jogadores Anônimos
          </a>
          <br />
          Grupos de apoio entre pessoas que passaram pelo mesmo.{' '}
          <span className="text-xs">(abre em nova aba)</span>
        </span>
      </li>
    </ul>
  );
}
