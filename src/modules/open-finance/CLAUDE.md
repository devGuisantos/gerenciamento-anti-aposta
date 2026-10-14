# `open-finance` — DataRecipient

Our platform acting as _instituição receptora_: it requests consent, completes the OAuth 2.0
Authorization Code flow against `sandbox-bank`, and ingests accounts and transactions.

## Where the rules live

**backend-anti-aposta owns this context**: the `Consent` aggregate and its lifecycle, PKCE and
`state`, the code exchange, the encrypted tokens, synchronisation, classification hand-off and
revocation's purge. Read its `src/modules/open-finance/CLAUDE.md`. This module is a client of that
API and holds no rule of its own:

```
infrastructure/
  open-finance-api.ts        # fetchCurrentConsent, requestConsent, completeAuthorisation,
                             # synchroniseConsent, revokeConsent, listConnectedAccounts,
                             # listRecentTransactions
  ledger-api.ts              # listTransactions (statement page + whole-set totals, cursor),
                             # summariseSpendByMonth (the charts)
  pending-consent-cookie.ts  # rememberPendingConsent, takePendingConsent
index.ts
```

## The flow, as the frontend carries it

```
/accounts  "Conectar"  -> connectBankAction -> POST /api/v1/consents
                          (consent id kept in an httpOnly cookie, 10 minutes)
           redirect    -> /sandbox/authorize?response_type=code&…   (the bank's screen)
           "Autorizar" -> decideAuthorisationAction -> POST /sandbox/open-finance/v2/authorize
           redirect    -> /api/open-finance/callback?code&state     (route handler)
                          -> POST /api/v1/consents/{id}/authorisation   (backend exchanges, syncs)
           redirect    -> /accounts?conexao=ativa&novas=N
"Sincronizar" -> synchroniseAction -> POST /api/v1/consents/{id}/synchronisation
"Revogar"     -> revokeAction      -> POST /api/v1/consents/{id}/revocation
```

- **The pending-consent cookie exists because the callback carries only `code` and `state`.** It
  is not a security boundary: the backend checks the `state` against the consent and records
  nothing on a mismatch.
- **The callback passes the outcome on as a code** (`conexao`, `motivo`), never as text. The page
  picks its words from a fixed table, so a crafted link cannot put a message on the screen.
- **Tokens never reach this app.** The bank's tokens are the backend's, encrypted at rest; the only
  token here is the platform session, server-side, as everywhere.
- **Server-only**, like `identity`: a Client Component imports types from here, never values.

## Revocation

Revoking a consent deletes the derived data — transactions, classifications, accounts, the bank's
tokens — not just the token. LGPD art. 18, and the promise the landing page makes. The dialog says
exactly that and nothing more: no warning colour, no guilt, one paragraph and a button.
