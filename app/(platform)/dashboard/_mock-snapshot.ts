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
  /* The streak figures used to live here, and they were wrong: this fixture
     claimed three bet-free days while the transactions below show a bet today.
     They are derived from the ledger now — see
     `../achievements/_streak-view.ts`. A counter kept by hand beside the
     transactions it counts is a counter that disagrees with them, and the one the
     user would believe is the counter. */
  /* The goal lives in `../goals/_mock-goals.ts` and its progress is measured
     against the monthly totals, never written down here. An earlier version held
     a `savedInCents` figure, which was a number nothing could verify: the
     platform reads a bank statement, and it cannot see money somebody meant to
     put aside. A progress bar filled from a figure like that is a progress bar
     that lies. */
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
