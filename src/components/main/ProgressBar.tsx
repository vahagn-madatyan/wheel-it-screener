import { AnimatePresence, motion } from "motion/react";
import { useScanStore } from "@/stores/scan-store";
import { cn } from "@/lib/utils";

export function ProgressBar() {
  const phase = useScanStore((s) => s.phase);
  const progress = useScanStore((s) => s.progress);
  const currentTicker = useScanStore((s) => s.currentTicker);
  const scannedCount = useScanStore((s) => s.scannedCount);
  const totalCount = useScanStore((s) => s.totalCount);
  const candidateCount = useScanStore((s) => s.candidateCount);
  const error = useScanStore((s) => s.error);

  const isVisible = phase !== "idle" && phase !== "complete";
  const pct = Math.round(progress * 100);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="progress-bar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="mx-auto w-full max-w-xl px-4 py-3"
        >
          {phase === "error" ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
              <p className="text-sm font-medium text-destructive">
                Scan failed: {error}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Phase label and stats */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Scanning{currentTicker ? `: ${currentTicker}` : "…"}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {scannedCount}/{totalCount} · {candidateCount} candidates
                </span>
              </div>

              {/* Progress bar track */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full bg-primary transition-[width] duration-150 ease-out",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Percentage */}
              <p className="text-center text-xs tabular-nums text-muted-foreground">
                {pct}%
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
