# `sandbox-bank` — the simulated DataHolder, as the person sees it

The _instituição transmissora_ is a fake bank implementing the Open Finance Brasil Phase 2 surface,
because production access needs certificates and institutional enrolment the project cannot
obtain — objective B of the TCC.

**The bank itself lives in backend-anti-aposta** (`src/modules/sandbox-bank`, mounted under
`/sandbox`), which owns its ledger, its consents, its codes and tokens, and its Open Finance
surface (`/token`, `/consents`, `/accounts`, `/accounts/{id}/transactions`). Read that module's
CLAUDE.md for the protocol, the invariants and the simplifications to state in the paper.

## What this module is

The bank's **front end for the person** — nothing else:

```
infrastructure/sandbox-bank-api.ts   # describeAuthorisationRequest, decideAuthorisation,
                                     # listCustomerBankAccounts, bookLedgerEntryFor
domain/demo-movements.ts             # the ready-made demo movements; GAMBLING_MCC, once
index.ts
```

It never calls the bank's Open Finance surface. That is the DataRecipient's job, and the
DataRecipient is backend-anti-aposta's `open-finance` context, which reaches the bank over HTTP.
This app is not a second DataRecipient — if a call to `/token` or `/accounts` ever appears here,
the demonstration has been short-circuited.

## Rules

- **Server-only.** The API client reads `env` and the session cookie. A Client Component imports
  **types only** from this module; values it needs (`DEMO_MOVEMENTS`, `ENTRY_TYPES`,
  `GAMBLING_MCC`) arrive as props from a Server Component. Importing a value pulled `next/headers`
  into the browser bundle once, and `next build` refused it.
- **The platform session stands in for the bank's login.** The backend identifies the bank's
  customer by it. State that limitation in the paper rather than imply a separate bank login.
- **Booked movements reach the platform only through a synchronisation.** `bookLedgerEntryFor`
  writes to the bank and nowhere else; the bank then sends the platform a notice and the platform
  synchronises at once, over the protocol. The routes are the demonstration console's (`/admin`),
  name the customer in the path, and do not exist in production (the backend never mounts them) —
  there they answer 404. `listCustomerBankAccounts` opens nothing for an id the bank never saw.
- Demo data is synthetic: invented names, the seed's invented CNPJ. Never a real CPF, CNPJ or
  account number.
