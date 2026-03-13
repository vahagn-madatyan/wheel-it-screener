/* ==============================
   WheelScan — Finnhub-Only Wheel Strategy Screener
   ============================== */

// ---- State ----
let allResults = [];
let filteredResults = [];
let currentSort = { key: "wheelScore", dir: "desc" };
let isRunning = false;
let earningsMap = {}; // symbol -> { date, daysAway }

// ---- Curated Ticker Lists ----
const TICKER_LISTS = {
  wheel_popular: [
    "AAPL","MSFT","AMZN","GOOGL","META","NVDA","AMD","TSLA","JPM","BAC",
    "WFC","C","GS","V","MA","DIS","NFLX","PYPL","SQ","INTC",
    "CSCO","QCOM","MU","F","GM","T","VZ","PFE","JNJ","MRK",
    "ABBV","BMY","UNH","CVS","XOM","CVX","COP","OXY","ET","KO",
    "PEP","MCD","WMT","TGT","HD","LOW","NKE","SBUX","PLTR","SOFI"
  ],
  sp500_top: [
    "AAPL","MSFT","AMZN","NVDA","GOOGL","META","TSLA","BRK.B","LLY","UNH",
    "JPM","V","XOM","AVGO","MA","JNJ","PG","HD","COST","MRK",
    "ABBV","CVX","PEP","KO","ADBE","WMT","CRM","BAC","MCD","CSCO",
    "TMO","ACN","ABT","LIN","ORCL","DHR","NKE","NFLX","AMD","TXN",
    "CMCSA","PM","NEE","LOW","UPS","RTX","HON","INTC","AMGN","IBM"
  ],
  high_dividend: [
    "T","VZ","MO","PM","XOM","CVX","COP","OXY","ET","EPD",
    "KMI","WMB","ABBV","PFE","BMY","JNJ","MRK","KO","PEP","CSCO",
    "IBM","INTC","F","GM","WFC","BAC","USB","KEY","SCHW","MMM"
  ]
};

// ---- Theme Toggle ----
(function () {
  const t = document.querySelector("[data-theme-toggle]");
  const r = document.documentElement;
  let d = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  r.setAttribute("data-theme", d);
  if (t) {
    t.addEventListener("click", () => {
      d = d === "dark" ? "light" : "dark";
      r.setAttribute("data-theme", d);
      t.setAttribute("aria-label", "Switch to " + (d === "dark" ? "light" : "dark") + " mode");
      t.innerHTML =
        d === "dark"
          ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
          : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    });
  }
})();

// ---- UI Helpers ----
function toggleSection(id) {
  const content = document.getElementById(id);
  const btn = content.previousElementSibling;
  content.classList.toggle("collapsed");
  btn.classList.toggle("collapsed");
}

function toggleSwitch(el) {
  el.classList.toggle("active");
}

function toggleMobileSidebar() {
  document.getElementById("sidebar").classList.toggle("mobile-hidden");
}

function updateApiStatus() {
  const fk = document.getElementById("finnhub-key").value.trim();
  const fs = document.getElementById("finnhub-status");
  fs.className = "api-status " + (fk ? "connected" : "disconnected");
  fs.textContent = fk ? "Set" : "Not Set";

  const ak = document.getElementById("alpaca-key-id").value.trim();
  const aks = document.getElementById("alpaca-key-status");
  aks.className = "api-status " + (ak ? "connected" : "disconnected");
  aks.textContent = ak ? "Set" : "Not Set";

  const as_ = document.getElementById("alpaca-secret-key").value.trim();
  const ass = document.getElementById("alpaca-secret-status");
  ass.className = "api-status " + (as_ ? "connected" : "disconnected");
  ass.textContent = as_ ? "Set" : "Not Set";
}

function setStatus(text, type) {
  const dot = document.getElementById("status-dot");
  const txt = document.getElementById("status-text");
  dot.className = "status-dot" + (type === "active" ? " active" : type === "error" ? " error" : "");
  txt.textContent = text;
}

function showLoading(show) {
  document.getElementById("loading-skeleton").style.display = show ? "block" : "none";
  document.getElementById("empty-state").style.display = "none";
  document.getElementById("results-table").style.display = show ? "none" : (filteredResults.length ? "table" : "none");
}

// ---- Excluded sectors (from strategy doc) ----
const EXCLUDED_INDUSTRIES = [
  "Biotechnology", "Pharmaceuticals",
  "Blank Checks", "Shell Companies",
  "Savings Institutions", "Thrifts & Mortgage Finance",
  "Oil & Gas Exploration & Production", "Oil & Gas Drilling",
  "Mortgage Real Estate Investment Trusts (REITs)",
  "Mortgage Finance",
];

// Known meme / high-risk tickers to exclude
const EXCLUDED_TICKERS = [
  "GME","AMC","BBBY","BB","WISH","CLOV","SPCE","RIDE","WKHS","SNDL",
  "MARA","RIOT","COIN","MSTR","HUT","BITF","BITO","GBTC",
  "TQQQ","SQQQ","UVXY","SVXY","SPXS","SPXL","LABU","LABD","JNUG","JDST",
];

function isExcludedSector(industry, symbol) {
  if (!industry && !symbol) return false;
  if (symbol && EXCLUDED_TICKERS.includes(symbol.toUpperCase())) return true;
  if (!industry) return false;
  var ind = industry.toLowerCase();
  return EXCLUDED_INDUSTRIES.some(function (ex) { return ind.includes(ex.toLowerCase()); });
}

// ---- Get filter values ----
function getFilters() {
  return {
    minPrice: parseFloat(document.getElementById("min-price").value) || 0,
    maxPrice: parseFloat(document.getElementById("max-price").value) || 9999,
    minMktCap: parseFloat(document.getElementById("min-mktcap").value) || 0,
    maxMktCap: parseFloat(document.getElementById("max-mktcap").value) || 99999,
    minVolume: (parseFloat(document.getElementById("min-volume").value) || 0),
    maxPE: parseFloat(document.getElementById("max-pe").value) || 999,
    maxDebtEquity: parseFloat(document.getElementById("max-debt-equity").value),
    minNetMargin: parseFloat(document.getElementById("min-net-margin").value),
    minSalesGrowth: parseFloat(document.getElementById("min-sales-growth").value),
    minROE: parseFloat(document.getElementById("min-roe").value),
    tickerUniverse: document.getElementById("ticker-universe").value,
    customTickers: document.getElementById("custom-tickers").value,
    minPremium: parseFloat(document.getElementById("min-premium").value) || 0,
    maxBP: parseFloat(document.getElementById("max-bp").value) || 99999,
    targetDTE: parseInt(document.getElementById("target-dte").value) || 30,
    targetDelta: parseFloat(document.getElementById("target-delta").value) || 0.30,
    minIVRank: parseFloat(document.getElementById("min-iv-rank").value) || 0,
    maxIVRank: parseFloat(document.getElementById("max-iv-rank").value) || 100,
    requireDividends: document.getElementById("toggle-dividends").classList.contains("active"),
    aboveSMA200: document.getElementById("toggle-sma200").classList.contains("active"),
    excludeEarnings: document.getElementById("toggle-earnings").classList.contains("active"),
    requireWeeklies: document.getElementById("toggle-weeklies").classList.contains("active"),
    excludeRiskySectors: document.getElementById("toggle-risky-sectors").classList.contains("active"),
    weightPremium: parseInt(document.getElementById("weight-premium").value) || 30,
    weightLiquidity: parseInt(document.getElementById("weight-liquidity").value) || 20,
    weightStability: parseInt(document.getElementById("weight-stability").value) || 25,
    weightFundamentals: parseInt(document.getElementById("weight-fundamentals").value) || 25,
  };
}

