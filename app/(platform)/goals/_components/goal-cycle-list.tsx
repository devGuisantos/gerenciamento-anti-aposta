import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { formatBRL } from '@shared/ui/money-text';

import { describeCycleMargin, type GoalCycle } from '../_goals-view';
import { CycleStatusBadge } from './cycle-status-badge';

/** The bar cannot run past its own track; the figures beside it keep the real number. */
const FULL_BAR = 100;

type GoalCycleListProps = {
  /** Closed months only, newest first. The open one belongs to the screen's hero. */
  readonly cycles: readonly GoalCycle[];
};

/**
 * The months the user already went through, kept because competence in SDT terms
 * is progress you can see — and because a single bad month means much less next
 * to the ones around it. Months before the first goal are simply absent: the user
 * had not chosen a ceiling yet, and measuring them against one would invent a
 * failure they never agreed to.
 */
export function GoalCycleList({ cycles }: GoalCycleListProps) {
  if (cycles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Este é o seu primeiro mês com uma meta. O resultado dele aparece aqui quando o mês fechar.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {cycles.map((cycle, index) => (
          <li key={cycle.monthsAgo} className="space-y-3">
            {index > 0 ? <Separator /> : null}
            <CycleRow cycle={cycle} />
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted-foreground">{describeRecord(cycles)}</p>
    </div>
  );
}

function CycleRow({ cycle }: { readonly cycle: GoalCycle }) {
  const isOverCeiling = cycle.marginInCents < 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium first-letter:uppercase">{cycle.monthLabel}</h3>
        <CycleStatusBadge status={cycle.status} />
      </div>

      <Progress
        value={Math.min(cycle.usedPercentage, FULL_BAR)}
        aria-label={`Gasto com apostas em ${cycle.monthLabel}, contra o teto de ${formatBRL(cycle.ceilingInCents)}`}
        className={isOverCeiling ? '*:data-[slot=progress-indicator]:bg-destructive' : undefined}
      />

      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="tabular-nums">
          {formatBRL(cycle.spentInCents)} de {formatBRL(cycle.ceilingInCents)}
        </span>
        <span className="tabular-nums">{describeCycleMargin(cycle)}</span>
      </div>
    </div>
  );
}

/**
 * Counts, and stops. "1 de 3" is a fact the reader can do what they like with;
 * "você só conseguiu em 1 mês" is the product telling somebody off.
 */
function describeRecord(cycles: readonly GoalCycle[]): string {
  const within = cycles.filter((cycle) => cycle.status === 'REACHED').length;
  const months = cycles.length === 1 ? 'mês fechado' : 'meses fechados';
  return `Dentro do teto em ${within} de ${cycles.length} ${months}.`;
}
