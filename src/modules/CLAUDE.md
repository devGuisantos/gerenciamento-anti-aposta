# `src/modules/` — bounded contexts

Seven contexts, each with its own CLAUDE.md describing its aggregates, invariants, and events.

## Anatomy

Every module has the same shape:

```
src/modules/<context>/
  domain/
    <aggregate>.ts                    # entity / aggregate root + invariants
    <value-object>.ts
    events/<event-name>.ts
    <name>.repository.ts              # PORT (interface) — lives in domain
    <context>.errors.ts
  application/
    <verb-noun>.use-case.ts           # one use case per file
    ports/<name>.port.ts
    dto/<name>.dto.ts
  infrastructure/
    prisma-<name>.repository.ts
    <name>.mapper.ts                  # Prisma row <-> domain, both directions
    in-memory/<name>.repository.ts    # test double, shipped with the module
  index.ts                            # PUBLIC API — the only file other modules may import
```

## Boundaries

1. A module may import from another module **only** via that module's `index.ts`, and only the
   types/DTOs it re-exports. Importing `@modules/gamification/domain/streak` from `awareness` is a
   review blocker.
2. Preferred cross-module communication is **domain events**, not direct calls. A direct call is
   acceptable only for a synchronous query the caller cannot proceed without.
3. No cross-module database joins. If `gamification` needs an amount, it arrives in the event
   payload or lives in that module's own read model.
4. `sandbox-bank` is a **foreign system**. `open-finance` reaches it over HTTP through an
   anti-corruption layer, never by importing it. This keeps the Phase 2 protocol demonstration
   honest — it is the thesis's core technical claim.

## Event flow

```
sandbox-bank  --HTTP-->  open-finance.IngestTransactions
     -> TransactionsIngested
          -> bet-detection.ClassifyTransactions
               -> BetTransactionDetected
                    -> awareness.GenerateNudge   -> AwarenessNudgeGenerated -> notifications
                    -> gamification.BreakStreak  -> StreakBroken            -> notifications
```

| Context         | Owns                                                     |
| --------------- | -------------------------------------------------------- |
| `identity`      | users, sessions, "who is asking"                          |
| `open-finance`  | consent lifecycle + transaction ingestion (DataRecipient) |
| `sandbox-bank`  | the simulated institution (DataHolder) + seeded data      |
| `bet-detection` | classifying transactions as gambling                      |
| `awareness`     | System 2 reframing, nudges                                |
| `gamification`  | streaks, badges, goals                                    |
| `notifications` | delivery of nudges and achievements                       |