// ---- Presets ----
const PRESETS = {
  finviz_cut2: {
    minPrice: 10, maxPrice: 50, minMktCap: 2, maxMktCap: 2000,
    minVolume: 2, maxPE: 60, maxDebtEquity: 1, minNetMargin: 0,
    minSalesGrowth: 5, minROE: 0, minPremium: 12, maxBP: 10000,
    targetDTE: "30", targetDelta: "0.30", minIVRank: 30, maxIVRank: 80,
    dividends: false, sma200: true, earnings: true, weeklies: false, riskySectors: true,
    weightPremium: 30, weightLiquidity: 20, weightStability: 25, weightFundamentals: 25,
  },
  conservative: {
    minPrice: 20, maxPrice: 100, minMktCap: 10, maxMktCap: 2000,
    minVolume: 5, maxPE: 30, maxDebtEquity: 0.5, minNetMargin: 10,
    minSalesGrowth: 0, minROE: 10, minPremium: 8, maxBP: 15000,
    targetDTE: "45", targetDelta: "0.20", minIVRank: 20, maxIVRank: 60,
    dividends: true, sma200: true, earnings: true, weeklies: false, riskySectors: true,
    weightPremium: 20, weightLiquidity: 25, weightStability: 30, weightFundamentals: 25,
  },
  aggressive: {
    minPrice: 5, maxPrice: 200, minMktCap: 1, maxMktCap: 2000,
    minVolume: 0.5, maxPE: 100, maxDebtEquity: 2, minNetMargin: -50,
    minSalesGrowth: -50, minROE: -50, minPremium: 15, maxBP: 20000,
    targetDTE: "30", targetDelta: "0.35", minIVRank: 30, maxIVRank: 100,
    dividends: false, sma200: false, earnings: true, weeklies: false, riskySectors: false,
    weightPremium: 40, weightLiquidity: 20, weightStability: 15, weightFundamentals: 25,
  },
};

function applyPreset(name) {
  var p = PRESETS[name];
  if (!p) return; // "custom" — do nothing
  document.getElementById("min-price").value = p.minPrice;
  document.getElementById("max-price").value = p.maxPrice;
  document.getElementById("min-mktcap").value = p.minMktCap;
  document.getElementById("max-mktcap").value = p.maxMktCap;
  document.getElementById("min-volume").value = p.minVolume;
  document.getElementById("max-pe").value = p.maxPE;
  document.getElementById("max-debt-equity").value = p.maxDebtEquity;
  document.getElementById("min-net-margin").value = p.minNetMargin;
  document.getElementById("min-sales-growth").value = p.minSalesGrowth;
  document.getElementById("min-roe").value = p.minROE;
  document.getElementById("min-premium").value = p.minPremium;
  document.getElementById("max-bp").value = p.maxBP;
  document.getElementById("target-dte").value = p.targetDTE;
  document.getElementById("target-delta").value = p.targetDelta;
  document.getElementById("min-iv-rank").value = p.minIVRank;
  document.getElementById("max-iv-rank").value = p.maxIVRank;
  document.getElementById("weight-premium").value = p.weightPremium;
  document.getElementById("weight-liquidity").value = p.weightLiquidity;
  document.getElementById("weight-stability").value = p.weightStability;
  document.getElementById("weight-fundamentals").value = p.weightFundamentals;
  setToggle("toggle-dividends", p.dividends);
  setToggle("toggle-sma200", p.sma200);
  setToggle("toggle-earnings", p.earnings);
  setToggle("toggle-weeklies", p.weeklies);
  setToggle("toggle-risky-sectors", p.riskySectors);
}

function setToggle(id, active) {
  var el = document.getElementById(id);
  if (active) el.classList.add("active");
  else el.classList.remove("active");
}

// ---- Reset ----
function resetDefaults() {
  document.getElementById("filter-preset").value = "finviz_cut2";
  applyPreset("finviz_cut2");
  document.getElementById("ticker-universe").value = "wheel_popular";
  document.getElementById("custom-tickers").value = "";
}

// ---- Finnhub API ----
async function fetchFinnhub(endpoint, params) {
  const key = document.getElementById("finnhub-key").value.trim();
  if (!key) throw new Error("Finnhub API key not set");
  const url = new URL("https://finnhub.io/api/v1" + endpoint);
  url.searchParams.set("token", key);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString());
  if (res.status === 429) throw new Error("RATE_LIMIT");
  if (!res.ok) throw new Error("Finnhub " + endpoint + ": " + res.status);
  return res.json();
}

// ---- Rate limiter: Finnhub free = 30 calls/sec ----
let callQueue = [];
let callsThisSecond = 0;
let lastResetTime = Date.now();

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function throttledFinnhub(endpoint, params) {
  const now = Date.now();
  if (now - lastResetTime >= 1000) {
    callsThisSecond = 0;
    lastResetTime = now;
  }
  if (callsThisSecond >= 28) { // leave 2 calls buffer
    const waitMs = 1000 - (now - lastResetTime) + 50;
    await delay(waitMs);
    callsThisSecond = 0;
    lastResetTime = Date.now();
  }
  callsThisSecond++;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fetchFinnhub(endpoint, params);
    } catch (e) {
      if (e.message === "RATE_LIMIT" && attempt < 2) {
        await delay(1200);
        callsThisSecond = 0;
        lastResetTime = Date.now();
      } else {
        throw e;
      }
    }
  }
}

// ---- Build ticker list ----
function getTickerList(filters) {
  let tickers = [];

  if (filters.tickerUniverse !== "custom") {
    tickers = [...(TICKER_LISTS[filters.tickerUniverse] || TICKER_LISTS.wheel_popular)];
  }

  // Add custom tickers
  if (filters.customTickers) {
    const custom = filters.customTickers
      .toUpperCase()
      .split(/[,;\s]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && t.length <= 10);
    custom.forEach((t) => {
      if (!tickers.includes(t)) tickers.push(t);
    });
  }

  return tickers;
}

