import type { PutOption } from '@/types';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface PutScoreTooltipProps {
  put: PutOption;
  children: React.ReactNode;
}

const COMPONENTS = [
  { label: 'Spread', scoreKey: 'spreadScore', weight: 30 },
  { label: 'Liquidity', scoreKey: 'liquidityScore', weight: 25 },
  { label: 'Premium', scoreKey: 'premScore', weight: 20 },
  { label: 'Delta', scoreKey: 'deltaScore', weight: 15 },
  { label: 'IV', scoreKey: 'ivScore', weight: 10 },
] as const;

function scoreColor(value: number): string {
  if (value >= 70) return 'text-emerald-400';
  if (value >= 45) return 'text-yellow-400';
  return 'text-red-400';
}

export function PutScoreTooltip({ put, children }: PutScoreTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="left" className="w-56 p-0">
        <div className="space-y-0.5 p-3 text-xs">
          <p className="mb-1.5 font-semibold text-popover-foreground">
            Put Score — ${put.strike}
          </p>
          {COMPONENTS.map(({ label, scoreKey, weight }) => {
            const value = (put[scoreKey] as number | undefined) ?? 0;
            return (
              <div key={label} className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {label}{' '}
                  <span className="text-[10px] opacity-70">({weight}%)</span>
                </span>
                <span
                  className={cn('tabular-nums font-medium', scoreColor(value))}
                >
                  {value.toFixed(1)}
                </span>
              </div>
            );
          })}

          <div className="my-1.5 border-t border-border" />

          <div className="flex items-center justify-between font-semibold">
            <span>Weighted Total</span>
            <span className={cn('tabular-nums', scoreColor(put.putScore))}>
              {put.putScore}/100
            </span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
