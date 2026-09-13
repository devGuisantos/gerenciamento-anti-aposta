import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type PlaceholderPageProps = {
  readonly title: string;
  readonly description: string;
  /** Which bounded context will own this screen, so the next person knows where to start. */
  readonly module: string;
};

/**
 * Every sidebar entry needs a destination — a nav item that 404s is a broken nav.
 * These screens exist only until their module lands.
 */
export function PlaceholderPage({ title, description, module }: PlaceholderPageProps) {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Em construção</CardTitle>
          <CardDescription>
            Esta tela será implementada pelo módulo <code>{module}</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Enquanto isso, o painel inicial já mostra o panorama com dados simulados.
        </CardContent>
      </Card>
    </div>
  );
}