// ---- MAIN SCREENER FLOW ----
async function runScreener() {
  if (isRunning) return;

  const finnhubKey = document.getElementById("finnhub-key").value.trim();
  if (!finnhubKey) {
    setStatus("Error: Please enter your Finnhub API key", "error");
    return;
  }

  isRunning = true;
  allResults = [];
  filteredResults = [];
  earningsMap = {};

  const runBtn = document.getElementById("run-btn");
  runBtn.innerHTML = '<span class="spinner"></span> Scanning...';
  runBtn.classList.add("loading");
  runBtn.disabled = true;
  showLoading(true);
  setStatus("Starting scan...", "active");

  const filters = getFilters();
  const tickers = getTickerList(filters);

  if (tickers.length === 0) {
    setStatus("Error: No tickers selected. Choose a universe or add custom tickers.", "error");
    showLoading(false);
    document.getElementById("empty-state").style.display = "block";
    resetRunButton();
    return;
  }

  try {
    // Step 1: Fetch earnings calendar (single API call for date range)
    setStatus("Fetching earnings calendar...", "active");
    try {
      const now = new Date();
      const fromDate = now.toISOString().slice(0, 10);
      const futureDate = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const earnings = await throttledFinnhub("/calendar/earnings", { from: fromDate, to: futureDate });
      if (earnings && earnings.earningsCalendar) {
        earnings.earningsCalendar.forEach((e) => {
          if (e.symbol && e.date) {
            const daysAway = Math.ceil((new Date(e.date) - now) / (1000 * 60 * 60 * 24));
            if (!earningsMap[e.symbol] || daysAway < earningsMap[e.symbol].daysAway) {
              earningsMap[e.symbol] = { date: e.date, daysAway: Math.max(0, daysAway) };
            }
          }
        });
      }
    } catch (e) {
      console.warn("Earnings calendar error:", e.message);
    }

    // Step 2: Fetch quote + profile + metrics for each ticker
    setStatus("Scanning " + tickers.length + " tickers...", "active");
    let scannedCount = 0;
    const candidates = [];

    for (let i = 0; i < tickers.length; i++) {
      const symbol = tickers[i];

      try {
        // Parallel fetch: quote + metrics (profile2 adds too many calls, use metrics instead)
        const [quote, metrics] = await Promise.all([
          throttledFinnhub("/quote", { symbol }),
          throttledFinnhub("/stock/metric", { symbol, metric: "all" }),
        ]);

        if (!quote || quote.c <= 0) {
          scannedCount++;
          continue;
        }

        const m = (metrics && metrics.metric) || {};

        const stock = {
          symbol,
          name: (metrics && metrics.symbol) || symbol, // will be enriched
          price: quote.c,
          prevClose: quote.pc || 0,
          dayChange: quote.dp || 0,
          dayHigh: quote.h || 0,
          dayLow: quote.l || 0,
          marketCap: m.marketCapitalization ? m.marketCapitalization * 1e6 : 0,  // Finnhub returns in millions
          pe: m.peBasicExclExtraTTM || m.peNormalizedAnnual || null,
          forwardPE: m.forwardPE || null,
          beta: m.beta || null,
          dividendYield: m.dividendYieldIndicatedAnnual || 0, // already in %
          avgVolume: m["10DayAverageTradingVolume"] || 0, // in millions of shares
          avgVolume3M: m["3MonthAverageTradingVolume"] || 0,
          twoHundredDayAvg: m["200DayMovingAverage"] || 0,
          fiftyTwoWeekHigh: m["52WeekHigh"] || 0,
          fiftyTwoWeekLow: m["52WeekLow"] || 0,
          fiftyTwoWeekHighDate: m["52WeekHighDate"] || "",
          fiftyTwoWeekLowDate: m["52WeekLowDate"] || "",
          roe: m.roeTTM || null,
          revenueGrowth: m.revenueGrowthQuarterlyYoy || null,
          netMargin: m.netProfitMarginTTM || null,
          currentRatio: m.currentRatioQuarterly || null,
          debtToEquity: m.totalDebtToEquityQuarterly || null,
          source: "finnhub",
        };

        // Quick price filter — skip early to save API calls
        if (stock.price < filters.minPrice || stock.price > filters.maxPrice) {
          scannedCount++;
          if (i % 5 === 0) setStatus("Scanning " + (i + 1) + "/" + tickers.length + "...", "active");
          continue;
        }

        candidates.push(stock);
        scannedCount++;

        if (i % 5 === 0) {
          setStatus("Scanning " + (i + 1) + "/" + tickers.length + " — " + candidates.length + " candidates...", "active");
        }
      } catch (e) {
        console.warn("Error fetching", symbol, e.message);
        scannedCount++;
      }
    }

    if (candidates.length === 0) {
      setStatus("No stocks passed initial price filter. Adjust filters and retry.", "error");
      showLoading(false);
      document.getElementById("empty-state").style.display = "block";
      resetRunButton();
      return;
    }

    // Step 3: Enrich names with profile2 for top candidates (batch)
    setStatus("Enriching " + candidates.length + " candidates...", "active");
    for (let i = 0; i < candidates.length; i++) {
      try {
        const profile = await throttledFinnhub("/stock/profile2", { symbol: candidates[i].symbol });
        if (profile && profile.name) {
          candidates[i].name = profile.name;
          candidates[i].industry = profile.finnhubIndustry || "";
          candidates[i].exchange = profile.exchange || "";
          // Update marketCap if we got it from profile
          if (profile.marketCapitalization) {
            candidates[i].marketCap = profile.marketCapitalization * 1e6;
          }
        }
      } catch (e) {
        // Non-critical — name stays as symbol
      }
      if (i % 8 === 0) setStatus("Enriching " + (i + 1) + "/" + candidates.length + "...", "active");
    }

    // Step 4: Fetch analyst recommendations for top candidates
    setStatus("Fetching analyst ratings...", "active");
    for (let i = 0; i < candidates.length; i++) {
      try {
        const recs = await throttledFinnhub("/stock/recommendation", { symbol: candidates[i].symbol });
        if (recs && recs.length > 0) {
          const latest = recs[0];
          candidates[i].analystBuy = (latest.strongBuy || 0) + (latest.buy || 0);
          candidates[i].analystHold = latest.hold || 0;
          candidates[i].analystSell = (latest.sell || 0) + (latest.strongSell || 0);
          const total = candidates[i].analystBuy + candidates[i].analystHold + candidates[i].analystSell;
          candidates[i].analystBuyPct = total > 0 ? Math.round((candidates[i].analystBuy / total) * 100) : null;
        }
      } catch (e) {
        // Non-critical
      }
      if (i % 8 === 0) setStatus("Ratings " + (i + 1) + "/" + candidates.length + "...", "active");
    }

    // Step 5: Apply all filters and compute wheel metrics
    setStatus("Applying filters and scoring...", "active");
    let enriched = [];

    for (const stock of candidates) {
      // Market cap filter
      if (stock.marketCap > 0) {
        const capB = stock.marketCap / 1e9;
        if (capB < filters.minMktCap || capB > filters.maxMktCap) continue;
      }

      // Volume filter (avgVolume from Finnhub is in millions)
      if (stock.avgVolume > 0 && stock.avgVolume < filters.minVolume) continue;

      // P/E filter
      if (stock.pe !== null && stock.pe > 0 && stock.pe > filters.maxPE) continue;

      // D/E filter
      if (!isNaN(filters.maxDebtEquity) && stock.debtToEquity !== null && stock.debtToEquity > filters.maxDebtEquity) continue;

      // Net Margin filter
      if (!isNaN(filters.minNetMargin) && stock.netMargin !== null && stock.netMargin < filters.minNetMargin) continue;

      // Sales Growth filter (revenueGrowth is quarterly YoY %)
      if (!isNaN(filters.minSalesGrowth) && stock.revenueGrowth !== null && stock.revenueGrowth < filters.minSalesGrowth) continue;

      // ROE filter
      if (!isNaN(filters.minROE) && stock.roe !== null && stock.roe < filters.minROE) continue;

      // Sector exclusion filter
      if (filters.excludeRiskySectors && isExcludedSector(stock.industry, stock.symbol)) continue;

      // Compute wheel metrics
      computeWheelMetrics(stock, filters);

      // Buying power filter
      if (stock.buyingPower > filters.maxBP) continue;

      // Dividend filter
      if (filters.requireDividends && stock.dividendYield <= 0) continue;

      // 200 SMA filter
      if (filters.aboveSMA200 && stock.twoHundredDayAvg > 0 && stock.price < stock.twoHundredDayAvg) continue;

      // Earnings proximity filter
      if (filters.excludeEarnings && stock.earningsDays !== null && stock.earningsDays <= 14 && stock.earningsDays >= 0) continue;

      // IV rank filter
      if (stock.ivRank < filters.minIVRank || stock.ivRank > filters.maxIVRank) continue;

      // Compute wheel score
      computeWheelScore(stock, filters);

      enriched.push(stock);
    }

    // Sort by wheel score
    enriched.sort((a, b) => b.wheelScore - a.wheelScore);

    allResults = candidates; // all that passed price filter
    filteredResults = enriched;

    renderResults();
    updateKPIs(scannedCount);
    setStatus(
      "Done — " + enriched.length + " wheel candidates from " + scannedCount + " scanned",
      enriched.length > 0 ? "active" : "error"
    );
  } catch (e) {
    console.error("Screener error:", e);
    setStatus("Error: " + e.message, "error");
    showLoading(false);
    document.getElementById("empty-state").style.display = "block";
  }

  resetRunButton();
}

