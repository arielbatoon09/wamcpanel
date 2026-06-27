"use client";

import { useState, useEffect } from "react";
import { useServerStore } from "@/hooks/useServerStore";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Cpu, HardDrive, Settings, Activity, Users } from "lucide-react";
import { playerService, PlayerItem } from "@/services/player-service";

interface ServerMetricsSectionProps {
  id: string;
  onViewAllPlayers?: () => void;
}

export function ServerMetricsSection({ id, onViewAllPlayers }: ServerMetricsSectionProps) {
  const { servers } = useServerStore();
  const server = servers.find((s) => s.id === id);
  const [onlinePlayers, setOnlinePlayers] = useState<PlayerItem[]>([]);

  const isOnline = server?.status === "online";

  useEffect(() => {
    if (!isOnline) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOnlinePlayers([]);
      return;
    }

    const fetchPlayers = async () => {
      try {
        const data = await playerService.list(id);
        setOnlinePlayers(data);
      } catch (err) {
        console.error("Failed to fetch players in metrics section:", err);
      }
    };

    fetchPlayers();
    const interval = setInterval(fetchPlayers, 5000);
    return () => clearInterval(interval);
  }, [id, isOnline]);

  if (!server) return null;

  const ramLimitGB = (server.ramLimit / 1024).toFixed(1);
  const ramUsageGB = (server.metrics.ramUsage / 1024).toFixed(1);
  const ramPercent = server.ramLimit > 0 ? (server.metrics.ramUsage / server.ramLimit) * 100 : 0;
  const cpuPercent = server.cpuLimit > 0 ? (server.metrics.cpuUsage / server.cpuLimit) * 100 : 0;

  // Actual Disk Storage calculation (in bytes from API)
  const diskUsageBytes = server.metrics.diskUsage || 0;
  const diskUsageGB = (diskUsageBytes / (1024 * 1024 * 1024)).toFixed(3); // Show precise GB
  const diskLimitGB = 50.0;
  const diskPercent = Math.min(100, (diskUsageBytes / (diskLimitGB * 1024 * 1024 * 1024)) * 100);

  // Format Uptime
  const formatUptime = (seconds: number) => {
    if (seconds <= 0) return "0s";
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(" ");
  };

  return (
    <Card className="flex h-full flex-col border border-border bg-card/65 p-5 backdrop-blur-sm">
      <div className="flex min-h-0 flex-1 flex-col space-y-5">
        {/* Resource Usage Section */}
        <div className="shrink-0 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="font-mono text-sm font-bold tracking-wider uppercase">Resource Usage</h3>
          </div>

          {/* CPU Gauge */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-mono font-medium text-muted-foreground uppercase">
                <Cpu className="h-3.5 w-3.5" /> CPU Usage
              </span>
              <span className="font-mono font-bold">
                {isOnline ? `${server.metrics.cpuUsage.toFixed(1)}%` : "0%"} / {server.cpuLimit}%
              </span>
            </div>
            <Progress value={isOnline ? cpuPercent : 0} className="h-2" />
          </div>

          {/* RAM Gauge */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-mono font-medium text-muted-foreground uppercase">
                <HardDrive className="h-3.5 w-3.5" /> Memory (RAM)
              </span>
              <span className="font-mono font-bold">
                {isOnline ? `${ramUsageGB} GB` : "0.0 GB"} / {ramLimitGB} GB
              </span>
            </div>
            <Progress value={isOnline ? ramPercent : 0} className="h-2" />
          </div>

          {/* Disk Gauge */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-mono font-medium text-muted-foreground uppercase">
                <HardDrive className="h-3.5 w-3.5" /> Disk Storage
              </span>
              <span className="font-mono font-bold">{diskUsageGB} GB / Unmetered</span>
            </div>
            <Progress value={diskPercent} className="h-2" />
          </div>

          {/* Network and Uptime Grid */}
          <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
            <div className="flex flex-col rounded-lg border border-border/40 bg-secondary/40 p-2">
              <span className="mb-0.5 text-[8px] text-muted-foreground uppercase">Network I/O</span>
              <span className="truncate font-bold text-foreground/95">{isOnline ? "↑ 1.2M/s ↓ 4.8M/s" : "Offline"}</span>
            </div>
            <div className="flex flex-col rounded-lg border border-border/40 bg-secondary/40 p-2">
              <span className="mb-0.5 text-[8px] text-muted-foreground uppercase">Uptime</span>
              <span className="truncate font-bold text-foreground/95">{isOnline ? formatUptime(server.metrics.uptime) : "Offline"}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="shrink-0 border-t border-border/40" />

        {/* Specifications / Configs Card */}
        <div className="shrink-0 space-y-3">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Settings className="h-4 w-4 text-primary" />
            <h3 className="font-mono text-sm font-bold tracking-wider uppercase">Server Specs</h3>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="flex justify-between border-b border-border/40 py-0.5">
              <span className="text-muted-foreground">Software Platform</span>
              <span className="font-semibold text-primary">{server.software}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 py-0.5">
              <span className="text-muted-foreground">Software Version</span>
              <span className="font-semibold">{server.version}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 py-0.5">
              <span className="text-muted-foreground">Binding IP Port</span>
              <span className="font-semibold">{server.port}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground">Java VM Env</span>
              <span className="font-semibold text-foreground/90">Java {server.javaVersion || "21"} (64-Bit)</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="shrink-0 border-t border-border/40" />

        {/* Active Players Section */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-mono text-sm font-bold tracking-wider uppercase">Active Players</h3>
            </div>
            {onViewAllPlayers && isOnline && (
              <Button variant="link" size="xs" onClick={onViewAllPlayers} className="h-5 cursor-pointer px-1.5 text-[10px] font-semibold text-primary hover:text-primary/80">
                View All
              </Button>
            )}
          </div>

          <div className="mt-2 min-h-[80px] flex-1 space-y-1.5 overflow-y-auto pr-1 font-mono text-[11px]">
            {isOnline ? (
              onlinePlayers.length === 0 ? (
                <div className="py-6 text-center text-[11px] text-muted-foreground italic">No players online.</div>
              ) : (
                onlinePlayers.map((player) => (
                  <div key={player.name} className="flex items-center rounded-lg border border-border/20 bg-secondary/15 p-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="max-w-[200px] truncate font-semibold text-foreground/80">
                        {player.name.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "")}
                      </span>
                    </div>
                  </div>
                ))
              )
            ) : (
              <div className="py-6 text-center text-[11px] text-muted-foreground italic">No players online (Server offline)</div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
