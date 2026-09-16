/**
 * The shape the statement screen renders. It mirrors what
 * `open-finance`'s `Transaction` plus `bet-detection`'s `BetClassification`
 * will expose, so replacing the fixture is a change of source, not of shape.
 */
import type { AccountId } from './_accounts';


/** Why `bet-detection` flagged the entry. Never a bare boolean — the user is owed the reason. */
export type DetectionReason = 'GAMBLING_MCC' | 'LICENSED_CNPJ' | 'DESCRIPTION_KEYWORD';

/** Lowest confidence of the policies that agreed, as the classifier reports it. */
export type DetectionConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type BetClassification = {
  readonly matchedBy: DetectionReason;
  readonly confidence: DetectionConfidence;
};

export type PaymentMethod =
  | 'PIX'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'DIRECT_DEBIT'
  | 'TRANSFER'
  | 'BOLETO';

/** A settled entry is final; a pending one may still change value or be reversed. */
export type LedgerEntryStatus = 'SETTLED' | 'PENDING';

export type LedgerEntry = {
  readonly id: string;
  /** ISO 8601. Negative `amountInCents` is a debit, positive a credit. */
  readonly occurredAt: string;
  readonly counterparty: string;
  readonly category: string;
  readonly accountId: AccountId;
  readonly method: PaymentMethod;
  readonly amountInCents: number;
  readonly status: LedgerEntryStatus;
  readonly bet?: BetClassification;
};