function resetRunButton() {
  isRunning = false;
  const runBtn = document.getElementById("run-btn");
  runBtn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Run Screener';
  runBtn.classList.remove("loading");
  runBtn.disabled = false;
}

// ---- Wheel Metrics ----
function computeWheelMetrics(stock, filters) {
  // Buying power = strike * 100 (approximate as price * 100)
  stock.buyingPower = stock.price * 100;

  // Earnings days from calendar
  const earning = earningsMap[stock.symbol];
  stock.earningsDays = earning ? earning.daysAway : null;
  stock.earningsDate = earning ? earning.date : null;

  // Estimate IV Rank from 52-week range and beta
  // IV Rank ~= how high current IV is relative to 52w range
  const h = stock.fiftyTwoWeekHigh;
  const l = stock.fiftyTwoWeekLow;
  if (h > 0 && l > 0 && h > l) {
    const rangePercent = ((h - l) / h) * 100;
    const pricePosition = ((stock.price - l) / (h - l)); // 0=at low, 1=at high
    // If price is near lows, IV is likely elevated (fear)
    const positionFactor = Math.max(0, (1 - pricePosition)) * 40;
    const betaFactor = stock.beta ? Math.min(Math.max(stock.beta, 0.3), 3) * 20 : 25;
    const rangeFactor = Math.min(rangePercent * 0.8, 50);
    stock.ivRank = Math.min(100, Math.max(0, Math.round(positionFactor + betaFactor + rangeFactor * 0.3)));
  } else {
    stock.ivRank = 30; // default
  }

  // Estimate annualized premium yield
  // Based on IV rank, delta, and DTE
  const ivFactor = stock.ivRank / 100;
  const deltaFactor = filters.targetDelta / 0.30;
  // Rough estimate: ATM put at 30 delta, 30 DTE, moderate IV ~= 1.5-3% of strike
  const monthlyYield = ivFactor * 2.5 * deltaFactor; // % per month
  stock.premiumYield = Math.round(monthlyYield * (365 / filters.targetDTE) * 10) / 10;
  stock.premiumYield = Math.max(0, Math.min(100, stock.premiumYield));

  // 200 SMA status
  if (stock.twoHundredDayAvg > 0) {
    stock.sma200Status = stock.price >= stock.twoHundredDayAvg ? "above" : "below";
    stock.sma200Pct = Math.round(((stock.price - stock.twoHundredDayAvg) / stock.twoHundredDayAvg) * 1000) / 10;
  } else {
    stock.sma200Status = "n/a";
    stock.sma200Pct = null;
  }

  return stock;
}

function computeWheelScore(stock, filters) {
  const totalWeight = filters.weightPremium + filters.weightLiquidity + filters.weightStability + filters.weightFundamentals;

  // Premium score (0-100)
  const premiumScore = Math.min(100, (stock.premiumYield / 35) * 100);

  // Liquidity score (0-100) — avgVolume in millions
  const vol = stock.avgVolume || stock.avgVolume3M || 0;
  const liquidityScore = Math.min(100, (vol / 20) * 100); // 20M+ shares/day = 100

  // Stability score (0-100)
  let stabilityScore = 50;
  if (stock.beta !== null) {
    // Ideal beta for wheel: 0.5-1.3
    if (stock.beta >= 0.5 && stock.beta <= 1.3) {
      stabilityScore = 85;
    } else if (stock.beta < 0.5) {
      stabilityScore = 70; // low vol, less premium
    } else {
      stabilityScore = Math.max(10, 85 - (stock.beta - 1.3) * 35);
    }
  }
  // Factor in 52-week range position
  if (stock.fiftyTwoWeekHigh > 0 && stock.fiftyTwoWeekLow > 0) {
    const pos = (stock.price - stock.fiftyTwoWeekLow) / (stock.fiftyTwoWeekHigh - stock.fiftyTwoWeekLow);
    // Sweet spot: 30-80% of range (not at extremes)
    if (pos >= 0.3 && pos <= 0.8) {
      stabilityScore = stabilityScore * 0.6 + 80 * 0.4;
    } else if (pos < 0.3) {
      stabilityScore = stabilityScore * 0.6 + 40 * 0.4; // near 52w low = risky
    } else {
      stabilityScore = stabilityScore * 0.6 + 55 * 0.4; // near 52w high = less upside buffer
    }
  }

  // Fundamentals score (0-100)
  let fundScore = 50;
  if (stock.pe !== null && stock.pe > 0) {
    fundScore = stock.pe < 12 ? 95 : stock.pe < 20 ? 80 : stock.pe < 30 ? 60 : stock.pe < 45 ? 40 : 20;
  }
  if (stock.dividendYield > 0) fundScore += Math.min(15, stock.dividendYield * 3);
  if (stock.roe && stock.roe > 15) fundScore += 8;
  if (stock.analystBuyPct !== null && stock.analystBuyPct > 60) fundScore += 7;
  if (stock.netMargin && stock.netMargin > 15) fundScore += 5;
  fundScore = Math.min(100, Math.round(fundScore));

  stock.premiumScore = Math.round(premiumScore);
  stock.liquidityScore = Math.round(liquidityScore);
  stock.stabilityScore = Math.round(stabilityScore);
  stock.fundamentalsScore = fundScore;

  stock.wheelScore = Math.round(
    (premiumScore * filters.weightPremium +
      liquidityScore * filters.weightLiquidity +
      stabilityScore * filters.weightStability +
      fundScore * filters.weightFundamentals) /
      totalWeight
  );

  return stock;
}

