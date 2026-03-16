import { useFilterStore } from '@/stores/filter-store';
import { useApiKeyStore } from '@/stores/api-key-store';
import { useScanStore } from '@/stores/scan-store';
import { useScanRunner } from '@/hooks/use-scan-runner';
import { cn } from '@/lib/utils';

function getDisabledReason(
  phase: string,
  finnhubStatus: string,
): string | null {
  if (phase === 'running') return 'Scan in progress…';
  if (finnhubStatus === 'not_set') return 'Set Finnhub API key first';
  return null;
}

export function ActionButtons() {
  const { runScan, cancel, phase } = useScanRunner();
  const finnhubStatus = useApiKeyStore((s) => s.status.finnhub);
  const resetFilters = useFilterStore((s) => s.resetFilters);

  const progress = useScanStore((s) => s.progress);

  const disabledReason = getDisabledReason(phase, finnhubStatus);
  const isRunDisabled = disabledReason !== null;
  const isRunning = phase === 'running';

  return (
    <div className="flex flex-col gap-2">
      <div className="relative group">
        <button
          type="button"
          disabled={isRunDisabled}
          onClick={runScan}
          className={cn(
            'relative h-9 w-full overflow-hidden rounded-md text-sm font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            isRunDisabled
              ? 'cursor-not-allowed bg-primary/40 text-primary-foreground/60'
              : 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400',
          )}
        >
          {isRunning && (
            <div
              className="absolute inset-y-0 left-0 bg-emerald-400/20 transition-[width] duration-150 ease-out"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          )}
          <span className="relative z-10">
            {isRunning ? 'Scanning…' : 'Run Screener'}
          </span>
        </button>
        {disabledReason && !isRunning && (
          <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md opacity-0 transition-opacity group-hover:opacity-100">
            {disabledReason}
          </div>
        )}
      </div>

      {isRunning ? (
        <button
          type="button"
          onClick={cancel}
          className={cn(
            'h-9 w-full rounded-md border border-destructive/50 text-sm font-medium',
            'text-destructive transition-colors',
            'hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          )}
        >
          Cancel Scan
        </button>
      ) : (
        <button
          type="button"
          onClick={resetFilters}
          className={cn(
            'h-9 w-full rounded-md border border-sidebar-border text-sm font-medium',
            'text-sidebar-foreground transition-colors',
            'hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          )}
        >
          Reset to Defaults
        </button>
      )}
    </div>
  );
}
