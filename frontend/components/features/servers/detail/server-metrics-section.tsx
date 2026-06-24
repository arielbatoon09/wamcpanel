"use client"

import { useServerStore } from "@/hooks/useServerStore"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Cpu, HardDrive, Clock, Settings, Info, Activity, Users } from "lucide-react"

interface ServerMetricsSectionProps {
  id: string
  onViewAllPlayers?: () => void
}

export function ServerMetricsSection({ id, onViewAllPlayers }: ServerMetricsSectionProps) {
  const { servers } = useServerStore()
  const server = servers.find((s) => s.id === id)

  if (!server) return null

  const isOnline = server.status === "online"
  const ramLimitGB = (server.ramLimit / 1024).toFixed(1)
  const ramUsageGB = (server.metrics.ramUsage / 1024).toFixed(1)
  const ramPercent = server.ramLimit > 0 ? (server.metrics.ramUsage / server.ramLimit) * 100 : 0
  const cpuPercent = server.cpuLimit > 0 ? (server.metrics.cpuUsage / server.cpuLimit) * 100 : 0

  // Format Uptime
  const formatUptime = (seconds: number) => {
    if (seconds <= 0) return "0s"
    const days = Math.floor(seconds / (3600 * 24))
    const hours = Math.floor((seconds % (3600 * 24)) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

    return parts.join(" ")
  }

  return (
    <Card className="p-5 border border-border backdrop-blur-sm bg-card/65 h-full flex flex-col">
      <div className="space-y-5 flex-1 flex flex-col min-h-0">
        
        {/* Resource Usage Section */}
        <div className="space-y-4 shrink-0">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm uppercase tracking-wider font-mono">Resource Usage</h3>
          </div>

          {/* CPU Gauge */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground font-medium uppercase font-mono">
                <Cpu className="h-3.5 w-3.5" /> CPU Usage
              </span>
              <span className="font-bold font-mono">
                {isOnline ? `${server.metrics.cpuUsage.toFixed(1)}%` : "0%"} / {server.cpuLimit}%
              </span>
            </div>
            <Progress value={isOnline ? cpuPercent : 0} className="h-2" />
          </div>

          {/* RAM Gauge */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground font-medium uppercase font-mono">
                <HardDrive className="h-3.5 w-3.5" /> Memory (RAM)
              </span>
              <span className="font-bold font-mono">
                {isOnline ? `${ramUsageGB} GB` : "0.0 GB"} / {ramLimitGB} GB
              </span>
            </div>
            <Progress value={isOnline ? ramPercent : 0} className="h-2" />
          </div>

          {/* Disk Gauge */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground font-medium uppercase font-mono">
                <HardDrive className="h-3.5 w-3.5" /> Disk Storage
              </span>
              <span className="font-bold font-mono">
                {isOnline ? "14.2 GB" : "0.0 GB"} / 50.0 GB
              </span>
            </div>
            <Progress value={isOnline ? 28.4 : 0} className="h-2" />
          </div>

          {/* Network and Uptime Grid */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="flex flex-col bg-secondary/40 border border-border/40 p-2 rounded-lg">
              <span className="text-muted-foreground uppercase text-[8px] mb-0.5">Network I/O</span>
              <span className="font-bold text-foreground/95 truncate">
                {isOnline ? "↑ 1.2M/s ↓ 4.8M/s" : "Offline"}
              </span>
            </div>
            <div className="flex flex-col bg-secondary/40 border border-border/40 p-2 rounded-lg">
              <span className="text-muted-foreground uppercase text-[8px] mb-0.5">Uptime</span>
              <span className="font-bold text-foreground/95 truncate">
                {isOnline ? formatUptime(server.metrics.uptime) : "Offline"}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/40 shrink-0" />

        {/* Specifications / Configs Card */}
        <div className="space-y-3 shrink-0">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Settings className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm uppercase tracking-wider font-mono">Server Specs</h3>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="flex justify-between py-0.5 border-b border-border/40">
              <span className="text-muted-foreground">Software Platform</span>
              <span className="font-semibold text-primary">{server.software}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-border/40">
              <span className="text-muted-foreground">Software Version</span>
              <span className="font-semibold">{server.version}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-border/40">
              <span className="text-muted-foreground">Binding IP Port</span>
              <span className="font-semibold">{server.port}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground">Java VM Env</span>
              <span className="font-semibold text-foreground/90">OpenJDK 17 (64-Bit)</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/40 shrink-0" />

        {/* Active Players Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between border-b border-border pb-2 shrink-0">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm uppercase tracking-wider font-mono">Active Players</h3>
            </div>
            {onViewAllPlayers && isOnline && (
              <Button
                variant="link"
                size="xs"
                onClick={onViewAllPlayers}
                className="h-5 px-1.5 text-[10px] text-primary hover:text-primary/80 font-semibold cursor-pointer"
              >
                View All
              </Button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 text-[11px] font-mono mt-2 space-y-1.5 min-h-[80px]">
            {isOnline ? (
              <>
                <div className="p-2 bg-secondary/15 rounded-lg border border-border/20 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-foreground/80">player_one</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Ping: 42ms</span>
                </div>
                <div className="p-2 bg-secondary/15 rounded-lg border border-border/20 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-foreground/80">redstone_pro</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Ping: 18ms</span>
                </div>
                <div className="p-2 bg-secondary/15 rounded-lg border border-border/20 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-foreground/80">builder2</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Ping: 75ms</span>
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-6 italic text-[11px]">
                No players online (Server offline)
              </div>
            )}
          </div>
        </div>

      </div>
    </Card>
  )
}
