/**
 * Demo fixtures for the statement screen. Every amount is in **integer cents**.
 *
 * TODO(open-finance, bet-detection): replace with
 * `container.listTransactions.execute({ userId, period })`. Nothing here may
 * become business logic — it is display data and nothing else.
 *
 * This month's entries are authored by hand; every earlier month's betting is
 * generated from `./insights/_mock-monthly-history.ts` so the two fixtures cannot
 * drift. The invariant is **per calendar month**: each month's bets here sum to
 * that month's figure there, and the current month is the R$ 1.840,00 the
 * dashboard hero shows.
 *
 * A rolling window is not a calendar month, so "últimos 30 dias" legitimately
 * reads higher than "neste mês" — it reaches back into the previous month. Both
 * labels say which they mean; do not try to make the two numbers equal.
 *
 * Entries are authored as offsets from a reference day rather than as absolute
 * dates so that "Hoje" and "Ontem" stay true whenever the demo is opened.
 */
import type { LedgerEntry, PaymentMethod } from './_ledger-entry';
import { MONTHLY_HISTORY } from './insights/_mock-monthly-history';

type LedgerEntryDraft = Omit<LedgerEntry, 'id' | 'occurredAt'> & {
  readonly daysAgo: number;
  /** Local time of day, `HH:MM`. */
  readonly at: string;
};

const MILLISECONDS_PER_DAY = 86_400_000;