// ---- Render ----
function renderResults() {
  showLoading(false);

  if (filteredResults.length === 0) {
    document.getElementById("results-table").style.display = "none";
    document.getElementById("empty-state").style.display = "block";
    document.getElementById("results-count").textContent = "";
    return;
  }

  document.getElementById("results-table").style.display = "table";
  document.getElementById("empty-state").style.display = "none";
  document.getElementById("results-count").textContent = "(" + filteredResults.length + ")";

  const tbody = document.getElementById("results-body");
  tbody.innerHTML = "";

  var tipFilters = getFilters();
  filteredResults.forEach((s) => {
    const tr = document.createElement("tr");

    const scoreColor = s.wheelScore >= 70 ? "score-high" : s.wheelScore >= 45 ? "score-medium" : "score-low";
    const scoreBarColor =
      s.wheelScore >= 70
        ? "var(--color-primary)"
        : s.wheelScore >= 45
          ? "var(--color-warning)"
          : "var(--color-error)";

    let sma200Badge;
    if (s.sma200Status === "above") {
      sma200Badge = '<span class="badge badge-pass" title="' + (s.sma200Pct !== null ? formatNum(s.sma200Pct, 1) + '% above 200 SMA' : 'Above 200 SMA') + '">+' + (s.sma200Pct !== null ? formatNum(s.sma200Pct, 1) + '%' : '') + '</span>';
    } else if (s.sma200Status === "below") {
      sma200Badge = '<span class="badge badge-fail" title="' + (s.sma200Pct !== null ? formatNum(Math.abs(s.sma200Pct), 1) + '% below 200 SMA' : 'Below 200 SMA') + '">' + (s.sma200Pct !== null ? formatNum(s.sma200Pct, 1) + '%' : 'Below') + '</span>';
    } else {
      sma200Badge = '<span class="badge badge-warn" title="200 SMA not available from Finnhub for this ticker. Consider Alpha Vantage SMA endpoint as supplementary.">N/A</span>';
    }

    let earningsBadge;
    if (s.earningsDays === null) {
      earningsBadge = '<span class="badge badge-warn" title="No earnings date found in next 120 days. Check nasdaq.com/market-activity/earnings">N/A</span>';
    } else if (s.earningsDays <= 14) {
      earningsBadge = '<span class="badge badge-fail" title="Earnings on ' + escapeHtml(s.earningsDate || '') + '">' + s.earningsDays + "d</span>";
    } else if (s.earningsDays <= 30) {
      earningsBadge = '<span class="badge badge-warn" title="Earnings on ' + escapeHtml(s.earningsDate || '') + '">' + s.earningsDays + "d</span>";
    } else {
      earningsBadge = '<span class="badge badge-pass" title="Earnings on ' + escapeHtml(s.earningsDate || '') + '">' + s.earningsDays + "d</span>";
    }

    tr.innerHTML =
      '<td><div class="ticker-cell"><span class="ticker-symbol">' +
      escapeHtml(s.symbol) +
      '</span><span class="ticker-name">' +
      escapeHtml(truncate(s.name, 18)) +
      "</span></div></td>" +
      '<td class="price-cell">$' +
      formatNum(s.price, 2) +
      "</td>" +
      "<td>" +
      formatMktCap(s.marketCap) +
      "</td>" +
      "<td>" +
      (s.avgVolume > 0 ? formatNum(s.avgVolume, 1) + "M" : "—") +
      "</td>" +
      "<td>" +
      (s.pe !== null && s.pe > 0 ? formatNum(s.pe, 1) : "—") +
      "</td>" +
      "<td>" +
      formatNum(s.ivRank, 0) +
      "</td>" +
      "<td>" +
      formatNum(s.premiumYield, 1) +
      "%</td>" +
      "<td>$" +
      formatNum(s.buyingPower, 0) +
      "</td>" +
      "<td>" +
      sma200Badge +
      "</td>" +
      "<td>" +
      earningsBadge +
      "</td>" +
      '<td><div class="score-tip"><div class="score-bar"><div class="score-bar-fill"><div class="score-bar-fill-inner" style="width:' +
      s.wheelScore +
      "%;background:" +
      scoreBarColor +
      '"></div></div><span class="score-value ' +
      scoreColor +
      '">' +
      s.wheelScore +
      '</span></div>' +
      '<div class="score-tip-content">' +
      '<div class="score-tip-title">Wheel Score Breakdown</div>' +
      '<div class="score-tip-row"><span class="st-label">Premium (' + tipFilters.weightPremium + '%)</span><span class="st-val">' + (s.premiumScore || 0) + '</span></div>' +
      '<div class="score-tip-row"><span class="st-label">Liquidity (' + tipFilters.weightLiquidity + '%)</span><span class="st-val">' + (s.liquidityScore || 0) + '</span></div>' +
      '<div class="score-tip-row"><span class="st-label">Stability (' + tipFilters.weightStability + '%)</span><span class="st-val">' + (s.stabilityScore || 0) + '</span></div>' +
      '<div class="score-tip-row"><span class="st-label">Fundamentals (' + tipFilters.weightFundamentals + '%)</span><span class="st-val">' + (s.fundamentalsScore || 0) + '</span></div>' +
      '<hr class="score-tip-divider">' +
      '<div class="score-tip-row"><span class="st-label">Weighted Total</span><span class="st-val">' + s.wheelScore + '/100</span></div>' +
      '</div></div></td>' +
      '<td><button class="chain-btn" onclick="event.stopPropagation(); openChainPanel(\'' + escapeHtml(s.symbol) + '\')">' +
      '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>' +
      ' Puts</button></td>';

    tbody.appendChild(tr);
  });
}

function updateKPIs(scannedCount) {
  const data = filteredResults;
  document.getElementById("kpi-scanned").textContent = scannedCount || (allResults.length > 0 ? allResults.length : "—");
  document.getElementById("kpi-passed").textContent = data.length > 0 ? data.length : "—";

  if (data.length > 0) {
    const avgScore = Math.round(data.reduce((sum, s) => sum + s.wheelScore, 0) / data.length);
    const avgPremium = (data.reduce((sum, s) => sum + s.premiumYield, 0) / data.length).toFixed(1);
    document.getElementById("kpi-avg-score").textContent = avgScore + "/100";
    document.getElementById("kpi-avg-premium").textContent = avgPremium + "%";
  } else {
    document.getElementById("kpi-avg-score").textContent = "—";
    document.getElementById("kpi-avg-premium").textContent = "—";
  }

  const stats = document.getElementById("header-stats");
  if (data.length > 0) {
    stats.innerHTML =
      '<div class="stat-item"><span class="stat-value">' +
      data.length +
      '</span><span class="stat-label">Candidates</span></div>' +
      '<div class="stat-item"><span class="stat-value">' +
      Math.round(data.reduce((sum, s) => sum + s.wheelScore, 0) / data.length) +
      '</span><span class="stat-label">Avg Score</span></div>';
  } else {
    stats.innerHTML = "";
  }
}

// ---- Sorting ----
function sortResults(key) {
  document.querySelectorAll(".sort-btn").forEach((b) => b.classList.remove("active"));
  const btn = document.getElementById("sort-" + key);
  if (btn) btn.classList.add("active");

  const keyMap = { score: "wheelScore", premium: "premiumYield", price: "price", volume: "avgVolume" };
  const sortKey = keyMap[key] || "wheelScore";

  filteredResults.sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0));
  renderResults();
}

function sortByCol(key) {
  if (currentSort.key === key) {
    currentSort.dir = currentSort.dir === "desc" ? "asc" : "desc";
  } else {
    currentSort.key = key;
    currentSort.dir = "desc";
  }

  filteredResults.sort((a, b) => {
    let va = a[key] || 0;
    let vb = b[key] || 0;
    if (typeof va === "string") va = va.toLowerCase();
    if (typeof vb === "string") vb = vb.toLowerCase();
    return currentSort.dir === "desc" ? (vb > va ? 1 : -1) : (va > vb ? 1 : -1);
  });

  renderResults();
  document.querySelectorAll(".results-table th").forEach((th) => th.classList.remove("sorted"));
}

