import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarSection } from "@/components/layout/SidebarSection";

export function App() {
  return (
    <DashboardLayout
      sidebar={
        <Sidebar>
          <SidebarSection title="Universe">
            <p className="text-sm text-sidebar-foreground/70">
              Ticker selection controls will go here.
            </p>
          </SidebarSection>

          <SidebarSection title="Strategy">
            <p className="text-sm text-sidebar-foreground/70">
              DTE, delta, and premium filters will go here.
            </p>
          </SidebarSection>

          <SidebarSection title="Scoring">
            <p className="text-sm text-sidebar-foreground/70">
              Weight sliders and scoring config will go here.
            </p>
          </SidebarSection>
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
