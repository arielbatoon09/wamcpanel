"use client";

import { useState, useEffect } from "react";
import { useServer, useUpdateServer } from "@/services/server-service";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ServerMetricsSection } from "./server-metrics-section";
import { Spinner } from "@/components/ui/spinner";
import { activityLogService, ActivityLogEntry } from "@/services/activity-log-service";

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function ServerOverviewTab({ id }: { id: string }) {
  const router = useRouter();
  const { data: server, isLoading } = useServer(id);
  const updateMutation = useUpdateServer();
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);

  useEffect(() => {
    activityLogService.list(id)
      .then((data) => {
        setLogs(data.slice(0, 3));
      })
      .catch(console.error);
  }, [id, server]);

  if (isLoading || !server) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner className="h-6 w-6 text-primary" />
      </div>
    );
  }

  const pvp = server.settings?.["pvp"] === "true";
  const whitelist = server.settings?.["white-list"] === "true";
  const onlineMode = server.settings?.["online-mode"] === "true";
  const allowFlight = server.settings?.["allow-flight"] === "true";

  const handleToggle = (key: string, currentValue: boolean) => {
    updateMutation.mutate({
      id,
      data: {
        settings: {
          [key]: String(!currentValue),
        },
      },
    });
  };

  const sftpHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const sftpPort = "2022";

  return (
    <div className="grid h-auto animate-in grid-cols-1 gap-6 duration-300 fade-in lg:h-full lg:grid-cols-3">
      <Card className="flex h-auto flex-col border border-border/80 bg-card/65 p-5 lg:col-span-2 lg:h-full">
        <div className="flex min-h-0 flex-1 flex-col space-y-5">
          {/* Host Info */}
          <div className="shrink-0">
            <h4 className="mb-2 border-b border-border/40 pb-1 font-mono text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">Node & Host Specs</h4>
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="rounded-lg border border-border/40 bg-secondary/30 p-2.5">
                <span className="mb-0.5 block text-[9px] text-muted-foreground">Host Hostname</span>
                <span className="block truncate font-bold text-foreground">{server.host}</span>
              </div>
              <div className="rounded-lg border border-border/40 bg-secondary/30 p-2.5">
                <span className="mb-0.5 block text-[9px] text-muted-foreground">Connection Port</span>
                <span className="block font-bold text-foreground">{server.port}</span>
              </div>
              <div className="rounded-lg border border-border/40 bg-secondary/30 p-2.5">
                <span className="mb-0.5 block text-[9px] text-muted-foreground">Engine Software</span>
                <span className="block font-bold text-foreground">
                  {server.software} ({server.version})
                </span>
              </div>
              <div className="rounded-lg border border-border/40 bg-secondary/30 p-2.5">
                <span className="mb-0.5 block text-[9px] text-muted-foreground">Node Location</span>
                <span className="block font-bold text-foreground">Local Node</span>
              </div>
            </div>
          </div>

          {/* SFTP Credentials */}
          <div className="shrink-0">
            <h4 className="mb-2 border-b border-border/40 pb-1 font-mono text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">SFTP Connection Details</h4>
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="rounded-lg border border-border/40 bg-secondary/30 p-2.5">
                <span className="mb-0.5 block text-[9px] text-muted-foreground">SFTP IP Address</span>
                <span className="block font-bold text-foreground">{sftpHost}</span>
              </div>
              <div className="rounded-lg border border-border/40 bg-secondary/30 p-2.5">
                <span className="mb-0.5 block text-[9px] text-muted-foreground">SFTP Username</span>
                <span className="block font-bold text-primary">admin.{id}</span>
              </div>
              <div className="rounded-lg border border-border/40 bg-secondary/30 p-2.5">
                <span className="mb-0.5 block text-[9px] text-muted-foreground">SFTP Port</span>
                <span className="block font-bold text-foreground">{sftpPort}</span>
              </div>
              <div className="rounded-lg border border-border/40 bg-secondary/30 p-2.5">
                <span className="mb-0.5 block text-[9px] text-muted-foreground">SFTP Password</span>
                <span className="block font-bold text-muted-foreground italic">[Same as panel password]</span>
              </div>
            </div>
          </div>

          {/* Quick Toggles */}
          <div className="shrink-0">
            <h4 className="mb-2 border-b border-border/40 pb-1 font-mono text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">Quick Config Toggles</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/20 p-2">
                <span className="text-[11px] font-semibold text-foreground/80">PVP Combat</span>
                <Checkbox
                  id="ov-pvp"
                  checked={pvp}
                  disabled={updateMutation.isPending}
                  onCheckedChange={() => handleToggle("pvp", pvp)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/20 p-2">
                <span className="text-[11px] font-semibold text-foreground/80">Server Whitelist</span>
                <Checkbox
                  id="ov-whitelist"
                  checked={whitelist}
                  disabled={updateMutation.isPending}
                  onCheckedChange={() => handleToggle("white-list", whitelist)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/20 p-2">
                <span className="text-[11px] font-semibold text-foreground/80">Online Mode</span>
                <Checkbox
                  id="ov-online"
                  checked={onlineMode}
                  disabled={updateMutation.isPending}
                  onCheckedChange={() => handleToggle("online-mode", onlineMode)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/20 p-2">
                <span className="text-[11px] font-semibold text-foreground/80">Allow Flight</span>
                <Checkbox
                  id="ov-flight"
                  checked={allowFlight}
                  disabled={updateMutation.isPending}
                  onCheckedChange={() => handleToggle("allow-flight", allowFlight)}
                />
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="flex min-h-0 flex-1 flex-col">
            <h4 className="mb-2 shrink-0 border-b border-border/40 pb-1 font-mono text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">Recent Panel Activity</h4>
            <div className="mt-1 flex-1 space-y-2 overflow-y-auto pr-1 font-mono text-[11px]">
              {logs.length === 0 ? (
                <div className="flex h-16 items-center justify-center text-muted-foreground/50">
                  No recent activity logs.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between rounded-lg border border-border/20 bg-secondary/15 p-2">
                    <span className="text-foreground/80 truncate pr-2">
                      {log.message}
                    </span>
                    <span className="shrink-0 text-[9px] text-muted-foreground">
                      {formatRelativeTime(log.timestamp)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>
      <div className="h-full">
        <ServerMetricsSection id={id} onViewAllPlayers={() => router.push(`/server/${id}/players`)} />
      </div>
    </div>
  );
}

