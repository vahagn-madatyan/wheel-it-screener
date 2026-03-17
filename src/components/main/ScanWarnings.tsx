import { useScanStore } from '@/stores/scan-store';

/**
 * Displays warnings about scan data quality — failed tickers, earnings data
 * issues, etc. Only visible after a completed scan with warnings to report.
 */
export function ScanWarnings() {
  const phase = useScanStore((s) => s.phase);
  const failedTickers = useScanStore((s) => s.failedTickers);
  const earningsWarning = useScanStore((s) => s.earningsWarning);

  if (phase !== 'complete') return null;
  if (failedTickers.length === 0 && !earningsWarning) return null;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-1.5 px-4">
      {failedTickers.length > 0 && (
        <p className="text-xs text-amber-500">
          ⚠ {failedTickers.length} ticker{failedTickers.length > 1 ? 's' : ''}{' '}
          failed to load ({failedTickers.slice(0, 5).join(', ')}
          {failedTickers.length > 5
            ? `, +${failedTickers.length - 5} more`
            : ''}
          )
        </p>
      )}
      {earningsWarning && (
        <p className="text-xs text-amber-500">⚠ {earningsWarning}</p>
      )}
    </div>
  );
}
