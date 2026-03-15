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

  if (phase === "idle" || phase === "complete") return null;

  const pct = Math.round(progress * 100);

  if (phase === "error") {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-3">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          <p className="text-sm font-medium text-destructive">
            Scan failed: {error}
          </p>
        </div>
      </div>
    );
  }

  // phase === "running"
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-3">
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
    </div>
  );
}
