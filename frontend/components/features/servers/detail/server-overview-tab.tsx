"use client"

import { useState } from "react"
import { useServerStore } from "@/hooks/useServerStore"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ServerMetricsSection } from "./server-metrics-section"

export function ServerOverviewTab({ id }: { id: string }) {
  const router = useRouter()
  const { servers } = useServerStore()
  const server = servers.find((s) => s.id === id)

  const [pvp, setPvp] = useState<boolean>(true)
  const [whitelist, setWhitelist] = useState<boolean>(false)
  const [onlineMode, setOnlineMode] = useState<boolean>(true)
  const [allowFlight, setAllowFlight] = useState<boolean>(false)

  if (!server) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300 lg:h-full h-auto">
      <Card className="lg:col-span-2 p-5 border border-border/80 bg-card/65 lg:h-full h-auto flex flex-col">
        <div className="space-y-5 flex-1 flex flex-col min-h-0">
          {/* Host Info */}
          <div className="shrink-0">
            <h4 className="font-bold text-[10px] uppercase tracking-wider font-mono text-muted-foreground/80 mb-2 border-b border-border/40 pb-1">Node & Host Specs</h4>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-secondary/30 p-2.5 rounded-lg border border-border/40">
                <span className="text-muted-foreground text-[9px] block mb-0.5">Host Hostname</span>
                <span className="font-bold text-foreground truncate block">{server.host}</span>
              </div>
              <div className="bg-secondary/30 p-2.5 rounded-lg border border-border/40">
                <span className="text-muted-foreground text-[9px] block mb-0.5">Connection Port</span>
                <span className="font-bold text-foreground block">{server.port}</span>
              </div>
              <div className="bg-secondary/30 p-2.5 rounded-lg border border-border/40">
                <span className="text-muted-foreground text-[9px] block mb-0.5">Engine Software</span>
                <span className="font-bold text-foreground block">{server.software} ({server.version})</span>
              </div>
              <div className="bg-secondary/30 p-2.5 rounded-lg border border-border/40">
                <span className="text-muted-foreground text-[9px] block mb-0.5">Node Location</span>
                <span className="font-bold text-foreground block">SG-Dedicated-01</span>
              </div>
            </div>
          </div>

          {/* SFTP Credentials */}
          <div className="shrink-0">
            <h4 className="font-bold text-[10px] uppercase tracking-wider font-mono text-muted-foreground/80 mb-2 border-b border-border/40 pb-1">SFTP Connection Details</h4>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-secondary/30 p-2.5 rounded-lg border border-border/40">
                <span className="text-muted-foreground text-[9px] block mb-0.5">SFTP IP Address</span>
                <span className="font-bold text-foreground block">sftp.panel.local</span>
              </div>
              <div className="bg-secondary/30 p-2.5 rounded-lg border border-border/40">
                <span className="text-muted-foreground text-[9px] block mb-0.5">SFTP Username</span>
                <span className="font-bold text-primary block">admin.{id}</span>
              </div>
              <div className="bg-secondary/30 p-2.5 rounded-lg border border-border/40">
                <span className="text-muted-foreground text-[9px] block mb-0.5">SFTP Port</span>
                <span className="font-bold text-foreground block">2022</span>
              </div>
              <div className="bg-secondary/30 p-2.5 rounded-lg border border-border/40">
                <span className="text-muted-foreground text-[9px] block mb-0.5">SFTP Password</span>
                <span className="font-bold text-muted-foreground block italic">[Same as panel password]</span>
              </div>
            </div>
          </div>

          {/* Quick Toggles */}
          <div className="shrink-0">
            <h4 className="font-bold text-[10px] uppercase tracking-wider font-mono text-muted-foreground/80 mb-2 border-b border-border/40 pb-1">Quick Config Toggles</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-2 bg-secondary/20 rounded-lg border border-border/30">
                <span className="text-[11px] font-semibold text-foreground/80">PVP Combat</span>
                <Checkbox id="ov-pvp" checked={pvp} onCheckedChange={(val) => setPvp(!!val)} />
              </div>
              <div className="flex items-center justify-between p-2 bg-secondary/20 rounded-lg border border-border/30">
                <span className="text-[11px] font-semibold text-foreground/80">Server Whitelist</span>
                <Checkbox id="ov-whitelist" checked={whitelist} onCheckedChange={(val) => setWhitelist(!!val)} />
              </div>
              <div className="flex items-center justify-between p-2 bg-secondary/20 rounded-lg border border-border/30">
                <span className="text-[11px] font-semibold text-foreground/80">Online Mode</span>
                <Checkbox id="ov-online" checked={onlineMode} onCheckedChange={(val) => setOnlineMode(!!val)} />
              </div>
              <div className="flex items-center justify-between p-2 bg-secondary/20 rounded-lg border border-border/30">
                <span className="text-[11px] font-semibold text-foreground/80">Allow Flight</span>
                <Checkbox id="ov-flight" checked={allowFlight} onCheckedChange={(val) => setAllowFlight(!!val)} />
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="flex-1 flex flex-col min-h-0">
            <h4 className="font-bold text-[10px] uppercase tracking-wider font-mono text-muted-foreground/80 mb-2 border-b border-border/40 pb-1 shrink-0">Recent Panel Activity</h4>
            <div className="space-y-2 flex-1 overflow-y-auto pr-1 text-[11px] font-mono mt-1">
              <div className="p-2 bg-secondary/15 rounded-lg border border-border/20 flex justify-between items-center">
                <span className="text-foreground/80">Server status changed to <span className="text-emerald-500 font-bold">online</span></span>
                <span className="text-[9px] text-muted-foreground">Just now</span>
              </div>
              <div className="p-2 bg-secondary/15 rounded-lg border border-border/20 flex justify-between items-center">
                <span className="text-foreground/80">Properties config saved successfully</span>
                <span className="text-[9px] text-muted-foreground">10 mins ago</span>
              </div>
              <div className="p-2 bg-secondary/15 rounded-lg border border-border/20 flex justify-between items-center">
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
  )
}
