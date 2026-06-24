"use client";

import { useState } from "react";
import { useServerStore } from "@/hooks/useServerStore";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ServerMetricsSection } from "./server-metrics-section";

export function ServerOverviewTab({ id }: { id: string }) {
  const router = useRouter();
  const { servers } = useServerStore();
  const server = servers.find((s) => s.id === id);

  const [pvp, setPvp] = useState<boolean>(true);
  const [whitelist, setWhitelist] = useState<boolean>(false);
  const [onlineMode, setOnlineMode] = useState<boolean>(true);
  const [allowFlight, setAllowFlight] = useState<boolean>(false);

  if (!server) return null;

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
                <span className="block font-bold text-foreground">SG-Dedicated-01</span>
              </div>
            </div>
          </div>

          {/* SFTP Credentials */}
          <div className="shrink-0">
            <h4 className="mb-2 border-b border-border/40 pb-1 font-mono text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">SFTP Connection Details</h4>
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="rounded-lg border border-border/40 bg-secondary/30 p-2.5">
                <span className="mb-0.5 block text-[9px] text-muted-foreground">SFTP IP Address</span>
                <span className="block font-bold text-foreground">sftp.panel.local</span>
              </div>
              <div className="rounded-lg border border-border/40 bg-secondary/30 p-2.5">
                <span className="mb-0.5 block text-[9px] text-muted-foreground">SFTP Username</span>
                <span className="block font-bold text-primary">admin.{id}</span>
              </div>
              <div className="rounded-lg border border-border/40 bg-secondary/30 p-2.5">
                <span className="mb-0.5 block text-[9px] text-muted-foreground">SFTP Port</span>
                <span className="block font-bold text-foreground">2022</span>
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
                <Checkbox id="ov-pvp" checked={pvp} onCheckedChange={(val) => setPvp(!!val)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/20 p-2">
                <span className="text-[11px] font-semibold text-foreground/80">Server Whitelist</span>
                <Checkbox id="ov-whitelist" checked={whitelist} onCheckedChange={(val) => setWhitelist(!!val)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/20 p-2">
                <span className="text-[11px] font-semibold text-foreground/80">Online Mode</span>
                <Checkbox id="ov-online" checked={onlineMode} onCheckedChange={(val) => setOnlineMode(!!val)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/20 p-2">
                <span className="text-[11px] font-semibold text-foreground/80">Allow Flight</span>
                <Checkbox id="ov-flight" checked={allowFlight} onCheckedChange={(val) => setAllowFlight(!!val)} />
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="flex min-h-0 flex-1 flex-col">
            <h4 className="mb-2 shrink-0 border-b border-border/40 pb-1 font-mono text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">Recent Panel Activity</h4>
            <div className="mt-1 flex-1 space-y-2 overflow-y-auto pr-1 font-mono text-[11px]">
              <div className="flex items-center justify-between rounded-lg border border-border/20 bg-secondary/15 p-2">
                <span className="text-foreground/80">
                  Server status changed to <span className="font-bold text-emerald-500">online</span>
                </span>
                <span className="text-[9px] text-muted-foreground">Just now</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/20 bg-secondary/15 p-2">
                <span className="text-foreground/80">Properties config saved successfully</span>
                <span className="text-[9px] text-muted-foreground">10 mins ago</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/20 bg-secondary/15 p-2">
                <span className="text-foreground/80">Automatic daily backup file generated</span>
                <span className="text-[9px] text-muted-foreground">2 hours ago</span>
              </div>
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
