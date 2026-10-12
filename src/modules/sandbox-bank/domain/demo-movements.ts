/**
 * The movements a demonstration books at the simulated bank, one per signal the
 * classifier reads — so the person running the demo can show each policy
 * catching a bet, and a purchase it correctly leaves alone.
 *
 * Synthetic by construction: the CNPJ is the seed's invented operator, the
 * names are invented, and nothing here may look like a real company.
 */

/** ISO 18245 "betting, including lottery tickets, casino gaming chips…". Declared once. */
export const GAMBLING_MCC = 7995;
const GROCERY_MCC = 5411;

/** "Aposta Andorinha", the operator the backend seed registers. Invented. */
const SEEDED_BOOKMAKER_CNPJ = '11222333000181';

export type DemoMovementKind = 'DEBIT' | 'CREDIT';

export type DemoMovement = {
  readonly id: string;
  readonly label: string;
  /** What the classifier should conclude, said plainly for the person demonstrating. */
  readonly expectation: string;
  readonly kind: DemoMovementKind;
  readonly amountInCents: number;
  readonly transactionName: string;
  readonly type: 'PIX' | 'CARTAO' | 'FOLHA_PAGAMENTO';
  readonly merchantCategoryCode: number | null;
  readonly payeeDocument: string | null;
};

export const DEMO_MOVEMENTS: readonly DemoMovement[] = [
  {
    id: 'bet-card',
    label: 'Aposta no cartão',
    expectation: 'Identificada pelo MCC do estabelecimento.',
    kind: 'DEBIT',
    amountInCents: 5000,
    transactionName: 'Aposta Andorinha',
    type: 'CARTAO',
    merchantCategoryCode: GAMBLING_MCC,
    payeeDocument: null,
  },
  {
    id: 'bet-pix',
    label: 'Aposta via PIX',
    expectation: 'Descrição genérica: identificada pelo CNPJ da casa de apostas.',
    kind: 'DEBIT',
    amountInCents: 3000,
    transactionName: 'PIX ENVIADO',
    type: 'PIX',
    merchantCategoryCode: null,
    payeeDocument: SEEDED_BOOKMAKER_CNPJ,
  },
  {
    id: 'bet-keyword',
    label: 'PIX com "aposta" na descrição',
    expectation: 'Identificada só pela descrição, com confiança baixa.',
    kind: 'DEBIT',
    amountInCents: 2000,
    transactionName: 'PIX Aposta esportiva',
    type: 'PIX',
    merchantCategoryCode: null,
    payeeDocument: null,
  },
  {
    id: 'groceries',
    label: 'Mercado no cartão',
    expectation: 'Não é aposta: categoria Mercado.',
    kind: 'DEBIT',
    amountInCents: 18740,
    transactionName: 'Supermercado Pão de Açúcar',
    type: 'CARTAO',
    merchantCategoryCode: GROCERY_MCC,
    payeeDocument: null,
  },
  {
    id: 'salary',
    label: 'Salário',
    expectation: 'Entrada: categoria Renda.',
    kind: 'CREDIT',
    amountInCents: 328000,
    transactionName: 'Salário',
    type: 'FOLHA_PAGAMENTO',
    merchantCategoryCode: null,
    payeeDocument: null,
  },
];
