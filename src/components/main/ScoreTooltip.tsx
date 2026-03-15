import type { StockResult } from "@/types";
import { useFilterStore } from "@/stores/filter-store";
import { useShallow } from "zustand/react/shallow";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ScoreTooltipProps {
  stock: StockResult;
  children: React.ReactNode;
}

const COMPONENTS = [
  { label: "Premium", scoreKey: "premiumScore", weightKey: "weightPremium" },
  { label: "Liquidity", scoreKey: "liquidityScore", weightKey: "weightLiquidity" },
  { label: "Stability", scoreKey: "stabilityScore", weightKey: "weightStability" },
  { label: "Fundamentals", scoreKey: "fundamentalsScore", weightKey: "weightFundamentals" },
] as const;

function scoreColor(value: number): string {
  if (value >= 70) return "text-emerald-400";
  if (value >= 45) return "text-yellow-400";
  return "text-red-400";
}

export function ScoreTooltip({ stock, children }: ScoreTooltipProps) {
  const weights = useFilterStore(
    useShallow((s) => ({
      weightPremium: s.weightPremium,
      weightLiquidity: s.weightLiquidity,
      weightStability: s.weightStability,
      weightFundamentals: s.weightFundamentals,
    })),
  );

  const totalWeight =
    weights.weightPremium +
    weights.weightLiquidity +
    weights.weightStability +
    weights.weightFundamentals;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="left" className="w-56 p-0">
        <div className="space-y-0.5 p-3 text-xs">
          <p className="mb-1.5 font-semibold text-popover-foreground">
            Score Breakdown — {stock.symbol}
          </p>
          {COMPONENTS.map(({ label, scoreKey, weightKey }) => {
            const value = (stock[scoreKey] as number | undefined) ?? 0;
            const weight = weights[weightKey];
            const pct = totalWeight > 0 ? Math.round((weight / totalWeight) * 100) : 0;

            return (
              <div key={label} className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {label}{" "}
                  <span className="text-[10px] opacity-70">({pct}%)</span>
                </span>
                <span className={cn("tabular-nums font-medium", scoreColor(value))}>
                  {value.toFixed(1)}
                </span>
              </div>
            );
          })}

          <div className="my-1.5 border-t border-border" />

          <div className="flex items-center justify-between font-semibold">
            <span>Weighted Total</span>
            <span className="tabular-nums">
              {((stock.wheelScore ?? 0) / 100).toFixed(2)}
            </span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
