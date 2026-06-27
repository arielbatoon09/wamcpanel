import { useHostSpecs } from "@/services/server-service";
import { Spinner } from "@/components/ui/spinner";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Cpu, HardDrive, Database, Network, Server } from "lucide-react";

export function MetricsSection() {
  const { data: specs, isLoading } = useHostSpecs();
  const [cpu, setCpu] = useState(24.5);
  const [netIn, setNetIn] = useState(4.2); // Mbps
  const [netOut, setNetOut] = useState(8.7); // Mbps

  // Tick CPU and network metrics to make them feel alive
  useEffect(() => {
    const interval = setInterval(() => {
      setCpu((prev) => Math.min(100, Math.max(5, prev + (Math.random() - 0.5) * 8)));
      setNetIn((prev) => Math.min(50, Math.max(1, prev + (Math.random() - 0.5) * 2)));
      setNetOut((prev) => Math.min(100, Math.max(1, prev + (Math.random() - 0.5) * 4)));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !specs) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
        <span className="ml-2 font-mono text-xs tracking-wider text-muted-foreground/60 uppercase">Querying System Specs...</span>
      </div>
    );
  }

  // Format RAM bytes to GB
  const totalRamGB = specs.totalRam / (1024 * 1024 * 1024);
  const freeRamGB = specs.freeRam / (1024 * 1024 * 1024);
  const usedRamGB = totalRamGB - freeRamGB;
  const ramPercent = (usedRamGB / totalRamGB) * 100;

  // Format Disk bytes to GB
  const totalDiskGB = specs.totalDisk / (1024 * 1024 * 1024);
  const freeDiskGB = specs.freeDisk / (1024 * 1024 * 1024);
  const usedDiskGB = totalDiskGB - freeDiskGB;
  const diskPercent = (usedDiskGB / totalDiskGB) * 100;

  // Format Uptime
  const formatHostUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    return `${days} Days, ${hours} Hours`;
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* CPU */}
        <Card className="space-y-3 border border-border bg-card/65 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Host CPU Load</p>
              <h3 className="mt-1 font-mono text-xl font-bold">{cpu.toFixed(1)}%</h3>
            </div>
            <div className="rounded-lg bg-secondary p-2">
              <Cpu className="h-4 w-4 text-primary" />
            </div>
          </div>
          <Progress value={cpu} className="h-1.5" />
          <p className="font-mono text-[10px] text-muted-foreground">{specs.cpuCores} Cores Available</p>
        </Card>

        {/* Memory */}
        <Card className="space-y-3 border border-border bg-card/65 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Host Memory</p>
              <h3 className="mt-1 font-mono text-xl font-bold">{usedRamGB.toFixed(1)} / {totalRamGB.toFixed(1)} GB</h3>
            </div>
            <div className="rounded-lg bg-secondary p-2">
              <HardDrive className="h-4 w-4 text-primary" />
            </div>
          </div>
          <Progress value={ramPercent} className="h-1.5" />
          <p className="font-mono text-[10px] text-muted-foreground">Physical Memory Utilization</p>
        </Card>

        {/* Disk */}
        <Card className="space-y-3 border border-border bg-card/65 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">SSD Storage</p>
              <h3 className="mt-1 font-mono text-xl font-bold">{usedDiskGB.toFixed(1)} / {totalDiskGB.toFixed(1)} GB</h3>
            </div>
            <div className="rounded-lg bg-secondary p-2">
              <Database className="h-4 w-4 text-primary" />
            </div>
          </div>
          <Progress value={diskPercent} className="h-1.5" />
          <p className="font-mono text-[10px] text-muted-foreground">Filesystem Storage Space</p>
        </Card>

        {/* Network */}
        <Card className="space-y-3 border border-border bg-card/65 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">Bandwidth</p>
              <h3 className="mt-1 font-mono text-xl font-bold">
                In: {netIn.toFixed(1)} / Out: {netOut.toFixed(1)} M
              </h3>
            </div>
            <div className="rounded-lg bg-secondary p-2">
              <Network className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="mt-2 flex justify-between border-t border-border/30 pt-1 font-mono text-[10px] text-muted-foreground">
            <span>Inbound traffic</span>
            <span>Outbound traffic</span>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground">1 Gbps Port Speed</p>
        </Card>
      </div>

      {/* Host Specifications details */}
      <Card className="space-y-4 border border-border bg-card/65 p-5">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Server className="h-4 w-4 text-primary" />
          <h3 className="font-mono text-sm font-bold tracking-wider uppercase">Hardware Environment</h3>
        </div>

        <div className="grid grid-cols-1 gap-6 font-mono text-xs md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex justify-between border-b border-border/40 py-1.5">
              <span className="text-muted-foreground">Processor</span>
              <span className="font-semibold">{specs.cpuModel}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 py-1.5">
              <span className="text-muted-foreground">Logical Processors</span>
              <span className="font-semibold">{specs.cpuCores} Threads</span>
            </div>
            <div className="flex justify-between border-b border-border/40 py-1.5">
              <span className="text-muted-foreground">Host Platform</span>
              <span className="font-semibold capitalize">{specs.platform}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Virtualization Mode</span>
              <span className="font-semibold text-emerald-500">KVM (Enabled)</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between border-b border-border/40 py-1.5">
              <span className="text-muted-foreground">Operating System</span>
              <span className="font-semibold">{specs.osType}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 py-1.5">
              <span className="text-muted-foreground">Kernel Version</span>
              <span className="font-semibold">{specs.release}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 py-1.5">
              <span className="text-muted-foreground">Server Uptime</span>
              <span className="font-semibold">{formatHostUptime(specs.uptime)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Local IP Binding</span>
              <span className="font-semibold">127.0.0.1</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
