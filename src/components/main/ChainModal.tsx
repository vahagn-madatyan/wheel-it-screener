import { useShallow } from 'zustand/react/shallow';
import { Loader2, AlertCircle, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useChainStore } from '@/stores/chain-store';
import { useChainQuery } from '@/hooks/use-chain-query';
import { useResultsStore } from '@/stores/results-store';
import { useFilterStore } from '@/stores/filter-store';
import { useApiKeyStore } from '@/stores/api-key-store';
import { formatNum } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { PutScoreTooltip } from './PutScoreTooltip';
import type { PutOption } from '@/types';

// ---- Rec badge rendering ----

function recLabel(rec: string): string {
  switch (rec) {
    case 'best':
      return 'Best Pick';
    case 'good':
      return 'Good';
    case 'ok':
      return 'OK';
    case 'caution':
      return 'Caution';
    case 'itm':
      return 'ITM';
    default:
      return rec;
  }
}

function recClasses(rec: string): string {
  switch (rec) {
    case 'best':
      return 'bg-emerald-500/20 text-emerald-400';
    case 'good':
      return 'bg-blue-500/20 text-blue-400';
    case 'ok':
      return 'bg-gray-500/20 text-gray-400';
    case 'caution':
      return 'bg-amber-500/20 text-amber-400';
    case 'itm':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

// ---- Score cell ----

function scoreColor(value: number): string {
  if (value >= 70) return 'text-emerald-400';
  if (value >= 45) return 'text-yellow-400';
  return 'text-red-400';
}

function PutScoreCell({ put }: { put: PutOption }) {
  if (put.itm) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <PutScoreTooltip put={put}>
      <span
        className={cn(
          'cursor-default tabular-nums font-medium',
          scoreColor(put.putScore),
        )}
      >
        {put.putScore}
      </span>
    </PutScoreTooltip>
  );
}

// ---- No-provider message ----

function NoProviderMessage() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <Info className="size-8 text-muted-foreground" />
      <div>
        <p className="font-medium text-foreground">No API keys configured</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Set Alpaca or Massive.com API keys in the sidebar to load option chain
          data.
        </p>
      </div>
    </div>
  );
}

// ---- Table columns ----

interface PutColumn {
  header: string;
  className?: string;
  render: (p: PutOption) => React.ReactNode;
}

const COLUMNS: PutColumn[] = [
  {
    header: 'Strike',
    className: 'text-right',
    render: (p) => `$${formatNum(p.strike, 2)}`,
  },
  {
    header: 'Bid',
    className: 'text-right',
    render: (p) => `$${formatNum(p.bid, 2)}`,
  },
  {
    header: 'Ask',
    className: 'text-right',
    render: (p) => `$${formatNum(p.ask, 2)}`,
  },
  {
    header: 'Spread%',
    className: 'text-right',
    render: (p) =>
      p.spreadPct != null ? `${formatNum(p.spreadPct, 1)}%` : '—',
  },
  {
    header: 'Mid',
    className: 'text-right',
    render: (p) => `$${formatNum(p.mid, 2)}`,
  },
  {
    header: 'Vol',
    className: 'text-right',
    render: (p) => formatNum(p.volume, 0),
  },
  {
    header: 'OI',
    className: 'text-right',
    render: (p) => formatNum(p.oi, 0),
  },
  {
    header: 'Delta',
    className: 'text-right',
    render: (p) => (p.delta != null ? formatNum(p.delta, 3) : '—'),
  },
  {
    header: 'IV%',
    className: 'text-right',
    render: (p) => (p.iv != null ? `${formatNum(p.iv * 100, 1)}%` : '—'),
  },
  {
    header: 'Ann Yield%',
    className: 'text-right',
    render: (p) =>
      p.premYield != null ? `${formatNum(p.premYield, 2)}%` : '—',
  },
  {
    header: 'Score',
    className: 'text-center',
    render: (p) => <PutScoreCell put={p} />,
  },
  {
    header: 'Rec',
    className: 'text-center',
    render: (p) => (
      <span
        className={cn(
          'inline-block rounded-full px-2 py-0.5 text-[11px] font-medium',
          recClasses(p.rec),
        )}
      >
        {recLabel(p.rec)}
      </span>
    ),
  },
];

// ---- Main component ----

