import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

/**
 * The way into the app, which is the only thing on these screens that works.
 *
 * `(auth)/CLAUDE.md` keeps marketing, statistics and nudges off these cards, and
 * this is none of those — it is navigation. Without it both screens are dead ends:
 * the forms cannot sign anyone in until `identity` exists, so a visitor who
 * arrives from the landing page CTA fills in a form, is told it is not connected,
 * and has nowhere to go.
 *
 * Rendered by both cards from one file so the wording cannot drift into two
 * versions, one of which would eventually overclaim what the demo contains.
 */
export function DemoAccess() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">ou</span>
        <Separator className="flex-1" />
      </div>

      <Button asChild variant="outline" className="h-10 w-full">
        <Link href="/dashboard">
          Entrar na demonstração
          <ArrowUpRight />
        </Link>
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Abre o app completo com dados simulados, sem conta e sem conectar nenhum banco.
      </p>
    </div>
  );
}
