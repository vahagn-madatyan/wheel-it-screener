import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarSection } from "@/components/layout/SidebarSection";
import { ApiKeysSection } from "@/components/sidebar/ApiKeysSection";
import { StockFiltersSection } from "@/components/sidebar/StockFiltersSection";
import { WheelCriteriaSection } from "@/components/sidebar/WheelCriteriaSection";
import { ScoringWeightsSection } from "@/components/sidebar/ScoringWeightsSection";
import { ActionButtons } from "@/components/sidebar/ActionButtons";

export function App() {
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
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-primary">
            WheelScan
          </h2>
          <p className="mt-2 text-muted-foreground">
            Configure filters in the sidebar, then run a scan.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
