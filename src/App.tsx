import { useChainStore } from '@/stores/chain-store';
import { useResultsStore } from '@/stores/results-store';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Sidebar } from '@/components/layout/Sidebar';
import { SidebarSection } from '@/components/layout/SidebarSection';
import { ApiKeysSection } from '@/components/sidebar/ApiKeysSection';
import { StockFiltersSection } from '@/components/sidebar/StockFiltersSection';
import { WheelCriteriaSection } from '@/components/sidebar/WheelCriteriaSection';
import { ScoringWeightsSection } from '@/components/sidebar/ScoringWeightsSection';
import { ActionButtons } from '@/components/sidebar/ActionButtons';
import { ProgressBar } from '@/components/main/ProgressBar';
import { KpiCards } from '@/components/main/KpiCards';
import { ResultsTable } from '@/components/main/ResultsTable';
import { EmptyState } from '@/components/main/EmptyState';
import { ChainModal } from '@/components/main/ChainModal';
import { useScanStore } from '@/stores/scan-store';

// DEV: expose stores to window for browser testing (tree-shaken in production)
if (import.meta.env.DEV) {
  const w = window as unknown as Record<string, unknown>;
  w.__chainStore = useChainStore;
  w.__resultsStore = useResultsStore;
  w.__scanStore = useScanStore;
}

export function App() {
  const phase = useScanStore((s) => s.phase);
  const filteredResults = useResultsStore((s) => s.filteredResults);

  const showTable =
    filteredResults.length > 0 && (phase === 'complete' || phase === 'running');

  return (
    <DashboardLayout
      sidebar={
        <Sidebar>
          <SidebarSection title="API Keys">
            <ApiKeysSection />
          </SidebarSection>

          <SidebarSection title="Stock Filters">
            <StockFiltersSection />
          </SidebarSection>

          <SidebarSection title="Wheel Criteria">
            <WheelCriteriaSection />
          </SidebarSection>

          <SidebarSection title="Scoring Weights">
            <ScoringWeightsSection />
          </SidebarSection>

          <div className="px-4 py-3">
            <ActionButtons />
          </div>
        </Sidebar>
      }
    >
      <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 md:p-6">
        <KpiCards />
        <ProgressBar />
        {showTable ? <ResultsTable /> : <EmptyState />}
      </div>

      <ChainModal />
    </DashboardLayout>
  );
}
