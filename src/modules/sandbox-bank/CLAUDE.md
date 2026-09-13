# `sandbox-bank` — simulated DataHolder

The _instituição transmissora_: a fake bank implementing the Open Finance Brasil Phase 2 surface so
the platform has something real to talk to. Chosen because production access requires certificates
and institutional enrolment the project cannot obtain — this is objective B of the TCC, and its
faithfulness is what makes the demonstration credible.

## Contract first

The internals may be as simple as you like; the **HTTP contract must mirror the specification**:

- `POST /consents`, `GET /authorize`, `POST /token`, `GET /accounts`,
  `GET /accounts/{accountId}/transactions`, exposed under `app/sandbox/open-finance/v2/`.
- Response envelopes carry `data`, `links` and `meta`. Field names follow the OAS:
  `creditDebitType`, `transactionDateTime`, `merchantCategoryCode`, `payeeDocument`,
  `transactionAmount` as a string with two decimals.
- Resource endpoints require `Authorization: Bearer` and reject an expired or mismatched scope.
- The authorisation screen is a real screen: the user picks which accounts to share and confirms.
  Screenshot it for the paper.

## Rules

- **Never imported by another module.** `open-finance` reaches it with `fetch`. If you find
  yourself importing a type from here, the demonstration has been short-circuited.
- Seed data is synthetic and plausible: Brazilian merchant names, PIX and card entries, salary
  credits, and bookmaker payments carrying MCC 7995 and real-format (but fictional) CNPJs.
- Never put a real CPF, CNPJ, or account number in the seed.
- The seed must include the edge cases the classifier has to survive: a bookmaker with a generic
  description, a non-betting merchant whose name contains "bet", and a refund from a bookmaker.
