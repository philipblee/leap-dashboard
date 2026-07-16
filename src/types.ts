export type OptionType = 'CALL' | 'PUT';

export interface OpenPosition {
  id: string;
  ticker: string;
  optionType: OptionType;
  strike: string;
  expiry: string;
  buyDate: string;
  accountName: string;
  accountNumber: string;
  openContracts: number;
  currentValue: number;
  totalCostBasis: number;
  unrealizedPnl: number;
  unrealizedPct: number;
}

export interface ClosedPosition {
  id: string;
  ticker: string;
  optionType: OptionType;
  strike: string;
  expiry: string;
  accountName: string;
  accountNumber: string;
  contractsSold: number;
  costBasis: number;
  buyDate: string;
  proceeds: number;
  sellDate: string;
  realizedPnl: number;
}

export interface HistoryRow {
  date: string;
  davinciValue: string;
  davinciBasis: string;
  davinciUnrealized: string;
  davinciRealized: string;
  cumulativeRealizedLeaps: string;
  cumulativeUnrealizedLeaps: string;
  cumulativeNetDeployed: string;
  qqqChgPct: string;
  spyChgPct: string;
}