const DRAFTS: readonly LedgerEntryDraft[] = [
  {
    daysAgo: 0,
    at: '21:47',
    counterparty: 'Bet365',
    category: 'Apostas',
    accountId: 'andorinha-checking',
    method: 'PIX',
    amountInCents: -50_000,
    status: 'SETTLED',
    bet: { matchedBy: 'GAMBLING_MCC', confidence: 'HIGH' },
  },
  {
    daysAgo: 0,
    at: '19:12',
    counterparty: 'Supermercado Pão de Açúcar',
    category: 'Mercado',
    accountId: 'vela-credit',
    method: 'CREDIT_CARD',
    amountInCents: -18_740,
    status: 'SETTLED',
  },
  {
    daysAgo: 0,
    at: '12:38',
    counterparty: 'iFood',
    category: 'Alimentação',
    accountId: 'vela-credit',
    method: 'CREDIT_CARD',
    amountInCents: -3_290,
    status: 'PENDING',
  },
  {
    daysAgo: 1,
    at: '22:03',
    counterparty: 'Betano',
    category: 'Apostas',
    accountId: 'andorinha-checking',
    method: 'PIX',
    amountInCents: -15_000,
    status: 'SETTLED',
    bet: { matchedBy: 'LICENSED_CNPJ', confidence: 'HIGH' },
  },
  {
    daysAgo: 1,
    at: '12:30',
    counterparty: 'iFood',
    category: 'Alimentação',
    accountId: 'vela-credit',
    method: 'CREDIT_CARD',
    amountInCents: -5_490,
    status: 'SETTLED',
  },
  {
    daysAgo: 2,
    at: '23:18',
    counterparty: 'Betano',
    category: 'Apostas',
    accountId: 'andorinha-checking',
    method: 'PIX',
    amountInCents: -10_000,
    status: 'SETTLED',
    bet: { matchedBy: 'LICENSED_CNPJ', confidence: 'HIGH' },
  },
  {
    daysAgo: 2,
    at: '08:55',
    counterparty: 'Uber',
    category: 'Transporte',
    accountId: 'vela-credit',
    method: 'CREDIT_CARD',
    amountInCents: -2_370,
    status: 'SETTLED',
  },
  {
    daysAgo: 3,
    at: '20:41',
    counterparty: 'Bet365',
    category: 'Apostas',
    accountId: 'andorinha-checking',
    method: 'PIX',
    amountInCents: -25_000,
    status: 'SETTLED',
    bet: { matchedBy: 'GAMBLING_MCC', confidence: 'HIGH' },
  },
  {
    daysAgo: 3,
    at: '10:07',
    counterparty: 'Drogasil',
    category: 'Saúde',
    accountId: 'andorinha-checking',
    method: 'DEBIT_CARD',
    amountInCents: -4_180,
    status: 'SETTLED',
  },
  {
    daysAgo: 4,
    at: '23:52',
    counterparty: 'Esportes da Sorte',
    category: 'Apostas',
    accountId: 'andorinha-checking',
    method: 'PIX',
    amountInCents: -7_500,
    status: 'SETTLED',
    bet: { matchedBy: 'DESCRIPTION_KEYWORD', confidence: 'LOW' },
  },
  {
    daysAgo: 4,
    at: '17:20',
    counterparty: 'Posto Ipiranga',
    category: 'Transporte',
    accountId: 'andorinha-checking',
    method: 'DEBIT_CARD',
    amountInCents: -12_000,
    status: 'SETTLED',
  },
  {
    daysAgo: 5,
    at: '21:09',
    counterparty: 'Blaze',
    category: 'Apostas',
    accountId: 'andorinha-checking',
    method: 'PIX',
    amountInCents: -12_000,
    status: 'SETTLED',
    bet: { matchedBy: 'GAMBLING_MCC', confidence: 'HIGH' },
  },
  {
    daysAgo: 5,
    at: '06:00',
    counterparty: 'Netflix',
    category: 'Assinaturas',
    accountId: 'vela-credit',
    method: 'CREDIT_CARD',
    amountInCents: -5_590,
    status: 'SETTLED',
  },
  {
    daysAgo: 6,
    at: '22:34',
    counterparty: 'Betano',
    category: 'Apostas',
    accountId: 'andorinha-checking',
    method: 'PIX',
    amountInCents: -8_000,
    status: 'SETTLED',
    bet: { matchedBy: 'LICENSED_CNPJ', confidence: 'HIGH' },
  },
  {
    daysAgo: 6,
    at: '07:42',
    counterparty: 'Padaria Real',
    category: 'Alimentação',
    accountId: 'andorinha-checking',
    method: 'DEBIT_CARD',
    amountInCents: -1_850,
    status: 'SETTLED',
  },
  {
    daysAgo: 7,
    at: '09:00',
    counterparty: 'Salário',
    category: 'Renda',
    accountId: 'andorinha-checking',
    method: 'TRANSFER',
    amountInCents: 320_000,
    status: 'SETTLED',
  },
  {
    daysAgo: 7,
    at: '09:05',
    counterparty: 'Aluguel',
    category: 'Moradia',
    accountId: 'andorinha-checking',
    method: 'DIRECT_DEBIT',
    amountInCents: -140_000,
    status: 'SETTLED',
  },
  {
    daysAgo: 8,
    at: '23:41',
    counterparty: 'Blaze',
    category: 'Apostas',
    accountId: 'andorinha-checking',
    method: 'PIX',
    amountInCents: -20_000,
    status: 'SETTLED',
    bet: { matchedBy: 'GAMBLING_MCC', confidence: 'HIGH' },
  },
  {
    daysAgo: 8,
    at: '18:22',
    counterparty: 'Uber',
    category: 'Transporte',
    accountId: 'vela-credit',
    method: 'CREDIT_CARD',
    amountInCents: -2_370,
    status: 'SETTLED',
  },
  {
    daysAgo: 9,
    at: '20:15',
    counterparty: 'Bet365',
    category: 'Apostas',
    accountId: 'andorinha-checking',
    method: 'PIX',
    amountInCents: -15_000,
    status: 'SETTLED',
    bet: { matchedBy: 'GAMBLING_MCC', confidence: 'HIGH' },
  },
  {
    daysAgo: 9,
    at: '11:48',
    counterparty: 'Supermercado Extra',
    category: 'Mercado',
    accountId: 'vela-credit',
    method: 'CREDIT_CARD',
    amountInCents: -9_630,
    status: 'SETTLED',
  },
  {
    daysAgo: 10,
    at: '06:00',
    counterparty: 'Spotify',
    category: 'Assinaturas',
    accountId: 'vela-credit',
    method: 'CREDIT_CARD',
    amountInCents: -2_190,
    status: 'SETTLED',
  },
  {
    daysAgo: 11,
    at: '21:57',
    counterparty: 'Sportingbet',
    category: 'Apostas',
    accountId: 'andorinha-checking',
    method: 'PIX',
    amountInCents: -9_500,
    status: 'SETTLED',
    bet: { matchedBy: 'GAMBLING_MCC', confidence: 'HIGH' },
  },
  {
    daysAgo: 11,
    at: '15:03',
    counterparty: 'Amazon',
    category: 'Compras',
    accountId: 'vela-credit',
    method: 'CREDIT_CARD',
    amountInCents: -7_899,
    status: 'SETTLED',
  },
  {
    daysAgo: 12,
    at: '19:26',
    counterparty: 'Uber',
    category: 'Transporte',
    accountId: 'vela-credit',
    method: 'CREDIT_CARD',
    amountInCents: -1_990,
    status: 'SETTLED',
  },
  {
    daysAgo: 13,
    at: '22:11',
    counterparty: 'Betano',
    category: 'Apostas',
    accountId: 'andorinha-checking',
    method: 'PIX',
    amountInCents: -12_000,
    status: 'SETTLED',
    bet: { matchedBy: 'LICENSED_CNPJ', confidence: 'HIGH' },
  },
  {
    daysAgo: 13,
    at: '08:30',
    counterparty: 'Academia SmartFit',
    category: 'Saúde',
    accountId: 'vela-credit',
    method: 'CREDIT_CARD',
    amountInCents: -9_990,
    status: 'SETTLED',
  },
  {
    daysAgo: 14,
    at: '16:44',
    counterparty: 'Pix recebido · João M.',
    category: 'Transferências',
    accountId: 'andorinha-checking',
    method: 'PIX',
    amountInCents: 8_000,
    status: 'SETTLED',
  },
  {
    daysAgo: 20,
    at: '11:12',
    counterparty: 'Supermercado Pão de Açúcar',
    category: 'Mercado',
    accountId: 'vela-credit',
    method: 'CREDIT_CARD',
    amountInCents: -21_050,
    status: 'SETTLED',
  },
  {
    daysAgo: 25,
    at: '09:30',
    counterparty: 'Conta de luz',
    category: 'Moradia',
    accountId: 'andorinha-checking',
    method: 'BOLETO',
    amountInCents: -18_730,
    status: 'SETTLED',
  },
  {
    daysAgo: 28,
    at: '20:05',
    counterparty: 'iFood',
    category: 'Alimentação',
    accountId: 'vela-credit',
    method: 'CREDIT_CARD',
    amountInCents: -4_720,
    status: 'SETTLED',
  },
  {
    daysAgo: 33,
    at: '13:19',
    counterparty: 'Uber',
    category: 'Transporte',
    accountId: 'vela-credit',
    method: 'CREDIT_CARD',
    amountInCents: -3_110,
    status: 'SETTLED',
  },
  {
    daysAgo: 37,
    at: '09:00',
    counterparty: 'Salário',
    category: 'Renda',
    accountId: 'andorinha-checking',
    method: 'TRANSFER',
    amountInCents: 320_000,
    status: 'SETTLED',
  },
  {
    daysAgo: 37,
    at: '09:05',
    counterparty: 'Aluguel',
    category: 'Moradia',
    accountId: 'andorinha-checking',
    method: 'DIRECT_DEBIT',
    amountInCents: -140_000,
    status: 'SETTLED',
  },
  {
    daysAgo: 44,
    at: '10:26',
    counterparty: 'Drogasil',
    category: 'Saúde',
    accountId: 'andorinha-checking',
    method: 'DEBIT_CARD',
    amountInCents: -2_690,
    status: 'SETTLED',
  },
];

