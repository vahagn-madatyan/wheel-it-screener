import { useEffect, useRef, useState } from 'react';
import { motion, type Variants } from 'motion/react';
import { useScanStore } from '@/stores/scan-store';
import { useResultsStore } from '@/stores/results-store';
import { cn } from '@/lib/utils';

const kpiContainerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const kpiItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

// ---- Animated count-up hook ----

function useCountUp(target: number, duration = 600): number {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const fromRef = useRef<number>(0);

  useEffect(() => {
    // Cancel any running animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const from = fromRef.current;
    startRef.current = 0;

    function tick(ts: number) {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      const current = from + (target - from) * eased;

      setDisplay(current);
      fromRef.current = current;

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}

// ---- KPI Card ----

interface KpiCardProps {
  label: string;
  value: number | null;
  format: (n: number) => string;
}

function KpiCard({ label, value, format }: KpiCardProps) {
  const animated = useCountUp(value ?? 0);
  const hasValue = value !== null;

  return (
    <div className="rounded-lg bg-gradient-to-br from-primary/30 via-border to-border p-px">
      <div className="rounded-[calc(var(--radius)-1px)] bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 font-mono text-2xl font-bold tabular-nums tracking-tight text-foreground">
          {hasValue ? format(animated) : '—'}
        </p>
      </div>
    </div>
  );
}

// ---- KPI Cards grid ----

export function KpiCards() {
  const phase = useScanStore((s) => s.phase);
  const scannedCount = useScanStore((s) => s.scannedCount);
  const filteredResults = useResultsStore((s) => s.filteredResults);

  const hasScanData = phase === 'complete' || phase === 'running';

  // Compute averages from filtered results
  const { avgScore, avgPremium } = (() => {
    if (filteredResults.length === 0) return { avgScore: 0, avgPremium: 0 };

    let scoreSum = 0;
    let premSum = 0;
    let premCount = 0;

    for (const r of filteredResults) {
      scoreSum += r.wheelScore ?? 0;
      if (r.premiumYield != null) {
        premSum += r.premiumYield;
        premCount++;
      }
    }

    return {
      avgScore: scoreSum / filteredResults.length,
      avgPremium: premCount > 0 ? premSum / premCount : 0,
    };
  })();

  return (
    <motion.div
      className={cn('grid grid-cols-2 gap-3 md:grid-cols-4')}
      data-testid="kpi-cards"
      variants={kpiContainerVariants}
      initial="hidden"
      animate={hasScanData ? 'visible' : 'hidden'}
    >
      <motion.div variants={kpiItemVariants}>
        <KpiCard
          label="Tickers Scanned"
          value={hasScanData ? scannedCount : null}
          format={(n) => Math.round(n).toLocaleString()}
        />
      </motion.div>
      <motion.div variants={kpiItemVariants}>
        <KpiCard
          label="Qualified"
          value={hasScanData ? filteredResults.length : null}
          format={(n) => Math.round(n).toLocaleString()}
        />
      </motion.div>
      <motion.div variants={kpiItemVariants}>
        <KpiCard
          label="Avg Score"
          value={hasScanData ? avgScore : null}
          format={(n) => n.toFixed(1)}
        />
      </motion.div>
      <motion.div variants={kpiItemVariants}>
        <KpiCard
          label="Avg Premium"
          value={hasScanData ? avgPremium : null}
          format={(n) => `${n.toFixed(2)}%`}
        />
      </motion.div>
    </motion.div>
  );
}
