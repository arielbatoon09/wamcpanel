"use client"

import { useServerStore } from "@/hooks/useServerStore"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { Play, Square, RotateCw, Skull, ArrowLeft, Terminal } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface ServerControlsHeaderProps {
  id: string
}

export function ServerControlsHeader({ id }: ServerControlsHeaderProps) {
  const router = useRouter()
  const { servers, startServer, stopServer, restartServer, killServer } = useServerStore()
  
  const server = servers.find((s) => s.id === id)

  if (!server) {
    return (
      <div className="flex justify-between items-center bg-card/45 p-4 rounded-xl border border-destructive/20 text-destructive text-sm font-semibold">
        Server not found!
        <Link href="/servers">
          <Button size="sm" variant="outline" className="cursor-pointer">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Server List
          </Button>
        </Link>
      </div>
    )
  }

  const isOnline = server.status === "online"
  const isOffline = server.status === "offline"
  const isStarting = server.status === "starting"
  const isStopping = server.status === "stopping"

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/40 border border-border p-5 rounded-2xl backdrop-blur-md">
      
      {/* Name and IP Info */}
      <div className="flex items-center gap-4">
        <Link href="/servers" passHref>
          <Button variant="outline" size="icon" className="h-10 w-10 cursor-pointer rounded-xl border border-border/80" title="Back to Server List">
            <ArrowLeft className="h-4 w-4 text-foreground/80" />
          </Button>
        </Link>

        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground">
              {server.name}
            </h1>
            <StatusBadge status={server.status} />
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            IP: <span className="text-foreground/80 font-semibold">{server.host}</span> Port: <span className="text-foreground/80 font-semibold">{server.port}</span>
          </p>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
        {/* Start */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => startServer(id)}
          disabled={!isOffline}
          className="cursor-pointer bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 text-emerald-500 disabled:opacity-40 disabled:bg-transparent h-9 px-3.5 font-semibold text-xs rounded-lg gap-1.5"
        >
          <Play className="h-3.5 w-3.5 fill-emerald-500/10" />
          Start
        </Button>

        {/* Restart */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => restartServer(id)}
          disabled={!isOnline}
          className="cursor-pointer bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20 text-amber-500 disabled:opacity-40 disabled:bg-transparent h-9 px-3.5 font-semibold text-xs rounded-lg gap-1.5"
        >
          <RotateCw className="h-3.5 w-3.5" />
          Restart
        </Button>

        {/* Stop */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => stopServer(id)}
          disabled={!isOnline}
          className="cursor-pointer bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/20 text-rose-500 disabled:opacity-40 disabled:bg-transparent h-9 px-3.5 font-semibold text-xs rounded-lg gap-1.5"
        >
          <Square className="h-3.5 w-3.5 fill-rose-500/10" />
          Stop
        </Button>

        {/* Force Kill */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => killServer(id)}
          disabled={isOffline}
          className="cursor-pointer bg-red-500/5 hover:bg-red-500/15 border-red-500/20 text-red-500 disabled:opacity-40 disabled:bg-transparent h-9 px-3.5 font-semibold text-xs rounded-lg gap-1.5 ml-auto md:ml-0"
        >
          <Skull className="h-3.5 w-3.5" />
          Kill
        </Button>
      </div>

    </div>
  )
}