export function ChainModal() {
  const { isOpen, symbol, chainData, loading, error } = useChainStore(
    useShallow((s) => ({
      isOpen: s.isOpen,
      symbol: s.symbol,
      chainData: s.chainData,
      loading: s.loading,
      error: s.error,
    })),
  );

  const close = useChainStore((s) => s.close);
  const setSelectedExpiry = useChainStore((s) => s.setSelectedExpiry);

  // Stock lookup for header
  const stock = useResultsStore((s) =>
    symbol ? s.allResults.find((r) => r.symbol === symbol) : undefined,
  );

  // Filter values for info bar
  const { targetDelta } = useFilterStore(
    useShallow((s) => ({ targetDelta: s.targetDelta })),
  );

  // Provider detection
  const provider = useApiKeyStore((s) => {
    if (s.alpacaKeyId && s.alpacaSecretKey) return 'alpaca';
    if (s.massiveKey) return 'massive';
    return null;
  });

  // Activate query hook (no-op when closed)
  useChainQuery();

  const providerName =
    provider === 'alpaca'
      ? 'Alpaca'
      : provider === 'massive'
        ? 'Massive.com'
        : null;

  const puts = chainData?.puts ?? [];
  const expirations = chainData?.expirations ?? [];
  const selectedExpiry = chainData?.selectedExpiry ?? '';

  // Compute DTE from selected expiry
  const dte = selectedExpiry
    ? Math.round(
        (new Date(selectedExpiry + 'T16:00:00').getTime() - Date.now()) /
          86_400_000,
      )
    : null;

  // ATM price = closest OTM strike to current price
  const atmStrike = stock?.price
    ? (puts.reduce<PutOption | null>((best, p) => {
        if (p.itm) return best;
        if (!best) return p;
        return Math.abs(p.strike - stock.price) <
          Math.abs(best.strike - stock.price)
          ? p
          : best;
      }, null)?.strike ?? null)
    : null;

  // Best-row highlighting: top 2 "best" recs
  const bestStrikes = new Set(
    puts.filter((p) => p.rec === 'best').map((p) => p.strike),
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        open={isOpen}
        className="max-w-5xl max-h-[85vh] flex flex-col gap-0 p-0"
        data-testid="chain-modal"
      >
        {/* ---- Header ---- */}
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <span className="text-primary">{symbol}</span>
            {stock && (
              <>
                <span className="text-muted-foreground font-normal text-base">
                  {stock.name}
                </span>
                <span className="ml-auto tabular-nums text-base font-medium">
                  ${formatNum(stock.price, 2)}
                </span>
              </>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Put option chain for {symbol}
          </DialogDescription>
        </DialogHeader>

        {/* ---- Content area ---- */}
        <div className="flex flex-1 flex-col overflow-hidden px-6 py-4">
          {/* No provider configured */}
          {!provider && <NoProviderMessage />}

          {/* Provider present — show content */}
          {provider && (
            <>
              {/* Info bar with expiry selector */}
              <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <label className="flex items-center gap-1.5">
                  <span>Expiry:</span>
                  <select
                    className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
                    value={selectedExpiry}
                    onChange={(e) => setSelectedExpiry(e.target.value)}
                    disabled={expirations.length === 0}
                    data-testid="expiry-select"
                  >
                    {expirations.map((exp) => (
                      <option key={exp} value={exp}>
                        {exp}
                      </option>
                    ))}
                  </select>
                </label>
                {dte != null && (
                  <span>
                    DTE:{' '}
                    <span className="text-foreground font-medium">{dte}</span>
                  </span>
                )}
                <span>
                  Target Δ:{' '}
                  <span className="text-foreground font-medium">
                    {targetDelta}
                  </span>
                </span>
                <span>
                  Contracts:{' '}
                  <span className="text-foreground font-medium">
                    {puts.length}
                  </span>
                </span>
                {providerName && (
                  <span>
                    Provider:{' '}
                    <span className="text-foreground font-medium">
                      {providerName}
                    </span>
                  </span>
                )}
                {atmStrike != null && (
                  <span>
                    ATM:{' '}
                    <span className="text-foreground font-medium">
                      ${formatNum(atmStrike, 2)}
                    </span>
                  </span>
                )}
              </div>

              {/* Loading state */}
              {loading && (
                <div className="flex flex-1 items-center justify-center py-12">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Loading chain…
                  </span>
                </div>
              )}

              {/* Error state */}
              {!loading && error && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <AlertCircle className="size-8 text-red-400" />
                  <div>
                    <p className="font-medium text-foreground">
                      Failed to load chain
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && chainData && puts.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <Info className="size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No put contracts found for this expiry.
                  </p>
                </div>
              )}

              {/* Table */}
              {!loading && !error && puts.length > 0 && (
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 z-10 bg-background">
                      <tr className="border-b border-border">
                        {COLUMNS.map((col) => (
                          <th
                            key={col.header}
                            className={cn(
                              'whitespace-nowrap px-2 py-1.5 font-medium text-muted-foreground',
                              col.className,
                            )}
                          >
                            {col.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {puts.map((p) => (
                        <tr
                          key={p.strike}
                          className={cn(
                            'border-b border-border/30 transition-colors',
                            p.itm && 'opacity-50',
                            bestStrikes.has(p.strike) &&
                              !p.itm &&
                              'bg-emerald-500/5',
                            !p.itm &&
                              !bestStrikes.has(p.strike) &&
                              'hover:bg-muted/30',
                          )}
                        >
                          {COLUMNS.map((col) => (
                            <td
                              key={col.header}
                              className={cn(
                                'whitespace-nowrap px-2 py-1.5 tabular-nums',
                                col.className,
                              )}
                            >
                              {col.render(p)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* ---- Footer ---- */}
        {providerName && (
          <div className="border-t border-border px-6 py-2 text-[11px] text-muted-foreground">
            Data source: {providerName} • Scores are estimates, not financial
            advice
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ChainModal;
