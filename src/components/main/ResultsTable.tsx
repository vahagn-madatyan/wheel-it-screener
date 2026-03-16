import { useMemo } from "react";
import { ChevronUp, ChevronDown, ArrowUpDown, Download } from "lucide-react";
import { useResultsStore } from "@/stores/results-store";
import { useChainStore } from "@/stores/chain-store";
import { formatNum, formatMktCap, truncate } from "@/lib/formatters";
import { exportCSV } from "@/lib/csv-export";
import { cn } from "@/lib/utils";
import { ScoreTooltip } from "./ScoreTooltip";
import type { StockResult } from "@/types";

// ---- Column definitions ----

type SortableKey = keyof StockResult;

interface Column {
  header: string;
  /** Key used for sorting. null = not sortable */
  sortKey: SortableKey | null;
  /** Render cell content */
  render: (row: StockResult) => React.ReactNode;
  /** Extra header/cell classes */
  className?: string;
}

const COLUMNS: Column[] = [
  {
    header: "Ticker",
    sortKey: "symbol",
    render: (r) => (
      <div className="min-w-0">
        <span className="font-semibold text-primary">{r.symbol}</span>
        <span className="ml-1.5 text-xs text-muted-foreground">
          {truncate(r.name, 18)}
        </span>
      </div>
    ),
    className: "text-left",
  },
  {
    header: "Price",
    sortKey: "price",
    render: (r) => `$${formatNum(r.price, 2)}`,
    className: "text-right",
  },
  {
    header: "Mkt Cap",
    sortKey: "marketCap",
    render: (r) => formatMktCap(r.marketCap),
    className: "text-right",
  },
  {
    header: "Volume",
    sortKey: "avgVolume",
    render: (r) =>
      r.avgVolume >= 1e6
        ? `${(r.avgVolume / 1e6).toFixed(1)}M`
        : formatNum(r.avgVolume, 0),
    className: "text-right",
  },
  {
    header: "P/E",
    sortKey: "pe",
    render: (r) => formatNum(r.pe, 1),
    className: "text-right",
  },
  {
    header: "IV Rank",
    sortKey: "ivRank",
    render: (r) => (r.ivRank != null ? `${formatNum(r.ivRank, 0)}%` : "—"),
    className: "text-right",
  },
  {
    header: "Prem Yield",
    sortKey: "premiumYield",
    render: (r) =>
      r.premiumYield != null ? `${formatNum(r.premiumYield, 2)}%` : "—",
    className: "text-right",
  },
  {
    header: "Buy Pwr",
    sortKey: "buyingPower",
    render: (r) =>
      r.buyingPower != null ? `$${formatNum(r.buyingPower, 0)}` : "—",
    className: "text-right",
  },
  {
    header: "200 SMA",
    sortKey: "sma200Pct",
    render: (r) => <SmaBadge status={r.sma200Status} pct={r.sma200Pct} />,
    className: "text-center",
  },
  {
    header: "Earnings",
    sortKey: "earningsDays",
    render: (r) => <EarningsBadge days={r.earningsDays} />,
    className: "text-center",
  },
  {
    header: "Wheel Score",
    sortKey: "wheelScore",
    render: (r) => <ScoreBar stock={r} />,
    className: "text-left min-w-[120px]",
  },
  {
    header: "Chain",
    sortKey: null,
    render: (r) => (
      <button
        className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
        onClick={() => useChainStore.getState().open(r.symbol)}
      >
        Puts
      </button>
    ),
    className: "text-center",
  },
];

// ---- Sub-components ----

function SmaBadge({
  status,
  pct,
}: {
  status?: "above" | "below" | "n/a";
  pct?: number | null;
}) {
  if (!status || status === "n/a") {
    return (
      <span className="inline-block rounded-full bg-yellow-500/15 px-2 py-0.5 text-[11px] font-medium text-yellow-400">
        N/A
      </span>
    );
  }

  const label = status === "above" ? "Above" : "Below";
  const color =
    status === "above"
      ? "bg-emerald-500/15 text-emerald-400"
      : "bg-red-500/15 text-red-400";

  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium",
        color,
      )}
      title={pct != null ? `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%` : undefined}
    >
      {label}
    </span>
  );
}

