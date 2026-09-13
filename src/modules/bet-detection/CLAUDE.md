# `bet-detection` — classifying gambling transactions

Almost pure domain: given a transaction, decide whether it is a bet and **say why**.

## Policy chain

`BetClassifier` runs ordered policies, each returning a confidence and its reason:

1. `MccPolicy` — MCC 7995, the international code for betting and casinos. Highest confidence.
2. `CnpjPolicy` — payee CNPJ present in the registry of licensed operators.
3. `DescriptionPolicy` — normalised keyword matching over the transaction description (case-folded,
   accent-stripped). Lowest confidence; it is a fallback, not the primary signal.

Output is `BetClassification { isBet, confidence, matchedBy }` — **never a bare boolean**. The user
deserves to know why a transaction was flagged, and the paper needs the explanation to discuss
precision.

## Rules

- `GAMBLING_MCC = 7995` is declared once, here. It appears nowhere else in the codebase.
- The bookmaker registry is data, not code: a seeded table keyed by CNPJ, updatable without a
  deploy.
- Policies are pure functions of the transaction — no I/O, no clock, no repository. That is what
  makes them exhaustively unit-testable, which is required coverage.
- False positives are worse than false negatives here: telling someone they gambled when they did
  not destroys trust in every other number the app shows. When policies disagree, report the lower
  confidence and let the UI say it is uncertain.
- Adding a policy means adding its tests in the same commit, including a negative case.

Emits `BetTransactionDetected`.
