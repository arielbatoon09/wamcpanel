"use client"

import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/common/status-badge"
import { ServerAPIResponse } from "@/constants/servers"
import { useServerStore } from "@/hooks/useServerStore"
import { Play, Square, RotateCw, Terminal, Cpu, HardDrive, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"

interface ServerCardProps {
  server: ServerAPIResponse
}

export function ServerCard({ server }: ServerCardProps) {
  const router = useRouter()
  const { startServer, stopServer, restartServer } = useServerStore()

  const isOnline = server.status === "online"
  const isOffline = server.status === "offline"
  const isStarting = server.status === "starting"
  const isStopping = server.status === "stopping"

  // Quick statistics
  const ramPercent = server.ramLimit > 0 ? (server.metrics.ramUsage / server.ramLimit) * 100 : 0
  const cpuPercent = server.cpuLimit > 0 ? (server.metrics.cpuUsage / server.cpuLimit) * 100 : 0
  const playerPercent = server.maxPlayers > 0 ? (server.currentPlayers / server.maxPlayers) * 100 : 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        onClick={() => router.push(`/server/${server.id}`)}
        className="overflow-hidden backdrop-blur-sm bg-card/65 border border-border/80 flex flex-col justify-between h-[320px] shadow-sm hover:border-primary/30 transition-all duration-300 relative group cursor-pointer"
      >
        
        {/* Glow Header */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Top Info */}
        <div className="p-5">
          <div className="flex justify-between items-start gap-2 mb-2">
            <div>
              <h3 className="font-bold text-lg leading-tight tracking-tight group-hover:text-primary transition-colors duration-200">
                {server.name}
              </h3>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {server.host}:{server.port}
              </p>
            </div>
            <StatusBadge status={server.status} />
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px] mt-2 mb-4 leading-relaxed">
            {server.description}
          </p>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-2.5 bg-secondary/50 border border-border/50 rounded-lg p-3 text-xs font-mono">
            {/* CPU */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-wider font-semibold">
                <Cpu className="h-3 w-3" /> CPU
              </span>
              <span className="font-bold mt-1 text-foreground/90">
                {isOnline ? `${server.metrics.cpuUsage.toFixed(1)}%` : "0.0%"}
              </span>
              <div className="w-full bg-border/40 h-1 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${isOnline ? cpuPercent : 0}%` }}
                />
              </div>
            </div>

            {/* RAM */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-wider font-semibold">
                <HardDrive className="h-3 w-3" /> RAM
              </span>
              <span className="font-bold mt-1 text-foreground/90">
                {isOnline ? `${(server.metrics.ramUsage / 1024).toFixed(1)} GB` : "0.0 GB"}
              </span>
              <div className="w-full bg-border/40 h-1 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${isOnline ? ramPercent : 0}%` }}
                />
              </div>
            </div>

            {/* Players */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-wider font-semibold">
                <Users className="h-3 w-3" /> Players
              </span>
              <span className="font-bold mt-1 text-foreground/90">
                {isOnline ? `${server.currentPlayers} / ${server.maxPlayers}` : "0 / 0"}
              </span>
              <div className="w-full bg-border/40 h-1 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${isOnline ? playerPercent : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 bg-secondary/35 border-t border-border/50 flex items-center justify-between gap-2 mt-auto">
          {/* Power Toggles */}
          <div className="flex gap-1">
            {isOffline && (
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  startServer(server.id)
                }}
                className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
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
                    e.stopPropagation()
                    stopServer(server.id)
                  }}
                  className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                  title="Stop Server"
                >
                  <Square className="h-3.5 w-3.5 fill-rose-500/10" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    restartServer(server.id)
                  }}
                  className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 cursor-pointer"
                  title="Restart Server"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </Button>
              </>
            )}

            {(isStarting || isStopping) && (
              <Button
                variant="outline"
                size="icon"
                disabled
                className="h-8 w-8 animate-spin text-muted-foreground"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-md font-semibold tracking-wide uppercase">
              {server.software}
            </span>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/server/${server.id}/console`)
              }}
              className="h-8 text-xs font-semibold cursor-pointer"
            >
              <Terminal className="h-3.5 w-3.5 mr-1" />
              Console
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
