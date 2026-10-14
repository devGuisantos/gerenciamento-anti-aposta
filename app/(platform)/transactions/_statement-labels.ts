/**
 * The Portuguese words for the enums the backend sends. The enum is the
 * contract; the label is ours, in one place, so two screens cannot disagree
 * about what a category is called.
 */
import type { PaymentMethod, TransactionCategory } from '@modules/open-finance';

export const CATEGORY_LABELS: Readonly<Record<TransactionCategory, string>> = {
  BETS: 'Apostas',
  GROCERIES: 'Mercado',
  DINING: 'Alimentação',
  TRANSPORT: 'Transporte',
  HOUSING: 'Moradia',
  HEALTH: 'Saúde',
  SUBSCRIPTIONS: 'Assinaturas',
  SHOPPING: 'Compras',
  INCOME: 'Renda',
  TRANSFER: 'Transferências',
  OTHER: 'Outros',
};

export const METHOD_LABELS: Readonly<Record<PaymentMethod, string>> = {
  PIX: 'Pix',
  CREDIT_CARD: 'Cartão de crédito',
  DEBIT_CARD: 'Cartão de débito',
  DIRECT_DEBIT: 'Débito automático',
  TRANSFER: 'Transferência',
  BOLETO: 'Boleto',
};
