import { AnimatePresence, motion } from 'motion/react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useScanStore } from '@/stores/scan-store';
import { useResultsStore } from '@/stores/results-store';

export function EmptyState() {
  const phase = useScanStore((s) => s.phase);
  const filteredResults = useResultsStore((s) => s.filteredResults);

  // Only show when idle (pre-scan) or complete with zero results
  const isRunningOrError = phase === 'running' || phase === 'error';
  const hasResults = phase === 'complete' && filteredResults.length > 0;
  const isVisible = !isRunningOrError && !hasResults;

  const isZeroResults = phase === 'complete' && filteredResults.length === 0;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="empty-state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center"
          data-testid="empty-state"
        >
          {isZeroResults ? (
            <>
              <SlidersHorizontal className="size-10 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold text-foreground">
                No stocks matched your filters
              </h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Try loosening your criteria — lower the minimum price, reduce
                the premium threshold, or expand the ticker universe.
              </p>
            </>
          ) : (
            <>
              <Search className="size-10 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold text-foreground">
                Ready to scan
              </h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Configure your filters in the sidebar and click{' '}
                <span className="font-medium text-primary">Run Screener</span>{' '}
                to find wheel-friendly stocks.
              </p>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
