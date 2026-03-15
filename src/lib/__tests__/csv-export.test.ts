import { describe, it, expect } from "vitest";
import { buildCSVContent } from "../csv-export";
import type { StockResult } from "@/types";

/** Minimal valid StockResult for testing. All optional/computed fields left undefined. */
function makeResult(overrides: Partial<StockResult> = {}): StockResult {
  return {
    symbol: "AAPL",
    name: "Apple Inc",
    price: 178.72,
    prevClose: 177.0,
    dayChange: 0.97,
    dayHigh: 179.5,
    dayLow: 177.1,
    marketCap: 2_800_000_000_000,
    pe: 28.5,
    forwardPE: 26.1,
    beta: 1.24,
    dividendYield: 0.52,
    avgVolume: 58_200_000,
    avgVolume3M: 55_000_000,
    twoHundredDayAvg: 170.0,
    fiftyTwoWeekHigh: 199.62,
    fiftyTwoWeekLow: 124.17,
    fiftyTwoWeekHighDate: "2024-07-16",
    fiftyTwoWeekLowDate: "2023-01-03",
    roe: 15.3,
    revenueGrowth: 0.08,
    netMargin: 25.3,
    currentRatio: 1.1,
    debtToEquity: 1.8,
    industry: "Consumer Electronics",
    source: "finnhub",
    // Computed fields
    buyingPower: 3574,
    earningsDays: 45,
    earningsDate: "2024-04-25",
    ivRank: 32,
    premiumYield: 2.8,
    sma200Status: "above" as const,
    sma200Pct: 5.1,
    analystBuyPct: 78,
    premiumScore: 72,
    liquidityScore: 85,
    stabilityScore: 68,
    fundamentalsScore: 77,
    wheelScore: 75.3,
    ...overrides,
  };
}