// ---- Export CSV ----
function exportCSV() {
  if (filteredResults.length === 0) return;

  const headers = [
    "Symbol","Name","Industry","Price","Market Cap ($B)","Avg Volume (M)",
    "P/E","Beta","Div Yield %","IV Rank","Premium Yield %","Buying Power",
    "200 SMA Status","200 SMA %","Earnings Days","Earnings Date",
    "Analyst Buy%","ROE","Net Margin",
    "Wheel Score","Premium Score","Liquidity Score","Stability Score","Fundamentals Score"
  ];

  const rows = filteredResults.map((s) => [
    s.symbol,
    '"' + (s.name || "").replace(/"/g, '""') + '"',
    '"' + (s.industry || "").replace(/"/g, '""') + '"',
    s.price.toFixed(2),
    s.marketCap > 0 ? (s.marketCap / 1e9).toFixed(2) : "",
    s.avgVolume > 0 ? s.avgVolume.toFixed(1) : "",
    s.pe !== null && s.pe > 0 ? s.pe.toFixed(1) : "",
    s.beta !== null ? s.beta.toFixed(2) : "",
    s.dividendYield > 0 ? s.dividendYield.toFixed(2) : "0",
    s.ivRank,
    s.premiumYield.toFixed(1),
    s.buyingPower.toFixed(0),
    s.sma200Status,
    s.sma200Pct !== null ? s.sma200Pct : "",
    s.earningsDays !== null ? s.earningsDays : "",
    s.earningsDate || "",
    s.analystBuyPct !== null ? s.analystBuyPct : "",
    s.roe !== null ? s.roe.toFixed(1) : "",
    s.netMargin !== null ? s.netMargin.toFixed(1) : "",
    s.wheelScore,
    s.premiumScore,
    s.liquidityScore,
    s.stabilityScore,
    s.fundamentalsScore,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "wheel_screener_" + new Date().toISOString().slice(0, 10) + ".csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ---- Formatters ----
function formatNum(n, decimals) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatMktCap(cap) {
  if (!cap || cap <= 0) return "—";
  if (cap >= 1e12) return "$" + (cap / 1e12).toFixed(1) + "T";
  if (cap >= 1e9) return "$" + (cap / 1e9).toFixed(1) + "B";
  if (cap >= 1e6) return "$" + (cap / 1e6).toFixed(0) + "M";
  return "$" + cap.toLocaleString();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str || ""));
  return div.innerHTML;
}

function truncate(str, len) {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "..." : str;
}

// ---- Alpaca API helpers ----
function getAlpacaKeys() {
  var keyId = document.getElementById("alpaca-key-id").value.trim();
  var secret = document.getElementById("alpaca-secret-key").value.trim();
  return { keyId: keyId, secret: secret, valid: !!(keyId && secret) };
}

async function fetchAlpacaData(endpoint, params) {
  var keys = getAlpacaKeys();
  if (!keys.valid) throw new Error("Alpaca API keys not set. Enter your Key ID and Secret Key in the sidebar.");
  var url = new URL("https://data.alpaca.markets" + endpoint);
  Object.entries(params || {}).forEach(function (kv) { url.searchParams.set(kv[0], String(kv[1])); });
  var res = await fetch(url.toString(), {
    headers: { "APCA-API-KEY-ID": keys.keyId, "APCA-API-SECRET-KEY": keys.secret, Accept: "application/json" }
  });
  if (res.status === 401) throw new Error("Invalid Alpaca keys. Check your API Key ID and Secret at alpaca.markets.");
  if (res.status === 403) throw new Error("Alpaca access denied. Check your account permissions.");
  if (res.status === 429) throw new Error("Alpaca rate limit hit (200 req/min). Wait a moment and try again.");
  if (!res.ok) throw new Error("Alpaca Data API error: " + res.status);
  return res.json();
}

async function fetchAlpacaTrading(endpoint, params) {
  var keys = getAlpacaKeys();
  if (!keys.valid) throw new Error("Alpaca API keys not set.");
  var url = new URL("https://paper-api.alpaca.markets" + endpoint);
  Object.entries(params || {}).forEach(function (kv) { url.searchParams.set(kv[0], String(kv[1])); });
  var res = await fetch(url.toString(), {
    headers: { "APCA-API-KEY-ID": keys.keyId, "APCA-API-SECRET-KEY": keys.secret, Accept: "application/json" }
  });
  if (res.status === 401) throw new Error("Invalid Alpaca keys.");
  if (res.status === 429) throw new Error("Alpaca rate limit hit. Wait a moment.");
  if (!res.ok) throw new Error("Alpaca Trading API error: " + res.status);
  return res.json();
}

// ---- Detect if options provider is available ----
function getOptionsProvider() {
  var keys = getAlpacaKeys();
  if (keys.valid) return "alpaca";
  return null;
}

// ---- Option Chain Panel ----
let chainCurrentSymbol = "";
let chainCurrentStock = null;

function openChainPanel(symbol) {
  var provider = getOptionsProvider();
  if (!provider) {
    alert("Enter your Alpaca API Key ID and Secret Key in the sidebar to view option chains.\n\nFree account at alpaca.markets — includes options chain data with Greeks.");
    return;
  }

  chainCurrentSymbol = symbol;
  chainCurrentStock = filteredResults.find(function (s) { return s.symbol === symbol; }) || allResults.find(function (s) { return s.symbol === symbol; });

  document.getElementById("chain-symbol").textContent = symbol;
  document.getElementById("chain-name").textContent = chainCurrentStock ? chainCurrentStock.name : "";
  document.getElementById("chain-price").textContent = chainCurrentStock ? "$" + formatNum(chainCurrentStock.price, 2) : "";

  document.getElementById("chain-overlay").style.display = "flex";
  document.body.style.overflow = "hidden";

  document.getElementById("chain-table").style.display = "none";
  document.getElementById("chain-empty").style.display = "block";
  document.getElementById("chain-loading").style.display = "none";
  document.getElementById("chain-info-bar").innerHTML = "";
  document.getElementById("chain-body").innerHTML = "";

  // Update footer to show provider
  var footerEl = document.getElementById("chain-footer");
  if (footerEl) {
    footerEl.innerHTML = '<span>Options data via <a href="https://alpaca.markets" target="_blank" rel="noopener noreferrer">Alpaca</a> Market Data API (indicative feed: delayed quotes, Greeks via Black-Scholes).</span>';
  }

  fetchExpirations(symbol);
}

function closeChainPanel() {
  document.getElementById("chain-overlay").style.display = "none";
  document.body.style.overflow = "";
}

// ---- Fetch expirations via Alpaca Trading API (contracts endpoint) ----
async function fetchExpirations(symbol) {
  var select = document.getElementById("chain-expiry");
  select.innerHTML = "<option>Loading expirations...</option>";

  try {
    var today = new Date().toISOString().slice(0, 10);
    var expirySet = {};
    var pageToken = null;

    // Paginate through all contracts to collect unique expiration dates
    for (var page = 0; page < 10; page++) {
      var params = {
        underlying_symbols: symbol, type: "put", status: "active",
        expiration_date_gte: today, limit: 10000
      };
      if (pageToken) params.page_token = pageToken;

      var data = await fetchAlpacaTrading("/v2/options/contracts", params);
      var contracts = data.option_contracts || [];
      contracts.forEach(function (c) { if (c.expiration_date) expirySet[c.expiration_date] = true; });

      pageToken = data.next_page_token;
      if (!pageToken || contracts.length === 0) break;
    }

    var expirations = Object.keys(expirySet).sort();

    if (expirations.length === 0) {
      select.innerHTML = "<option>No expirations found</option>";
      return;
    }

    var now = new Date();
    var targetDTE = parseInt(document.getElementById("target-dte").value) || 30;
    select.innerHTML = "";
    var bestMatch = null;
    var bestDiff = Infinity;

    expirations.forEach(function (exp) {
      var expDate = new Date(exp + "T00:00:00");
      var dte = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
      if (dte < 1) return;
      var opt = document.createElement("option");
      opt.value = exp;
      opt.textContent = exp + " (" + dte + " DTE)";
      select.appendChild(opt);
      var diff = Math.abs(dte - targetDTE);
      if (diff < bestDiff) { bestDiff = diff; bestMatch = exp; }
    });

    if (bestMatch) select.value = bestMatch;
    fetchChainForExpiry();
  } catch (e) {
    console.error("Expiration fetch error:", e);
    select.innerHTML = "<option>Error: " + escapeHtml(e.message) + "</option>";
  }
}

// ---- Fetch chain data via Alpaca ----
async function fetchChainForExpiry() {
  var symbol = chainCurrentSymbol;
  var expiry = document.getElementById("chain-expiry").value;
  if (!symbol || !expiry || expiry.startsWith("Loading") || expiry.startsWith("Error") || expiry.startsWith("No") || expiry.startsWith("Select")) return;

  document.getElementById("chain-loading").style.display = "flex";
  document.getElementById("chain-empty").style.display = "none";
  document.getElementById("chain-table").style.display = "none";

  var currentPrice = chainCurrentStock ? chainCurrentStock.price : 0;
  var now = new Date();
  var expDate = new Date(expiry + "T00:00:00");
  var dte = Math.max(1, Math.ceil((expDate - now) / (1000 * 60 * 60 * 24)));
  var targetDelta = parseFloat(document.getElementById("target-delta").value) || 0.30;

  try {
    var puts = await fetchChainAlpaca(symbol, expiry, currentPrice, dte);

    if (puts.length === 0) {
      document.getElementById("chain-loading").style.display = "none";
      document.getElementById("chain-empty").style.display = "block";
      document.getElementById("chain-empty").querySelector("p").textContent =
        "No put contracts found for " + symbol + " expiring " + expiry + ".";
      return;
    }

    document.getElementById("chain-info-bar").innerHTML =
      '<div class="chain-info-item"><strong>' + dte + '</strong> DTE</div>' +
      '<div class="chain-info-item">Target \u0394: <strong>' + targetDelta.toFixed(2) + '</strong></div>' +
      '<div class="chain-info-item">Contracts: <strong>' + puts.length + '</strong></div>' +
      '<div class="chain-info-item">Source: <strong>Alpaca</strong></div>' +
      (currentPrice > 0 ? '<div class="chain-info-item">ATM: <strong>$' + formatNum(currentPrice, 2) + '</strong></div>' : '');

    scorePuts(puts, targetDelta, currentPrice);
    renderChainTable(puts, currentPrice);

    document.getElementById("chain-loading").style.display = "none";
    document.getElementById("chain-table").style.display = "table";
  } catch (e) {
    console.error("Chain fetch error:", e);
    document.getElementById("chain-loading").style.display = "none";
    document.getElementById("chain-empty").style.display = "block";
    document.getElementById("chain-empty").querySelector("p").textContent = "Error loading chain: " + e.message;
  }
}

// ---- Alpaca chain fetcher ----
// Uses two API calls:
// 1) Market Data API: snapshots for greeks, IV, bid/ask
// 2) Trading API: contracts for open interest and volume
async function fetchChainAlpaca(symbol, expiry, currentPrice, dte) {
  // Step 1: Fetch chain snapshots (greeks + quotes) from Data API
  var snapshots = {};
  var pageToken = null;

  for (var pg = 0; pg < 10; pg++) {
    var snapParams = {
      type: "put", expiration_date: expiry,
      feed: "indicative", limit: 1000
    };
    if (pageToken) snapParams.page_token = pageToken;

    var snapData = await fetchAlpacaData(
      "/v1beta1/options/snapshots/" + encodeURIComponent(symbol), snapParams
    );
    var batch = snapData.snapshots || {};
    Object.assign(snapshots, batch);

    pageToken = snapData.next_page_token;
    if (!pageToken) break;
  }

  // Step 2: Fetch contracts (OI data) from Trading API
  var oiMap = {};
  var cPageToken = null;

  for (var cp = 0; cp < 5; cp++) {
    var cParams = {
      underlying_symbols: symbol, type: "put", status: "active",
      expiration_date: expiry, limit: 10000
    };
    if (cPageToken) cParams.page_token = cPageToken;

    try {
      var cData = await fetchAlpacaTrading("/v2/options/contracts", cParams);
      var contracts = cData.option_contracts || [];
      contracts.forEach(function (c) {
        oiMap[c.symbol] = {
          oi: parseInt(c.open_interest) || 0,
          closePrice: parseFloat(c.close_price) || 0
        };
      });
      cPageToken = cData.next_page_token;
      if (!cPageToken || contracts.length === 0) break;
    } catch (_e) {
      // OI fetch is supplementary; continue without it
      break;
    }
  }

  // Step 3: Parse and merge
  var keys = Object.keys(snapshots);
  return keys.map(function (contractSymbol) {
    var snap = snapshots[contractSymbol];
    var greeks = snap.greeks || {};
    var quote = snap.latestQuote || {};
    var trade = snap.latestTrade || {};
    var dailyBar = snap.dailyBar || {};

    // Parse strike from OCC symbol: e.g. AAPL260320P00150000 -> 150.000
    var strike = parseStrikeFromSymbol(contractSymbol);

    var bid = quote.bp || 0;
    var ask = quote.ap || 0;
    var mid = (bid + ask) / 2;
    var spread = ask - bid;
    var spreadPct = mid > 0 ? (spread / mid) * 100 : 999;
    var delta = greeks.delta !== undefined ? greeks.delta : null;
    var iv = snap.impliedVolatility !== undefined ? snap.impliedVolatility : null;
    var itm = currentPrice > 0 && strike >= currentPrice;
    var premYield = (strike > 0 && mid > 0) ? (mid / strike) * (365 / dte) * 100 : 0;

    // Merge OI from contracts endpoint
    var oiInfo = oiMap[contractSymbol] || {};
    var volume = dailyBar.v || 0;

    return {
      strike: strike, bid: bid, ask: ask, mid: mid, spread: spread, spreadPct: spreadPct,
      volume: volume, oi: oiInfo.oi || 0,
      delta: delta, iv: iv, last: trade.p || oiInfo.closePrice || 0, premYield: premYield,
      itm: itm, dte: dte, putScore: 0, rec: ""
    };
  }).filter(function (p) { return p.strike > 0; }).sort(function (a, b) { return a.strike - b.strike; });
}

// Parse strike price from OCC option symbol
// Format: ROOT + YYMMDD + P/C + 8-digit strike (price * 1000)
// Example: AAPL260320P00150000 -> 150.000
function parseStrikeFromSymbol(sym) {
  // The last 8 digits are the strike price * 1000
  var match = sym.match(/(\d{8})$/);
  if (match) return parseInt(match[1]) / 1000;
  return 0;
}

function scorePuts(puts, targetDelta) {
  var maxOI = Math.max(1, Math.max.apply(null, puts.map(function (p) { return p.oi; }).concat([1])));
  var maxVol = Math.max(1, Math.max.apply(null, puts.map(function (p) { return p.volume; }).concat([1])));

  puts.forEach(function (p) {
    if (p.itm) {
      p.putScore = 0;
      p.rec = "itm";
      return;
    }

    // Spread quality (30%)
    var spreadScore = 0;
    if (p.bid <= 0 && p.ask <= 0) spreadScore = 0;
    else if (p.spreadPct <= 3) spreadScore = 100;
    else if (p.spreadPct <= 5) spreadScore = 85;
    else if (p.spreadPct <= 10) spreadScore = 60;
    else if (p.spreadPct <= 15) spreadScore = 35;
    else if (p.spreadPct <= 25) spreadScore = 15;
    else spreadScore = 5;

    // Liquidity (25%)
    var oiScore = Math.min(100, (p.oi / maxOI) * 100);
    var volScore = Math.min(100, (p.volume / maxVol) * 100);
    var liquidityScore = oiScore * 0.6 + volScore * 0.4;
    var liqBonus = (p.oi > 100 ? 10 : 0) + (p.volume > 10 ? 5 : 0);

    // Premium yield (20%)
    var premScore = Math.min(100, (p.premYield / 25) * 100);

    // Delta sweet spot (15%)
    var deltaScore = 50;
    if (p.delta !== null) {
      var absDelta = Math.abs(p.delta);
      var diff = Math.abs(absDelta - targetDelta);
      if (diff < 0.03) deltaScore = 100;
      else if (diff < 0.05) deltaScore = 85;
      else if (diff < 0.10) deltaScore = 65;
      else if (diff < 0.15) deltaScore = 40;
      else deltaScore = Math.max(5, 30 - diff * 100);
    }

    // IV level (10%)
    var ivScore = 50;
    if (p.iv !== null) {
      var ivPct = p.iv * 100;
      if (ivPct >= 25 && ivPct <= 50) ivScore = 90;
      else if (ivPct >= 20 && ivPct <= 60) ivScore = 70;
      else if (ivPct > 60) ivScore = 45;
      else ivScore = 30;
    }

    p.spreadScore = Math.round(spreadScore);
    p.liquidityScore = Math.round(Math.min(100, liquidityScore + liqBonus));
    p.premScore = Math.round(premScore);
    p.deltaScore = Math.round(deltaScore);
    p.ivScore = Math.round(ivScore);

    p.putScore = Math.round(
      spreadScore * 0.30 +
      Math.min(100, liquidityScore + liqBonus) * 0.25 +
      premScore * 0.20 +
      deltaScore * 0.15 +
      ivScore * 0.10
    );
    p.putScore = Math.max(0, Math.min(100, p.putScore));
  });

  // Assign recommendations
  var otmPuts = puts.filter(function (p) { return !p.itm && p.bid > 0; });
  otmPuts.sort(function (a, b) { return b.putScore - a.putScore; });

  otmPuts.forEach(function (p, i) {
    if (i < 2 && p.putScore >= 50) p.rec = "best";
    else if (p.putScore >= 60) p.rec = "good";
    else if (p.putScore >= 35) p.rec = "ok";
    else p.rec = "caution";
  });

  puts.forEach(function (p) {
    if (!p.rec && !p.itm) p.rec = "caution";
    if (!p.rec) p.rec = "itm";
  });
}

function renderChainTable(puts) {
  var tbody = document.getElementById("chain-body");
  tbody.innerHTML = "";

  puts.forEach(function (p) {
    var tr = document.createElement("tr");

    if (p.itm) tr.classList.add("chain-row-itm");
    if (p.rec === "best") tr.classList.add("chain-row-best");

    var recBadge = "";
    if (p.rec === "best") recBadge = '<span class="chain-rec-badge chain-rec-best">Best Pick</span>';
    else if (p.rec === "good") recBadge = '<span class="chain-rec-badge chain-rec-good">Good</span>';
    else if (p.rec === "itm") recBadge = '<span class="chain-rec-badge chain-rec-itm">ITM</span>';

    var scoreColor = p.putScore >= 60 ? "var(--color-primary)" : p.putScore >= 35 ? "var(--color-warning)" : "var(--color-error)";

    tr.innerHTML =
      "<td>$" + formatNum(p.strike, 2) + "</td>" +
      "<td>" + (p.bid > 0 ? "$" + formatNum(p.bid, 2) : "\u2014") + "</td>" +
      "<td>" + (p.ask > 0 ? "$" + formatNum(p.ask, 2) : "\u2014") + "</td>" +
      "<td>" + (p.spread > 0 ? formatNum(p.spreadPct, 1) + "%" : "\u2014") + "</td>" +
      "<td>" + (p.mid > 0 ? "$" + formatNum(p.mid, 2) : "\u2014") + "</td>" +
      "<td>" + (p.volume > 0 ? formatNum(p.volume, 0) : "\u2014") + "</td>" +
      "<td>" + (p.oi > 0 ? formatNum(p.oi, 0) : "\u2014") + "</td>" +
      "<td>" + (p.delta !== null ? formatNum(p.delta, 3) : "\u2014") + "</td>" +
      "<td>" + (p.iv !== null ? formatNum(p.iv * 100, 1) + "%" : "\u2014") + "</td>" +
      "<td>" + (p.premYield > 0 ? formatNum(p.premYield, 1) + "%" : "\u2014") + "</td>" +
      '<td>' + (p.itm ? '<span style="color:var(--color-text-muted)">\u2014</span>' :
      '<div class="score-tip"><span style="color:' + scoreColor + ';font-weight:700;cursor:help">' + p.putScore + '</span>' +
      '<div class="score-tip-content">' +
      '<div class="score-tip-title">Put Score Breakdown</div>' +
      '<div class="score-tip-row"><span class="st-label">Spread (30%)</span><span class="st-val">' + (p.spreadScore || 0) + '</span></div>' +
      '<div class="score-tip-row"><span class="st-label">Liquidity (25%)</span><span class="st-val">' + (p.liquidityScore || 0) + '</span></div>' +
      '<div class="score-tip-row"><span class="st-label">Premium (20%)</span><span class="st-val">' + (p.premScore || 0) + '</span></div>' +
      '<div class="score-tip-row"><span class="st-label">Delta (15%)</span><span class="st-val">' + (p.deltaScore || 0) + '</span></div>' +
      '<div class="score-tip-row"><span class="st-label">IV (10%)</span><span class="st-val">' + (p.ivScore || 0) + '</span></div>' +
      '<hr class="score-tip-divider">' +
      '<div class="score-tip-row"><span class="st-label">Weighted Total</span><span class="st-val">' + p.putScore + '/100</span></div>' +
      '</div></div>') + '</td>' +
      "<td>" + recBadge + "</td>";

    tbody.appendChild(tr);
  });
}
