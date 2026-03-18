import { describe, it, expect } from 'vitest';
import {
  parseStrikeFromSymbol,
  isExcludedSector,
  getTickerList,
} from '../utils';
import { TICKER_LISTS, EXCLUDED_TICKERS } from '../constants';

describe('parseStrikeFromSymbol', () => {
  it('parses valid OCC symbol', () => {
    // AAPL260320P00150000 → strike = 150.000
    expect(parseStrikeFromSymbol('AAPL260320P00150000')).toBe(150);
  });

  it('parses fractional strike', () => {
    // SPY260320P00425500 → strike = 425.500
    expect(parseStrikeFromSymbol('SPY260320P00425500')).toBe(425.5);
  });

  it('parses high-price strike', () => {
    // AMZN260320P02000000 → 2000.000
    expect(parseStrikeFromSymbol('AMZN260320P02000000')).toBe(2000);
  });

  it('parses low-price strike', () => {
    // F260320P00005000 → 5.000
    expect(parseStrikeFromSymbol('F260320P00005000')).toBe(5);
  });

  it('returns 0 for malformed symbol (no trailing digits)', () => {
    expect(parseStrikeFromSymbol('INVALID')).toBe(0);
    expect(parseStrikeFromSymbol('')).toBe(0);
  });

  it('returns 0 for symbol with too few trailing digits', () => {
    // Needs exactly 8 trailing digits per the regex
    expect(parseStrikeFromSymbol('AAPL2603P150')).toBe(0);
  });

  it('handles symbol with exactly 8 digits', () => {
    expect(parseStrikeFromSymbol('12345678')).toBe(12345.678);
  });
});

describe('isExcludedSector', () => {
  it('excludes known meme tickers (case-insensitive)', () => {
    expect(isExcludedSector(null, 'GME')).toBe(true);
    expect(isExcludedSector(null, 'gme')).toBe(true);
    expect(isExcludedSector(null, 'AMC')).toBe(true);
    expect(isExcludedSector(null, 'TQQQ')).toBe(true);
  });

  it('excludes by industry (case-insensitive partial match)', () => {
    expect(isExcludedSector('Biotechnology', null)).toBe(true);
    expect(isExcludedSector('biotechnology', null)).toBe(true);
    expect(isExcludedSector('Pharmaceuticals', null)).toBe(false);
    expect(isExcludedSector('Shell Companies', null)).toBe(true);
    expect(
      isExcludedSector('Mortgage Real Estate Investment Trusts (REITs)', null),
    ).toBe(true);
  });

  it('excludes industry containing excluded substring', () => {
    // "Oil & Gas Drilling Services" contains "Oil & Gas Drilling"
    expect(isExcludedSector('Oil & Gas Drilling Services', null)).toBe(true);
  });

  it('returns false for clean stock', () => {
    expect(isExcludedSector('Technology', 'AAPL')).toBe(false);
    expect(isExcludedSector('Banks', 'JPM')).toBe(false);
  });

  it('returns false when both null', () => {
    expect(isExcludedSector(null, null)).toBe(false);
  });

  it('returns false for null industry with clean ticker', () => {
    expect(isExcludedSector(null, 'AAPL')).toBe(false);
  });

  it('returns false for undefined inputs', () => {
    expect(isExcludedSector(undefined, undefined)).toBe(false);
  });

  it('excludes ticker even with clean industry', () => {
    expect(isExcludedSector('Technology', 'COIN')).toBe(true);
  });

  it('does not over-match Integrated Oil & Gas via E&P exclusion', () => {
    expect(isExcludedSector('Integrated Oil & Gas', null)).toBe(false);
  });

  it('confirms excluded ticker count', () => {
    expect(EXCLUDED_TICKERS).toHaveLength(28);
  });
});

describe('getTickerList', () => {
  it('returns wheel_popular list by default', () => {
    const result = getTickerList({
      tickerUniverse: 'wheel_popular',
      customTickers: '',
    });
    expect(result).toEqual(TICKER_LISTS.wheel_popular);
  });

  it('returns sp500_top list', () => {
    const result = getTickerList({
      tickerUniverse: 'sp500_top',
      customTickers: '',
    });
    expect(result).toEqual(TICKER_LISTS.sp500_top);
  });

  it('returns high_dividend list', () => {
    const result = getTickerList({
      tickerUniverse: 'high_dividend',
      customTickers: '',
    });
    expect(result).toEqual(TICKER_LISTS.high_dividend);
  });

  it("returns only custom tickers when universe is 'custom'", () => {
    const result = getTickerList({
      tickerUniverse: 'custom',
      customTickers: 'tsla, pltr, sofi',
    });
    expect(result).toEqual(['TSLA', 'PLTR', 'SOFI']);
  });

  it('uppercases custom tickers', () => {
    const result = getTickerList({
      tickerUniverse: 'custom',
      customTickers: 'aapl,msft',
    });
    expect(result).toEqual(['AAPL', 'MSFT']);
  });

  it('deduplicates custom tickers against universe', () => {
    const result = getTickerList({
      tickerUniverse: 'wheel_popular',
      customTickers: 'AAPL, ZZZ',
    });
    // AAPL already in wheel_popular, only ZZZ should be added
    expect(result).toContain('AAPL');
    expect(result).toContain('ZZZ');
    expect(result.filter((t) => t === 'AAPL')).toHaveLength(1);
  });

  it('caps individual ticker length at 10 chars', () => {
    const result = getTickerList({
      tickerUniverse: 'custom',
      customTickers: 'SHORT, TOOLONGTICKER123',
    });
    expect(result).toEqual(['SHORT']);
  });

  it('splits on comma, semicolon, and whitespace', () => {
    const result = getTickerList({
      tickerUniverse: 'custom',
      customTickers: 'A,B;C D\tE',
    });
    expect(result).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('returns empty array for custom universe with empty tickers', () => {
    const result = getTickerList({
      tickerUniverse: 'custom',
      customTickers: '',
    });
    expect(result).toEqual([]);
  });

  it('combines universe with custom tickers', () => {
    const result = getTickerList({
      tickerUniverse: 'high_dividend',
      customTickers: 'ZZZ, YYY',
    });
    expect(result.slice(0, TICKER_LISTS.high_dividend.length)).toEqual(
      TICKER_LISTS.high_dividend,
    );
    expect(result).toContain('ZZZ');
    expect(result).toContain('YYY');
  });
});