export const METHOD_LABELS: Readonly<Record<PaymentMethod, string>> = {
  PIX: 'Pix',
  CREDIT_CARD: 'Cartão de crédito',
  DEBIT_CARD: 'Cartão de débito',
  DIRECT_DEBIT: 'Débito automático',
  TRANSFER: 'Transferência',
  BOLETO: 'Boleto',
};

function toOccurredAt(reference: Date, draft: LedgerEntryDraft): string {
  const day = new Date(reference.getTime() - draft.daysAgo * MILLISECONDS_PER_DAY);
  const [hours, minutes] = draft.at.split(':');
  day.setHours(Number(hours), Number(minutes), 0, 0);
  return day.toISOString();
}

/**
 * Bookmakers the generated history cycles through, with how each would be caught.
 */
const HISTORICAL_BOOKMAKERS = [
  { counterparty: 'Bet365', matchedBy: 'GAMBLING_MCC', confidence: 'HIGH' },
  { counterparty: 'Betano', matchedBy: 'LICENSED_CNPJ', confidence: 'HIGH' },
  { counterparty: 'Blaze', matchedBy: 'GAMBLING_MCC', confidence: 'HIGH' },
  { counterparty: 'Sportingbet', matchedBy: 'GAMBLING_MCC', confidence: 'HIGH' },
] as const satisfies readonly {
  counterparty: string;
  matchedBy: NonNullable<LedgerEntry['bet']>['matchedBy'];
  confidence: NonNullable<LedgerEntry['bet']>['confidence'];
}[];

