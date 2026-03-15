import { useCallback } from "react";
import { useFilterStore } from "@/stores/filter-store";
import { Switch } from "@/components/ui/switch";
import { NumberInput } from "./NumberInput";

const DTE_OPTIONS = [
  { value: 30, label: "30 days" },
  { value: 45, label: "45 days" },
  { value: 60, label: "60 days" },
  { value: 90, label: "90 days" },
];

const DELTA_OPTIONS = [
  { value: 0.20, label: "0.20" },
  { value: 0.25, label: "0.25" },
  { value: 0.30, label: "0.30" },
  { value: 0.35, label: "0.35" },
  { value: 0.40, label: "0.40" },
];

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function ToggleRow({ label, checked, onCheckedChange }: ToggleRowProps) {
  const id = `toggle-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="text-xs text-sidebar-foreground/80 cursor-pointer">
        {label}
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function WheelCriteriaSection() {
  const setFilter = useFilterStore((s) => s.setFilter);
  const minPremium = useFilterStore((s) => s.minPremium);
  const maxBP = useFilterStore((s) => s.maxBP);
  const targetDTE = useFilterStore((s) => s.targetDTE);
  const targetDelta = useFilterStore((s) => s.targetDelta);
  const minIVRank = useFilterStore((s) => s.minIVRank);
  const maxIVRank = useFilterStore((s) => s.maxIVRank);
  const requireDividends = useFilterStore((s) => s.requireDividends);
  const aboveSMA200 = useFilterStore((s) => s.aboveSMA200);
  const excludeEarnings = useFilterStore((s) => s.excludeEarnings);
  const requireWeeklies = useFilterStore((s) => s.requireWeeklies);
  const excludeRiskySectors = useFilterStore((s) => s.excludeRiskySectors);

  const handleDTEChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilter("targetDTE", parseInt(e.target.value, 10));
    },
    [setFilter],
  );

  const handleDeltaChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilter("targetDelta", parseFloat(e.target.value));
    },
    [setFilter],
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Premium & Buying Power */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        <NumberInput
          label="Min Premium (%)"
          value={minPremium}
          onChange={(v) => setFilter("minPremium", v ?? 0)}
          min={0}
          step={1}
          required
        />
        <NumberInput
          label="Max Buying Power ($)"
          value={maxBP}
          onChange={(v) => setFilter("maxBP", v ?? 0)}
          min={0}
          step={100}
          required
        />
      </div>

      {/* DTE & Delta Selects */}
      <div className="grid grid-cols-2 gap-x-3">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="dte-select"
            className="text-xs font-medium text-sidebar-foreground/70"
          >
            Target DTE
          </label>
          <select
            id="dte-select"
            value={targetDTE}
            onChange={handleDTEChange}
            className="h-8 w-full rounded-md border border-sidebar-border bg-sidebar px-2 text-sm text-sidebar-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {DTE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="delta-select"
            className="text-xs font-medium text-sidebar-foreground/70"
          >
            Target Delta
          </label>
          <select
            id="delta-select"
            value={targetDelta}
            onChange={handleDeltaChange}
            className="h-8 w-full rounded-md border border-sidebar-border bg-sidebar px-2 text-sm text-sidebar-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {DELTA_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* IV Rank Range */}
      <div className="grid grid-cols-2 gap-x-3">
        <NumberInput
          label="Min IV Rank"
          value={minIVRank}
          onChange={(v) => setFilter("minIVRank", v ?? 0)}
          min={0}
          max={100}
          step={1}
          required
        />
        <NumberInput
          label="Max IV Rank"
          value={maxIVRank}
          onChange={(v) => setFilter("maxIVRank", v ?? 0)}
          min={0}
          max={100}
          step={1}
          required
        />
      </div>

      {/* Toggle Switches */}
      <div className="flex flex-col gap-2 pt-1">
        <ToggleRow
          label="Require Dividends"
          checked={requireDividends}
          onCheckedChange={(v) => setFilter("requireDividends", v)}
        />
        <ToggleRow
          label="Above 200-day SMA"
          checked={aboveSMA200}
          onCheckedChange={(v) => setFilter("aboveSMA200", v)}
        />
        <ToggleRow
          label="Exclude Earnings (14d)"
          checked={excludeEarnings}
          onCheckedChange={(v) => setFilter("excludeEarnings", v)}
        />
        <ToggleRow
          label="Has Weekly Options"
          checked={requireWeeklies}
          onCheckedChange={(v) => setFilter("requireWeeklies", v)}
        />
        <ToggleRow
          label="Exclude Risky Sectors"
          checked={excludeRiskySectors}
          onCheckedChange={(v) => setFilter("excludeRiskySectors", v)}
        />
      </div>
    </div>
  );
}
