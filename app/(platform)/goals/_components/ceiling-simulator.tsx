'use client';

import { useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { formatBRL } from '@shared/ui/money-text';

import { FIXED_INCOME_ANNUAL_RATE } from '../../dashboard/_mock-snapshot';
import { toYieldEquivalentInCents } from '../../transactions/_ledger-view';
import {
  CEILING_STEP_IN_CENTS,
  simulateCeiling,
  type CeilingSimulation,
  type MonthlyBetTotal,
} from '../_goals-view';
import { SetCeilingAction } from './set-ceiling-action';

const CENTS_PER_REAL = 100;

const ratePercent = (FIXED_INCOME_ANNUAL_RATE * 100).toFixed(1).replace('.', ',');

type CeilingSimulatorProps = {
  /** Closed months only — half a month would understate every ceiling tried here. */
  readonly months: readonly MonthlyBetTotal[];
  readonly capInCents: number;
  /** Opens on the ceiling the user already chose, so the first thing they see is theirs. */
  readonly initialCeilingInCents: number;
};

/**
 * What a ceiling would have meant against the months the user actually had.
 *
 * This is the System 2 device of the screen: picking a number in the abstract is
 * a guess, and picking one next to eleven real months is a decision. It answers
 * in counts and differences and never in advice — it does not recommend a value,
 * and it does not say what the money would have been spent on instead.
 *
 * It changes nothing until the user says so, and the copy says that up front.
 */
export function CeilingSimulator({
  months,
  capInCents,
  initialCeilingInCents,
}: CeilingSimulatorProps) {
  const [ceilingInCents, setCeilingInCents] = useState(initialCeilingInCents);
  const simulation = simulateCeiling(months, ceilingInCents);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simular um teto</CardTitle>
        <CardDescription>
          Escolha um valor e veja o que ele teria significado nos seus últimos meses. Nada aqui
          altera a sua meta até você confirmar.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-3">
          {/* Not a `<label htmlFor>`: the slider's focusable element is a thumb
              inside the primitive, so there is nothing for a `for` to point at.
              The accessible name repeats this text and adds the unit the thumb
              announces — it has to contain the visible label, or the two disagree
              for anyone using voice control (WCAG 2.5.3). */}
          <p className="text-xs text-muted-foreground">Teto mensal de gastos com apostas</p>
          <p className="font-heading text-3xl font-semibold tracking-tight">
            {formatBRL(ceilingInCents)}
            <span className="ml-2 text-sm font-normal text-muted-foreground">por mês</span>
          </p>

          {/* The control works in whole reais because a slider announces its raw
              value: "1200" is something a screen reader can say, 120000 is not.
              Cents are restored the moment the value leaves the control. */}
          <Slider
            aria-label="Teto mensal de gastos com apostas, em reais"
            min={0}
            max={capInCents / CENTS_PER_REAL}
            step={CEILING_STEP_IN_CENTS / CENTS_PER_REAL}
            value={[ceilingInCents / CENTS_PER_REAL]}
            onValueChange={([reais]) => setCeilingInCents(reais * CENTS_PER_REAL)}
            className="py-2 [&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:after:-inset-3"
          />

          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{formatBRL(0)}</span>
            <span>{formatBRL(capInCents)}</span>
          </div>
        </div>

        <SimulationReading simulation={simulation} />

        <SetCeilingAction ceilingInCents={ceilingInCents} />
      </CardContent>
    </Card>
  );
}

function SimulationReading({ simulation }: { readonly simulation: CeilingSimulation }) {
  const monthsAbove = simulation.monthsCounted - simulation.monthsWithin;

  return (
    <div className="space-y-2 rounded-lg bg-muted p-4">
      <p className="text-sm">
        Nos últimos {simulation.monthsCounted} meses fechados, você teria ficado dentro desse teto
        em <span className="font-medium">{simulation.monthsWithin}</span> deles.
      </p>

      {monthsAbove === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum desses meses passaria desse valor.</p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Nos outros {monthsAbove}, o gasto passou o teto em{' '}
            {formatBRL(simulation.averageExcessInCents)} por mês, em média.
          </p>
          <p className="text-xs text-muted-foreground">
            Esse valor médio, aplicado em renda fixa por 12 meses, seria{' '}
            {formatBRL(toYieldEquivalentInCents(simulation.averageExcessInCents, FIXED_INCOME_ANNUAL_RATE))}
            . Estimativa a {ratePercent}% ao ano — não é garantia de retorno.
          </p>
        </>
      )}
    </div>
  );
}
