@AGENTS.md

# anti-aposta

Personal-finance platform that discourages online gambling (BETs) by detecting betting
transactions through a simulated Open Finance Brasil Phase 2 API, reframing the amount spent into
future-yield equivalents (Kahneman's System 2 activation) and sustaining behaviour change through
Self-Determination-Theory gamification. Undergraduate thesis (TCC) by Guilherme de Sousa Santos
and João Marcelo Pedrini Ramalho de Campos.

This file holds only what applies **everywhere**. Detailed rules live next to the code they
govern — see the map at the bottom.

---

## Stack of record

| Concern     | Choice                                                             |
| ----------- | ------------------------------------------------------------------ |
| Framework   | Next.js 16.3.5, App Router, React 19 (Server Components by default) |
| Language    | TypeScript, `strict: true`, no `any`                                |
| Styling     | Tailwind CSS v4                                                     |
| Components  | shadcn/ui (`radix-nova` style, Radix base, Lucide icons)            |
| Persistence | PostgreSQL via Prisma ORM                                           |
| Validation  | Zod, at boundaries only                                             |
| Realtime    | Server-Sent Events                                                  |
| Tests       | Vitest (unit/integration), Playwright (e2e)                         |

**Divergence from the TCC text (deliberate — document it in the paper):** the paper proposes
Express + React/Vite + microservices + WebSocket. This repository implements a **modular monolith
with strictly isolated bounded contexts** on Next.js. Each context is deployable-in-principle: it
owns its data, exposes a narrow public API, and talks to other contexts only through domain
events — the standard "modular monolith as a precursor to microservices" argument. Do not
silently re-add Express or a second runtime.

---

## The layer rule (non-negotiable)

Dependencies point **inward only**:

```
app/ (Next.js delivery)  ->  application/  ->  domain/
                   infrastructure/  ->  application/ + domain/
```

- `domain/` — pure TypeScript. **Zero** imports from `next/*`, `react`, `@prisma/client`, `zod`,
  or another module's internals. If it cannot run in a bare Node REPL, it does not belong here.
- `application/` — use cases. Imports `domain/` and port _interfaces_. Never imports
  `infrastructure/`, never touches `Request`/`Response`/`cookies()`/`headers()`.
- `infrastructure/` — Prisma repositories, HTTP clients, event bus, clock, crypto. The only layer
  allowed to know a database exists.
- `app/` — **adapters only**: parse input, resolve the use case from the composition root, map the
  result to a response. A file under `app/` containing an `if` about business meaning is a bug.

Path aliases: `@/*` → repo root, `@modules/*` → `src/modules/*`, `@shared/*` → `src/shared/*`.
Never use a relative import that climbs more than one level.

---

## Ubiquitous language

Code identifiers are **English**. Brazilian regulatory/domain proper nouns keep their Portuguese
form because translating them loses meaning (`Cnpj`, `Mcc`, `Pix`, `Cdi`, `Selic`). Use this
glossary in code, tests, and commit messages — never invent synonyms.

| PT (TCC / domain)           | Code term         | Meaning                                                        |
| --------------------------- | ----------------- | -------------------------------------------------------------- |
| Consentimento               | `Consent`         | User authorisation to share financial data; has scope + expiry |
| Instituição transmissora    | `DataHolder`      | Institution that holds the data (here: our sandbox)            |
| Instituição receptora       | `DataRecipient`   | Our platform, consuming the shared data                        |
| Transação                   | `Transaction`     | A single financial movement                                    |
| Transação de aposta         | `BetTransaction`  | Transaction classified as gambling                             |
| Casa de apostas             | `Bookmaker`       | Betting operator, identified by CNPJ/MCC                       |
| Reenquadramento (reframing) | `Reframing`       | Translating an amount into future-yield equivalents            |
| Alerta / nudge              | `AwarenessNudge`  | The System 2 intervention shown to the user                    |
| Meta                        | `Goal`            | User-defined savings target                                    |
| Sequência sem apostas       | `Streak`          | Consecutive bet-free days                                      |
| Conquista                   | `Badge`           | Awarded milestone                                              |
| Rendimento equivalente      | `YieldEquivalent` | What the amount would earn in fixed income                     |

Forbidden vocabulary: `data`, `info`, `manager`, `helper`, `util`, `handler` (except Next.js route
handlers), `process`, `do`. Name things after the domain, not after their mechanics.

---

## Clean code rules

1. A function does one thing and stays under ~20 lines. If a comment is needed to separate
   sections, extract a function named after the section.
2. Guard clauses over nested `if`. Maximum nesting depth: 2.
3. No boolean parameters — split the function or pass a named options object.
4. Comments explain **why**, never **what**. Dead code is deleted, not commented out.
5. No abbreviations (`txn`, `usr`, `cfg`) and no type prefixes (`ITransaction`, `TUser`).
   Interfaces are named for their role: `TransactionRepository`.
6. `readonly` by default on fields and array parameters; prefer immutable updates.
7. `any` is banned. Use `unknown` plus a Zod parse at the boundary. No `!` assertions.
8. Exhaustive `switch` over unions with `default: assertNever(value)`.
9. Files `kebab-case.ts`; classes and types `PascalCase`; functions and variables `camelCase`;
   constants `SCREAMING_SNAKE_CASE`. One aggregate or use case per file, named after the file.
10. No barrel files except a module's `index.ts`. No `utils/` dumping ground.
11. Magic numbers and strings become named constants. `7995` appears once, as `GAMBLING_MCC`.

---

## Data, privacy, and ethics

This product serves people in financial distress. These are product requirements, not suggestions.

- **Consent first.** No financial data is read, stored, or derived without an `AUTHORISED`
  consent. Revocation deletes the derived data, not just the token (LGPD art. 18).
- **Never log PII.** No CPF, CNPJ, full account numbers, access tokens, or transaction
  descriptions in logs — log IDs. Use the structured logger in `@shared/infrastructure`;
  `console.log` fails review.
- **Secrets** live in environment variables, validated once at boot by a Zod schema in
  `src/shared/infrastructure/env.ts`. Access tokens are encrypted at rest.
- **Data minimisation.** Ingest only what detection and reframing actually need.
- **The platform never blocks a transaction** — it cannot, and must not claim it can. Copy stays
  accurate about retrospective awareness.
- **No shaming, no dark patterns.** Nudges are factual and non-judgemental, never moralising. No
  fake urgency, no manufactured loss aversion, and no engagement mechanic that mimics a gambling
  loop — no random rewards, no near-miss animations.
- **Escalation path.** Where usage suggests compulsive behaviour, surface support resources
  (CVV 188, responsible-gambling services) instead of more gamification.
- **Accessibility.** The audience spans low financial and digital literacy: plain Portuguese,
  WCAG AA contrast, real semantic HTML, everything reachable by keyboard.

---

## Workflow

```bash
npm run dev            # next dev
npm run build          # must pass before any commit
npm run lint           # eslint
npx tsc --noEmit       # type check
npx prisma migrate dev # schema changes (never hand-edit a generated migration)
```

- Branches: `feat/<context>-<slug>`, `fix/<context>-<slug>`.
- Conventional commits scoped by bounded context: `feat(bet-detection): add CNPJ policy`.
- The Next.js block in `AGENTS.md` is regenerated by `next dev` — commit it with your work rather
  than reverting it.
- Never commit `.env`, real bank data, or real CPF/CNPJ values. Seed data is synthetic.

**Definition of done:** domain rules live in the domain layer with tests; `npm run build`,
`npx tsc --noEmit` and `npm run lint` are clean; no layer violation or cross-module deep import;
no PII in logs, no `any`, no `console.log`; Portuguese copy is accurate about what the platform
can and cannot do.

---

## Where the detailed rules live

Each file below is loaded automatically when you work on files in that directory. Add new
guidance to the **nearest** file; promote it here only when it truly applies everywhere.

| Scope                       | File                                    |
| --------------------------- | --------------------------------------- |
| Delivery layer, UI, palette | `app/CLAUDE.md`                         |
| Landing / public pages      | `app/(marketing)/CLAUDE.md`             |
| Login, register             | `app/(auth)/CLAUDE.md`                  |
| Authenticated app, sidebar  | `app/(platform)/CLAUDE.md`              |
| Vendored shadcn primitives  | `components/ui/CLAUDE.md`               |
| Tactical DDD + testing      | `src/CLAUDE.md`                         |
| Module anatomy, event map   | `src/modules/CLAUDE.md`                 |
| Shared kernel               | `src/shared/CLAUDE.md`                  |
| One per bounded context     | `src/modules/<context>/CLAUDE.md`       |
