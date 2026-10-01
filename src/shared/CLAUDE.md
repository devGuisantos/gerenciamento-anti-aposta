# `src/shared/` — shared kernel

Only things that genuinely belong to **every** context. This folder is a privilege, not a
convenience: if something is used by one module, it lives in that module. A "shared" folder that
accumulates orphans becomes the `utils/` dumping ground under a nicer name.

## `domain/`

`Entity`, `AggregateRoot`, `ValueObject`, `DomainEvent`, `UniqueEntityId`, `Result`, `Money`. Pure
TypeScript, no dependencies, no framework imports. `Money` is integer cents plus `BRL` — the single
most important type in the codebase, and the one with the least tolerance for shortcuts.

## `application/`

The `UseCase` contract, the `AppError` taxonomy, and the `Clock` and `IdGenerator` ports that keep
`new Date()` and UUID generation out of domain code.

## `infrastructure/`

The Prisma client singleton, the in-process event bus, the structured logger, and `env.ts` — a Zod
schema validated once at boot so a missing variable fails at startup, not at 2 a.m. inside a route
handler. The logger is the only sanctioned output: `console.log` fails review, and no PII (CPF,
CNPJ, account numbers, tokens, transaction descriptions) is ever logged.

## `ui/`

**Our** components, composed from the shadcn primitives in `components/ui/` and named after the
domain: `Logo`, `MoneyText`, `NudgeCard`, `StreakBadge`, `MilestoneConfetti`. Domain-aware presentation belongs here.
`MilestoneConfetti` is here for a reason worth stating, since this folder is a privilege: two
different events in two different route groups celebrate — `GoalReached` on `/goals` and
`BadgeAwarded` through the notification stream — and a celebration that drifts into two slightly
different versions is a celebration nobody can reason about. Its limits are load-bearing product
rules, not styling, so there is exactly one of it.

Anything that formats currency goes through the same `Intl.NumberFormat('pt-BR')` helper — money
formatted two different ways on one screen reads as a bug in a finance app.
