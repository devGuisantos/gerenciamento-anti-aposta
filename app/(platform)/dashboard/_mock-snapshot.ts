/**
 * Demo fixtures. Every amount is in **integer cents**, as `Money` will be.
 *
 * TODO(open-finance, bet-detection, awareness, gamification): replace with
 * `container.getDashboardSnapshot.execute({ userId })` once the modules exist.
 * Nothing here may become business logic — it is display data and nothing else.
 */

export const FIXED_INCOME_ANNUAL_RATE = 0.114;

export const SNAPSHOT = {
  availableBalanceInCents: 423_875,
  connectedAccounts: 2,
  monthlyBetSpendInCents: 184_000,
  monthlyBetTransactions: 11,
  betSpendDeltaInCents: 52_000,
  /** 184000 * (1 + 0.114) — the same maths the awareness module will own. */
  twelveMonthYieldInCents: 204_976,
  betFreeStreakDays: 3,
  bestStreakDays: 11,
  goal: {
    label: 'Guardar R$ 500,00 até o fim do mês',
    targetInCents: 50_000,
    savedInCents: 18_000,
  },
} as const;

export type TransactionRow = {
  readonly id: string;
  readonly when: string;
  readonly merchant: string;
  readonly amountInCents: number;
  readonly isBet: boolean;
  readonly matchedBy?: string;
};

export const RECENT_TRANSACTIONS: readonly TransactionRow[] = [
  {
    id: 't1',
    when: 'Hoje, 21:47',
    merchant: 'Bet365',
    amountInCents: -50_000,
    isBet: true,
    matchedBy: 'MCC 7995',
  },
  {
    id: 't2',
    when: 'Hoje, 19:12',
    merchant: 'Supermercado Pão de Açúcar',
    amountInCents: -18_740,
    isBet: false,
  },
  {
    id: 't3',
    when: 'Ontem, 22:03',
    merchant: 'Betano',
    amountInCents: -15_000,
    isBet: true,
    matchedBy: 'CNPJ cadastrado',
  },
  {
    id: 't4',
    when: 'Ontem, 12:30',
    merchant: 'iFood',
    amountInCents: -5_490,
    isBet: false,
  },
  {
    id: 't5',
    when: '08/09, 09:00',
    merchant: 'Salário',
    amountInCents: 320_000,
    isBet: false,
  },
  {
    id: 't6',
    when: '07/09, 23:41',
    merchant: 'Blaze',
    amountInCents: -20_000,
    isBet: true,
    matchedBy: 'MCC 7995',
  },
  {
    id: 't7',
    when: '06/09, 18:22',
    merchant: 'Uber',
    amountInCents: -2_370,
    isBet: false,
  },
];
