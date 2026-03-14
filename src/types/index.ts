// ---- Domain Types for WheelScan ----

/** Weight configuration for wheel score components */
export interface WeightConfig {
  weightPremium: number;
  weightLiquidity: number;
  weightStability: number;
  weightFundamentals: number;
}

/** All filter fields matching getFilters() return shape */
export interface FilterState extends WeightConfig {
  minPrice: number;
  maxPrice: number;
  minMktCap: number;
  maxMktCap: number;
  minVolume: number;
  maxPE: number;
  /** NaN when user leaves field blank (parseFloat of empty string) */
  maxDebtEquity: number | undefined;
  /** NaN when user leaves field blank */
  minNetMargin: number | undefined;
  /** NaN when user leaves field blank */
  minSalesGrowth: number | undefined;
  /** NaN when user leaves field blank */
  minROE: number | undefined;
  tickerUniverse: string;
  customTickers: string;
  minPremium: number;
  maxBP: number;
  /** Select-bound string value, e.g. "30", "45" */
  targetDTE: number;
  /** Select-bound string value, e.g. "0.30", "0.20" */
  targetDelta: number;
  minIVRank: number;
  maxIVRank: number;
  requireDividends: boolean;
  aboveSMA200: boolean;
  excludeEarnings: boolean;
  requireWeeklies: boolean;
  excludeRiskySectors: boolean;
}

/** Full stock result from screener scan */
export interface StockResult {
  symbol: string;
  name: string;
  price: number;
  prevClose: number;
  dayChange: number;
  dayHigh: number;
  dayLow: number;
  marketCap: number;
  pe: number | null;
  forwardPE: number | null;
  beta: number | null;
  dividendYield: number;
  avgVolume: number;
  avgVolume3M: number;
  twoHundredDayAvg: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  fiftyTwoWeekHighDate: string;
  fiftyTwoWeekLowDate: string;
  roe: number | null;
  revenueGrowth: number | null;
  netMargin: number | null;
  currentRatio: number | null;
  debtToEquity: number | null;
  industry?: string;
  exchange?: string;
  source: string;

  // Analyst data (populated after enrichment)
  analystBuy?: number;
  analystHold?: number;
  analystSell?: number;
  analystBuyPct?: number | null;

  // Computed wheel metrics (populated by computeWheelMetrics)
  buyingPower?: number;
  earningsDays?: number | null;
  earningsDate?: string | null;
  ivRank?: number;
  premiumYield?: number;
  sma200Status?: "above" | "below" | "n/a";
  sma200Pct?: number | null;

  // Computed scores (populated by computeWheelScore)
  premiumScore?: number;
  liquidityScore?: number;
  stabilityScore?: number;
  fundamentalsScore?: number;
  wheelScore?: number;
}

/** Individual put option contract from chain panel */
export interface PutOption {
  strike: number;
  bid: number;
  ask: number;
  mid: number;
  spread: number;
  spreadPct: number;
  volume: number;
  oi: number;
  delta: number | null;
  iv: number | null;
  last: number;
  premYield: number;
  itm: boolean;
  dte: number;
  putScore: number;
  rec: string;

  // Score breakdown (populated by scorePuts)
  spreadScore?: number;
  liquidityScore?: number;
  premScore?: number;
  deltaScore?: number;
  ivScore?: number;
}

/** Preset filter configuration */
export interface Preset {
  minPrice: number;
  maxPrice: number;
  minMktCap: number;
  maxMktCap: number;
  minVolume: number;
  maxPE: number;
  maxDebtEquity: number;
  minNetMargin: number;
  minSalesGrowth: number;
  minROE: number;
  minPremium: number;
  maxBP: number;
  /** String because it's bound to a <select> value */
  targetDTE: string;
  /** String because it's bound to a <select> value */
  targetDelta: string;
  minIVRank: number;
  maxIVRank: number;
  dividends: boolean;
  sma200: boolean;
  earnings: boolean;
  weeklies: boolean;
  riskySectors: boolean;
  weightPremium: number;
  weightLiquidity: number;
  weightStability: number;
  weightFundamentals: number;
}

/** Scan progress state */
export interface ScanProgress {
  running: boolean;
  /** 0-1 */
  progress: number;
  currentTicker: string;
  scannedCount: number;
  totalCount: number;
  candidateCount: number;
  error: string | null;
}

/** Option chain data for a symbol */
export interface ChainData {
  symbol: string;
  expirations: string[];
  selectedExpiry: string;
  puts: PutOption[];
}

/** API key state with per-key status */
export interface ApiKeys {
  finnhubKey: string;
  alpacaKeyId: string;
  alpacaSecretKey: string;
  massiveKey: string;
  status: {
    finnhub: "set" | "not_set";
    alpaca: "set" | "not_set";
    massive: "set" | "not_set";
  };
}
