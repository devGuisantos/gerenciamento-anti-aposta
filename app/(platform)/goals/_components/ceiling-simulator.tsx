'use client';

import { useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { formatBRL } from '@shared/ui/money-text';

import { stepAt, type SimulatorModel } from '../_ceiling-view';
import { SetCeilingAction } from './set-ceiling-action';

const CENTS_PER_REAL = 100;

type CeilingSimulatorProps = {
  readonly model: SimulatorModel;
  /** "9,3" — the rate the backend reframed each average with. */
  readonly rateLabel: string;
};

/**
 * What a ceiling would have meant against the months the user actually had.
 *
 * This is the System 2 device of the screen: picking a number in the abstract is
 * a guess, and picking one next to eleven real months is a decision. It answers
 * in counts and differences and never in advice — it does not recommend a value,
 * and it does not say what the money would have been spent on instead.
 *
 * Every figure is a stop the backend computed; the slider only chooses which one
 * to read. Nothing changes until the user presses the button, and the copy says
 * so up front.
 */
export function CeilingSimulator({ model, rateLabel }: CeilingSimulatorProps) {
  const [ceilingInCents, setCeilingInCents] = useState(model.initialCeilingInCents);
  const step = stepAt(model, ceilingInCents);

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
            max={model.capInCents / CENTS_PER_REAL}
            step={model.stepInCents / CENTS_PER_REAL}
            value={[ceilingInCents / CENTS_PER_REAL]}
            onValueChange={([reais]) => setCeilingInCents(Math.round(reais * CENTS_PER_REAL))}
            className="py-2 [&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:after:-inset-3"
          />

          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{formatBRL(0)}</span>
            <span>{formatBRL(model.capInCents)}</span>
          </div>
        </div>

        {step === null ? null : (
          <SimulationReading step={step} monthsCounted={model.monthsCounted} rateLabel={rateLabel} />
        )}

        <SetCeilingAction ceilingInCents={ceilingInCents} />
      </CardContent>
    </Card>
  );
}

type SimulationReadingProps = {
  readonly step: NonNullable<ReturnType<typeof stepAt>>;
  readonly monthsCounted: number;
  readonly rateLabel: string;
};

function SimulationReading({ step, monthsCounted, rateLabel }: SimulationReadingProps) {
  const monthsAbove = monthsCounted - step.monthsWithin;

  if (monthsCounted === 0) {
    return (
      <p className="rounded-lg bg-muted p-4 text-sm">
        Ainda não há um mês fechado com dados para comparar. O primeiro aparece aqui quando o mês
        acabar.
      </p>
    );
  }

  return (
    <div className="space-y-2 rounded-lg bg-muted p-4">
      <p className="text-sm">
        Nos últimos {monthsCounted} meses fechados, você teria ficado dentro desse teto em{' '}
        <span className="font-medium">{step.monthsWithin}</span> deles.
      </p>

      {monthsAbove === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum desses meses passaria desse valor.</p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Nos outros {monthsAbove}, o gasto passou o teto em{' '}
            {formatBRL(step.averageExcess.amountInCents)} por mês, em média.
          </p>
          <p className="text-xs text-muted-foreground">
            Esse valor médio, aplicado em renda fixa por 12 meses, seria{' '}
            {formatBRL(step.averageExcessYieldEquivalent.amountInCents)}. Estimativa a {rateLabel}%
            ao ano — não é garantia de retorno.
          </p>
        </>
      )}
    </div>
  );
}