function EarningsBadge({ days }: { days?: number | null }) {
  if (days == null) {
    return (
      <span className="inline-block rounded-full bg-yellow-500/15 px-2 py-0.5 text-[11px] font-medium text-yellow-400">
        N/A
      </span>
    );
  }

  let color: string;
  if (days <= 14) {
    color = "bg-red-500/15 text-red-400";
  } else if (days <= 30) {
    color = "bg-yellow-500/15 text-yellow-400";
  } else {
    color = "bg-emerald-500/15 text-emerald-400";
  }

  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium",
        color,
      )}
    >
      {days}d
    </span>
  );
}

function ScoreBar({ stock }: { stock: StockResult }) {
  const score = stock.wheelScore ?? 0;

  let barColor: string;
  if (score >= 70) {
    barColor = "bg-emerald-500";
  } else if (score >= 45) {
    barColor = "bg-yellow-500";
  } else {
    barColor = "bg-red-500";
  }

  return (
    <ScoreTooltip stock={stock}>
      <div className="group relative h-5 w-full cursor-default overflow-hidden rounded bg-muted">
        <div
          className={cn("absolute inset-y-0 left-0 rounded transition-[width] duration-300", barColor)}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums text-foreground drop-shadow-sm">
          {score.toFixed(1)}
        </span>
      </div>
    </ScoreTooltip>
  );
}

// ---- Sort header ----

function SortIndicator({
  columnKey,
  sortKey,
  sortDirection,
}: {
  columnKey: SortableKey;
  sortKey: SortableKey;
  sortDirection: "asc" | "desc";
}) {
  if (columnKey !== sortKey) {
    return <ArrowUpDown className="ml-1 inline-block size-3 opacity-40" />;
  }
  return sortDirection === "asc" ? (
    <ChevronUp className="ml-1 inline-block size-3" />
  ) : (
    <ChevronDown className="ml-1 inline-block size-3" />
  );
}

// ---- Sorting logic ----

const STRING_SORT_KEYS = new Set<string>(["symbol", "name"]);

function compareFn(
  a: StockResult,
  b: StockResult,
  key: SortableKey,
  dir: "asc" | "desc",
): number {
  const aVal = a[key];
  const bVal = b[key];

  // Null/undefined sort last regardless of direction
  const aNull = aVal == null || (typeof aVal === "number" && isNaN(aVal));
  const bNull = bVal == null || (typeof bVal === "number" && isNaN(bVal));
  if (aNull && bNull) return 0;
  if (aNull) return 1;
  if (bNull) return -1;

  let cmp: number;
  if (STRING_SORT_KEYS.has(key)) {
    cmp = String(aVal).toLowerCase().localeCompare(String(bVal).toLowerCase());
  } else {
    cmp = (aVal as number) - (bVal as number);
  }

  return dir === "asc" ? cmp : -cmp;
}

// ---- Main component ----

export function ResultsTable() {
  const filteredResults = useResultsStore((s) => s.filteredResults);
  const sort = useResultsStore((s) => s.sort);
  const setSortKey = useResultsStore((s) => s.setSortKey);

  const sorted = useMemo(() => {
    const copy = [...filteredResults];
    copy.sort((a, b) => compareFn(a, b, sort.key, sort.direction));
    return copy;
  }, [filteredResults, sort.key, sort.direction]);

  return (
    <div data-testid="results-table">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {filteredResults.length} result{filteredResults.length !== 1 ? "s" : ""}
        </span>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            filteredResults.length > 0
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "cursor-not-allowed bg-muted text-muted-foreground opacity-50",
          )}
          disabled={filteredResults.length === 0}
          onClick={() => exportCSV(filteredResults)}
          data-testid="export-csv-btn"
        >
          <Download className="size-3.5" />
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {COLUMNS.map((col) => (
              <th
                key={col.header}
                className={cn(
                  "whitespace-nowrap px-3 py-2 text-xs font-medium text-muted-foreground",
                  col.className,
                  col.sortKey && "cursor-pointer select-none hover:text-foreground",
                )}
                onClick={col.sortKey ? () => setSortKey(col.sortKey!) : undefined}
              >
                {col.header}
                {col.sortKey && (
                  <SortIndicator
                    columnKey={col.sortKey}
                    sortKey={sort.key}
                    sortDirection={sort.direction}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={row.symbol}
              className="border-b border-border/50 transition-colors hover:bg-muted/30"
            >
              {COLUMNS.map((col) => (
                <td
                  key={col.header}
                  className={cn(
                    "whitespace-nowrap px-3 py-2",
                    col.className,
                  )}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