/** Rounded to R$ 5,00 so the generated amounts look authored rather than computed. */
const AMOUNT_STEP_IN_CENTS = 500;
const MAXIMUM_ENTRIES_PER_MONTH = 6;
const CENTS_PER_ENTRY = 35_000;

/**
 * Splits a month's betting total into plausible individual amounts that sum to it
 * **exactly** — the remainder lands on the first entry rather than being rounded
 * away, because a screen that adds these up must reach the same number the charts
 * show for that month.
 */
function splitMonthTotal(totalInCents: number): readonly number[] {
  const count = Math.min(
    MAXIMUM_ENTRIES_PER_MONTH,
    Math.max(1, Math.round(totalInCents / CENTS_PER_ENTRY)),
  );
  const base = Math.floor(totalInCents / count / AMOUNT_STEP_IN_CENTS) * AMOUNT_STEP_IN_CENTS;
  if (base === 0) return [totalInCents];

  const amounts = Array.from({ length: count }, () => base);
  amounts[0] += totalInCents - base * count;
  return amounts;
}

/**
 * Betting entries for every month before this one, derived from
 * `MONTHLY_HISTORY` so the two fixtures cannot drift: the statement, the charts
 * and the Apostas screen all add up to the same monthly figures.
 *
 * Deterministic on purpose — no clock, no randomness beyond the reference month —
 * so the demo looks identical on every load and in every screenshot. Evening hours
 * because that is the pattern the recent, hand-authored month already shows.
 */
function buildHistoricalBets(reference: Date): readonly LedgerEntry[] {
  return MONTHLY_HISTORY.filter((month) => month.monthsAgo > 0 && month.bets > 0).flatMap((month) =>
    splitMonthTotal(month.bets).map((amountInCents, index) => {
      const bookmaker = HISTORICAL_BOOKMAKERS[index % HISTORICAL_BOOKMAKERS.length];
      const occurredAt = new Date(
        reference.getFullYear(),
        reference.getMonth() - month.monthsAgo,
        Math.min(4 + index * 5, 28),
        20 + (index % 4),
        (index * 13) % 60,
      );

      return {
        id: `history-${month.monthsAgo}-${index}`,
        occurredAt: occurredAt.toISOString(),
        counterparty: bookmaker.counterparty,
        category: 'Apostas',
        accountId: 'andorinha-checking',
        method: 'PIX',
        amountInCents: -amountInCents,
        status: 'SETTLED',
        bet: { matchedBy: bookmaker.matchedBy, confidence: bookmaker.confidence },
      } satisfies LedgerEntry;
    }),
  );
}

/** Newest first — the order every statement screen shows. */
export function buildLedgerEntries(reference: Date): readonly LedgerEntry[] {
  const authored = DRAFTS.map((draft, index) => ({
    id: `entry-${index + 1}`,
    occurredAt: toOccurredAt(reference, draft),
    counterparty: draft.counterparty,
    category: draft.category,
    accountId: draft.accountId,
    method: draft.method,
    amountInCents: draft.amountInCents,
    status: draft.status,
    ...(draft.bet ? { bet: draft.bet } : {}),
  }));

  return [...authored, ...buildHistoricalBets(reference)].toSorted((left, right) =>
    right.occurredAt.localeCompare(left.occurredAt),
  );
}
