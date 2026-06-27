"use client";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/status-badge";
import { ServerAPIResponse } from "@/constants/servers";
import { useServerStore } from "@/hooks/useServerStore";
import { Play, Square, RotateCw, Terminal, Cpu, HardDrive, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

interface ServerCardProps {
  server: ServerAPIResponse;
}

export function ServerCard({ server }: ServerCardProps) {
  const router = useRouter();
  const { startServer, stopServer, restartServer } = useServerStore();

  const isOnline = server.status === "online";
  const isOffline = server.status === "offline";
  const isStarting = server.status === "starting";
  const isStopping = server.status === "stopping";

  // Quick statistics
  const ramPercent = server.ramLimit > 0 ? (server.metrics.ramUsage / server.ramLimit) * 100 : 0;
  const cpuPercent = server.cpuLimit > 0 ? (server.metrics.cpuUsage / server.cpuLimit) * 100 : 0;
  const playerPercent = server.maxPlayers > 0 ? (server.currentPlayers / server.maxPlayers) * 100 : 0;

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} whileHover={{ y: -4 }} transition={{ duration: 0.3 }}>
      <Card
        onClick={() => router.push(`/server/${server.id}`)}
        className="!pb-0 group relative flex h-[320px] cursor-pointer flex-col justify-between overflow-hidden border border-border/80 bg-card/65 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/30"
      >
        {/* Glow Header */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Top Info */}
        <div className="p-5">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg leading-tight font-bold tracking-tight transition-colors duration-200 group-hover:text-primary">{server.name}</h3>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {server.host}:{server.port}
              </p>
            </div>
            <StatusBadge status={server.status} />
          </div>

          <p className="mt-2 mb-4 line-clamp-2 min-h-[32px] text-xs leading-relaxed text-muted-foreground">{server.description || "A Minecraft Server"}</p>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-2.5 rounded-lg border border-border/50 bg-secondary/50 p-3 font-mono text-xs">
            {/* CPU */}
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                <Cpu className="h-3 w-3" /> CPU
              </span>
              <span className="mt-1 font-bold text-foreground/90">{isOnline ? `${server.metrics.cpuUsage.toFixed(1)}%` : "0.0%"}</span>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-border/40">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${isOnline ? cpuPercent : 0}%` }} />
              </div>
            </div>

            {/* RAM */}
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                <HardDrive className="h-3 w-3" /> RAM
              </span>
              <span className="mt-1 font-bold text-foreground/90">{isOnline ? `${(server.metrics.ramUsage / 1024).toFixed(1)} GB` : "0.0 GB"}</span>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-border/40">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${isOnline ? ramPercent : 0}%` }} />
              </div>
            </div>

            {/* Players */}
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                <Users className="h-3 w-3" /> Players
              </span>
              <span className="mt-1 font-bold text-foreground/90">{isOnline ? `${server.currentPlayers} / ${server.maxPlayers}` : "0 / 0"}</span>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-border/40">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${isOnline ? playerPercent : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/50 bg-secondary/35 p-4">
          {/* Power Toggles */}
          <div className="flex gap-1">
            {isOffline && (
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  startServer(server.id);
                }}
                className="h-8 w-8 cursor-pointer text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-600"
                title="Start Server"
              >
                <Play className="h-4 w-4 fill-emerald-500/10" />
              </Button>
            )}

            {isOnline && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    stopServer(server.id);
                  }}
                  className="h-8 w-8 cursor-pointer text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                  title="Stop Server"
                >
                  <Square className="h-3.5 w-3.5 fill-rose-500/10" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    restartServer(server.id);
                  }}
                  className="h-8 w-8 cursor-pointer text-amber-500 hover:bg-amber-500/10 hover:text-amber-600"
                  title="Restart Server"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </Button>
              </>
            )}

            {(isStarting || isStopping) && (
              <Button variant="outline" size="icon" disabled className="h-8 w-8 animate-spin text-muted-foreground">
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary uppercase">{server.software}</span>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/server/${server.id}/console`);
              }}
              className="h-8 cursor-pointer text-xs font-semibold"
            >
              <Terminal className="mr-1 h-3.5 w-3.5" />
              Console
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
