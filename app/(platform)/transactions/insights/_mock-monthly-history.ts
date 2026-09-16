/**
 * Twelve months of category totals for the charts. Every amount is in **integer
 * cents**, and every expense is stored as a positive magnitude — the category
 * says which direction it points, so the charts never have to strip a sign.
 *
 * TODO(open-finance, bet-detection): replace with
 * `container.summariseSpendByMonth.execute({ userId, months })`. Nothing here may
 * become business logic — it is display data and nothing else.
 *
 * Consistency, which matters more than realism in a demo:
 * - The newest month's `bets` is R$ 1.840,00 — the same figure the dashboard hero
 *   and the statement screen show. Change one and change all three.
 * - `income` is a steady salary plus the occasional extra, so the "entradas" chart
 *   is flat enough that the betting chart's shape reads as the anomaly it is.
 *
 * Months are offsets back from the current month rather than fixed dates, so the
 * range stays plausible whenever the demo is opened.
 */

export type MonthlyTotals = {
  /** 0 is the current month, 1 the month before it, and so on. */
  readonly monthsAgo: number;
  readonly income: number;
  readonly bets: number;
  readonly groceries: number;
  readonly dining: number;
  readonly transport: number;
  readonly housing: number;
  readonly health: number;
  readonly subscriptions: number;
  readonly shopping: number;
};

/** Newest first. */
export const MONTHLY_HISTORY: readonly MonthlyTotals[] = [
  {
    monthsAgo: 0,
    income: 320_000,
    bets: 184_000,
    groceries: 49_420,
    dining: 15_350,
    transport: 18_730,
    housing: 158_730,
    health: 16_860,
    subscriptions: 7_780,
    shopping: 7_899,
  },
  {
    monthsAgo: 1,
    income: 328_000,
    bets: 156_500,
    groceries: 52_180,
    dining: 21_940,
    transport: 22_410,
    housing: 158_730,
    health: 12_690,
    subscriptions: 7_780,
    shopping: 13_250,
  },
  {
    monthsAgo: 2,
    income: 320_000,
    bets: 121_000,
    groceries: 47_900,
    dining: 19_600,
    transport: 20_050,
    housing: 152_400,
    health: 9_990,
    subscriptions: 7_780,
    shopping: 4_500,
  },
  {
    monthsAgo: 3,
    income: 320_000,
    bets: 98_500,
    groceries: 51_300,
    dining: 24_180,
    transport: 19_870,
    housing: 152_400,
    health: 18_400,
    subscriptions: 7_780,
    shopping: 22_900,
  },
  {
    monthsAgo: 4,
    income: 345_000,
    bets: 76_000,
    groceries: 46_750,
    dining: 17_320,
    transport: 21_640,
    housing: 152_400,
    health: 9_990,
    subscriptions: 5_590,
    shopping: 8_700,
  },
  {
    monthsAgo: 5,
    income: 320_000,
    bets: 62_500,
    groceries: 44_180,
    dining: 20_050,
    transport: 18_200,
    housing: 152_400,
    health: 14_300,
    subscriptions: 5_590,
    shopping: 6_400,
  },
  {
    monthsAgo: 6,
    income: 320_000,
    bets: 41_000,
    groceries: 48_600,
    dining: 22_700,
    transport: 17_450,
    housing: 146_800,
    health: 9_990,
    subscriptions: 5_590,
    shopping: 11_300,
  },
  {
    monthsAgo: 7,
    income: 318_000,
    bets: 28_500,
    groceries: 43_900,
    dining: 18_640,
    transport: 16_980,
    housing: 146_800,
    health: 21_500,
    subscriptions: 5_590,
    shopping: 5_200,
  },
  {
    monthsAgo: 8,
    income: 320_000,
    bets: 17_000,
    groceries: 45_270,
    dining: 16_100,
    transport: 19_300,
    housing: 146_800,
    health: 9_990,
    subscriptions: 5_590,
    shopping: 9_850,
  },
  {
    monthsAgo: 9,
    income: 352_000,
    bets: 9_500,
    groceries: 50_400,
    dining: 26_380,
    transport: 20_760,
    housing: 146_800,
    health: 12_200,
    subscriptions: 5_590,
    shopping: 31_400,
  },
  {
    monthsAgo: 10,
    income: 318_000,
    bets: 4_000,
    groceries: 42_150,
    dining: 15_900,
    transport: 15_840,
    housing: 141_200,
    health: 9_990,
    subscriptions: 4_990,
    shopping: 7_100,
  },
  {
    monthsAgo: 11,
    income: 318_000,
    bets: 0,
    groceries: 44_800,
    dining: 19_250,
    transport: 16_300,
    housing: 141_200,
    health: 16_700,
    subscriptions: 4_990,
    shopping: 12_600,
  },
];
