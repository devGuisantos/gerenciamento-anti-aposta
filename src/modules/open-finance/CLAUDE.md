# `open-finance` — DataRecipient

Our platform acting as _instituição receptora_: it requests consent, completes the OAuth 2.0
Authorization Code flow against `sandbox-bank`, and ingests accounts and transactions.

## Model

- Aggregates: `Consent` (root — owns scopes and expiry), `ConnectedAccount`, `Transaction`.
- Consent lifecycle: `AWAITING_AUTHORISATION -> AUTHORISED -> (CONSUMED | REJECTED | REVOKED | EXPIRED)`.
  Transitions are aggregate methods, never setters.
- **No transaction may be ingested against a non-`AUTHORISED` consent** — enforced inside the
  aggregate, not in the use case. This is the invariant the whole LGPD story rests on.

## OAuth 2.0 flow

Authorization Code + PKCE. This module holds the client side: it generates the `code_verifier` and
`state`, redirects the user to the sandbox's authorisation screen, handles the callback at
`app/api/open-finance/callback`, exchanges the code for a token, and refreshes it.

- Access and refresh tokens are **encrypted at rest**. They never reach a Client Component, a log
  line, or a URL.
- `state` is verified on callback; a mismatch aborts and records nothing.
- The real ecosystem adds a FAPI profile on top (mTLS with ICP-Brasil certificates,
  `private_key_jwt`, pushed authorisation requests, signed request objects). We reproduce the
  protocol shape, not the certificate infrastructure — state that boundary in the paper's
  limitations rather than implying full compliance.

## Anti-corruption layer

`sandbox-bank` is a foreign system reached over HTTP. Its wire format (`creditDebitType`,
`transactionDateTime`, `merchantCategoryCode`, `payeeDocument`) is translated into our domain
objects by a mapper in `infrastructure/`. Open Finance field names must not leak past that mapper.

## Revocation

Revoking a consent deletes the derived data too — transactions, classifications, nudges — not just
the token. LGPD art. 18, and the promise the landing page makes.

Emits `ConsentAuthorised`, `ConsentRevoked`, `TransactionsIngested`.
