# `awareness` — System 2 reframing

Turns an amount already spent into something the user can weigh: what that money would have
earned. This is Kahneman's System 2 activation, the behavioural core of the thesis.

## Model

An `AwarenessNudge` carries:

- the `YieldEquivalent` of the amount over 12 months in fixed income;
- concrete equivalents (goods or experiences of comparable value);
- the running monthly total of betting transactions.

## Rules

- Compound interest lives in a **pure, unit-tested domain service**. It is required coverage: a
  wrong number here discredits the entire product.
- The annual rate is configuration (`FIXED_INCOME_ANNUAL_RATE`), never a literal in a component,
  and the UI states the rate used. An unlabelled projection is a made-up number.
- Projections are presented as estimates, never as guaranteed returns. This is a financial
  application; overstating a return is both an ethical and a legal problem.
- The nudge is **retrospective**. It appears after a transaction was detected. Never write copy
  suggesting the app could have stopped it.
- Tone is factual and non-judgemental: "esse valor renderia R$ X em 12 meses", never "você
  desperdiçou". No loss-aversion theatre, no alarm styling, no guilt.

Emits `AwarenessNudgeGenerated`.
