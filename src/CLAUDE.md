# `src/` — domain code

`src/modules/` holds the bounded contexts, `src/shared/` the shared kernel, and `src/container.ts`
is the composition root — the only file that wires implementations to ports.

## Tactical patterns

- **Aggregates** extend `AggregateRoot`, expose behaviour (`consent.authorise(scopes, clock)`),
  and record events through `this.addEvent(...)`. No public setters. An aggregate with only
  getters is a data structure, not a model — that is the anemic-domain smell.
- **Value objects** are immutable, validate in a private constructor, and are built by a static
  factory returning `Result<T>`: `Money.fromCents(1250)`, `Cnpj.create('...')`. Equality is by
  value (`equals()`), never by reference.
- **Money is never a `number`.** `Money` holds integer cents plus a currency (`BRL`). Prisma
  columns are `Int` cents or `Decimal` — never `Float`. Formatting happens only in the UI, via
  `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- **Never call `new Date()` in domain or application code.** Inject the `Clock` port. Store UTC,
  render in `America/Sao_Paulo`.
- **IDs** are `UniqueEntityId` (UUID v7) from an injected `IdGenerator`, never from the database,
  so an aggregate is valid before it is persisted.
- **Repositories** are collection-like (`save`, `findById`, `findByUserId`), declared as
  interfaces in `domain/` and implemented in `infrastructure/`. They accept and return **domain
  objects only** — a Prisma type crossing that boundary is a leak. Mapping lives in a mapper.
- **Use cases** are one class with one public `execute(input): Promise<Result<Output>>`. A use
  case never calls another use case; extract a domain service instead.
- **`Result` over exceptions** for expected outcomes (invalid CNPJ, expired consent, forbidden
  access). Throw only for programmer errors and unrecoverable infrastructure failures.

## Testing

- Domain and application layers: unit tests with in-memory fake repositories, **no database**, and
  no mocking framework for code you own.
- Infrastructure: integration tests against a real Postgres (Docker), truncated between tests.
- Test names state behaviour: `it('refuses ingestion when the consent has expired')`.
- Arrange with builders (`aConsent().authorised().build()`), not 40-line object literals.
- Every bug fix starts with a failing test that reproduces it.
- Non-negotiable coverage: every aggregate invariant, every detection policy, and the compound
  interest calculation.