describe("buildCSVContent", () => {
  it("produces correct 24-column header row", () => {
    const csv = buildCSVContent([]);
    const headerLine = csv.split("\n")[0];
    const headers = headerLine.split(",");

    expect(headers).toHaveLength(24);
    expect(headers[0]).toBe("Symbol");
    expect(headers[1]).toBe("Name");
    expect(headers[2]).toBe("Industry");
    expect(headers[3]).toBe("Price");
    expect(headers[4]).toBe("Market Cap ($B)");
    expect(headers[5]).toBe("Avg Volume (M)");
    expect(headers[6]).toBe("P/E");
    expect(headers[7]).toBe("Beta");
    expect(headers[8]).toBe("Div Yield %");
    expect(headers[9]).toBe("IV Rank");
    expect(headers[10]).toBe("Premium Yield %");
    expect(headers[11]).toBe("Buying Power");
    expect(headers[12]).toBe("200 SMA Status");
    expect(headers[13]).toBe("200 SMA %");
    expect(headers[14]).toBe("Earnings Days");
    expect(headers[15]).toBe("Earnings Date");
    expect(headers[16]).toBe("Analyst Buy%");
    expect(headers[17]).toBe("ROE");
    expect(headers[18]).toBe("Net Margin");
    expect(headers[19]).toBe("Wheel Score");
    expect(headers[20]).toBe("Premium Score");
    expect(headers[21]).toBe("Liquidity Score");
    expect(headers[22]).toBe("Stability Score");
    expect(headers[23]).toBe("Fundamentals Score");
  });

  it("formats numeric values to match vanilla precision", () => {
    const csv = buildCSVContent([makeResult()]);
    const dataLine = csv.split("\n")[1];
    const cells = parseCSVRow(dataLine);

    // Price: 2dp
    expect(cells[3]).toBe("178.72");
    // Market Cap in $B: 2dp
    expect(cells[4]).toBe("2800.00");
    // Avg Volume: 1dp (raw number, not divided — vanilla does .toFixed(1))
    expect(cells[5]).toBe("58200000.0");
    // P/E: 1dp
    expect(cells[6]).toBe("28.5");
    // Beta: 2dp
    expect(cells[7]).toBe("1.24");
    // Div Yield: 2dp
    expect(cells[8]).toBe("0.52");
    // IV Rank: raw number
    expect(cells[9]).toBe("32");
    // Premium Yield: 1dp
    expect(cells[10]).toBe("2.8");
    // Buying Power: 0dp
    expect(cells[11]).toBe("3574");
    // ROE: 1dp
    expect(cells[17]).toBe("15.3");
    // Net Margin: 1dp
    expect(cells[18]).toBe("25.3");
  });

  it("double-quotes strings and escapes embedded quotes", () => {
    const csv = buildCSVContent([
      makeResult({
        name: 'Acme Corp, "Best" Inc',
        industry: "Oil, Gas & Fuel",
      }),
    ]);
    const dataLine = csv.split("\n")[1];
    const cells = parseCSVRow(dataLine);

    // Name with comma and embedded quotes
    expect(cells[1]).toBe('Acme Corp, "Best" Inc');
    // Industry with comma
    expect(cells[2]).toBe("Oil, Gas & Fuel");
  });

  it("produces empty strings for null/missing fields — never 'null' or 'undefined'", () => {
    const csv = buildCSVContent([
      makeResult({
        pe: null,
        beta: null,
        roe: null,
        netMargin: null,
        earningsDays: null,
        earningsDate: null,
        analystBuyPct: null,
        sma200Pct: null,
        premiumYield: undefined,
        buyingPower: undefined,
        wheelScore: undefined,
        premiumScore: undefined,
        liquidityScore: undefined,
        stabilityScore: undefined,
        fundamentalsScore: undefined,
      }),
    ]);
    const dataLine = csv.split("\n")[1];

    // Must never contain the literal strings "null" or "undefined"
    expect(dataLine).not.toContain("null");
    expect(dataLine).not.toContain("undefined");

    const cells = parseCSVRow(dataLine);
    // P/E null → empty
    expect(cells[6]).toBe("");
    // Beta null → empty
    expect(cells[7]).toBe("");
    // Earnings Days null → empty
    expect(cells[14]).toBe("");
    // Earnings Date null → empty
    expect(cells[15]).toBe("");
    // Analyst Buy% null → empty
    expect(cells[16]).toBe("");
    // ROE null → empty
    expect(cells[17]).toBe("");
    // Net Margin null → empty
    expect(cells[18]).toBe("");
    // Score fields undefined → empty
    expect(cells[19]).toBe("");
    expect(cells[20]).toBe("");
  });

  it("produces header row only for empty results array", () => {
    const csv = buildCSVContent([]);
    const lines = csv.split("\n");

    expect(lines).toHaveLength(1);
    expect(lines[0].split(",")).toHaveLength(24);
  });

  it("handles zero dividendYield as '0' (matching vanilla)", () => {
    const csv = buildCSVContent([makeResult({ dividendYield: 0 })]);
    const cells = parseCSVRow(csv.split("\n")[1]);
    expect(cells[8]).toBe("0");
  });

  it("handles zero/negative marketCap as empty", () => {
    const csv = buildCSVContent([makeResult({ marketCap: 0 })]);
    const cells = parseCSVRow(csv.split("\n")[1]);
    expect(cells[4]).toBe("");
  });

  it("handles zero avgVolume as empty", () => {
    const csv = buildCSVContent([makeResult({ avgVolume: 0 })]);
    const cells = parseCSVRow(csv.split("\n")[1]);
    expect(cells[5]).toBe("");
  });

  it("includes sma200Status string value", () => {
    const csv = buildCSVContent([makeResult({ sma200Status: "below" })]);
    const cells = parseCSVRow(csv.split("\n")[1]);
    expect(cells[12]).toBe("below");
  });

  it("handles multiple rows correctly", () => {
    const csv = buildCSVContent([
      makeResult({ symbol: "AAPL" }),
      makeResult({ symbol: "MSFT", price: 420.55 }),
    ]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3); // header + 2 data rows

    const row2 = parseCSVRow(lines[2]);
    expect(row2[0]).toBe("MSFT");
    expect(row2[3]).toBe("420.55");
  });
});

// ---- CSV row parser that respects double-quoted fields ----

function parseCSVRow(line: string): string[] {
  const cells: string[] = [];
  let i = 0;

  while (i <= line.length) {
    if (i === line.length) {
      cells.push("");
      break;
    }

    if (line[i] === '"') {
      // Quoted field — find matching close quote
      let value = "";
      i++; // skip opening quote
      while (i < line.length) {
        if (line[i] === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            // Escaped quote
            value += '"';
            i += 2;
          } else {
            // End of quoted field
            i++; // skip closing quote
            break;
          }
        } else {
          value += line[i];
          i++;
        }
      }
      cells.push(value);
      // Skip comma after quoted field
      if (i < line.length && line[i] === ",") i++;
    } else {
      // Unquoted field
      const commaIdx = line.indexOf(",", i);
      if (commaIdx === -1) {
        cells.push(line.substring(i));
        break;
      } else {
        cells.push(line.substring(i, commaIdx));
        i = commaIdx + 1;
      }
    }
  }

  return cells;
}
