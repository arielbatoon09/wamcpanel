import { MetricsSection } from "@/components/features/metrics/metrics-section";

export const metadata = {
  title: "Server Panel - Metrics",
  description: "Global CPU, Memory, Disk, and Network performance indicators.",
};

export default function MetricsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">System Metrics</h1>
        <p className="mt-1 text-xs text-muted-foreground">Monitor global resources and hardware environment statistics.</p>
      </div>

      <MetricsSection />
    </div>
  );
}
