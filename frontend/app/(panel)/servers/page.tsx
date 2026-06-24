import { DashboardStats } from "@/components/features/dashboard/dashboard-stats";
import { ServerListSection } from "@/components/features/dashboard/server-list-section";

export const metadata = {
  title: "Minecraft Server Panel - Servers",
  description: "Manage and monitor all your deployed Minecraft servers in real-time.",
};

export default function ServersPage() {
  return (
    <div className="space-y-6">
      {/* Page Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Server Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Monitor host node allocations, resource utilization, and toggle server states.</p>
      </div>

      {/* Stats Summary Section */}
      <section aria-label="Global Stats">
        <DashboardStats />
      </section>

      {/* Servers List Section */}
      <section aria-label="Servers List">
        <ServerListSection />
      </section>
    </div>
  );
}
