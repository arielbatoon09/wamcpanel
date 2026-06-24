"use client"

import { useState } from "react"
import { useServerStore } from "@/hooks/useServerStore"
import { Button } from "@/components/ui/button"
import { useRouter, useParams, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { StatusBadge } from "@/components/common/status-badge"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import Link from "next/link"
import {
  Terminal,
  Activity,
  FolderOpen,
  ToyBrick,
  Database,
  Settings2,
  ArrowLeft,
  Play,
  Square,
  RotateCw,
  Skull,
  Menu,
  Cpu,
  HardDrive,
  Users,
  ClipboardList
} from "lucide-react"

interface ServerDetailsLayoutProps {
  children: React.ReactNode
}

export function ServerDetailsLayout({ children }: ServerDetailsLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const id = params.id as string

  const { 
    servers, 
    startServer, 
    stopServer, 
    restartServer, 
    killServer 
  } = useServerStore()
  
  const [mobileOpen, setMobileOpen] = useState(false)
  const server = servers.find((s) => s.id === id)

  if (!server) return null

  const isOnline = server.status === "online"
  const isOffline = server.status === "offline"
  const isStarting = server.status === "starting"
  const isStopping = server.status === "stopping"

  // Quick statistics calculation
  const ramPercent = server.ramLimit > 0 ? (server.metrics.ramUsage / server.ramLimit) * 100 : 0
  const cpuPercent = server.cpuLimit > 0 ? (server.metrics.cpuUsage / server.cpuLimit) * 100 : 0
  const playerPercent = server.maxPlayers > 0 ? (server.currentPlayers / server.maxPlayers) * 100 : 0

  // Navigation Items
  const navItems = [
    { id: "overview",  label: "Overview",      icon: Activity,       path: `/server/${id}` },
    { id: "console",   label: "Console",        icon: Terminal,       path: `/server/${id}/console` },
    { id: "files",     label: "File Manager",   icon: FolderOpen,     path: `/server/${id}/files` },
    { id: "players",   label: "Players",        icon: Users,          path: `/server/${id}/players` },
    { id: "plugins",   label: "Plugins",        icon: ToyBrick,       path: `/server/${id}/plugins` },
    { id: "backups",   label: "Backups",        icon: Database,       path: `/server/${id}/backups` },
    { id: "activity", label: "Activity Logs",  icon: ClipboardList,  path: `/server/${id}/activity` },
    { id: "settings",  label: "Settings",       icon: Settings2,      path: `/server/${id}/settings` },
  ] as const

  // Determine active tab based on pathname
  const segments = pathname.split("/")
  const lastSegment = segments[segments.length - 1]
  const activeTab = (["console", "files", "players", "plugins", "backups", "activity", "settings"].includes(lastSegment)
    ? lastSegment
    : "overview") as "overview" | "console" | "files" | "plugins" | "backups" | "activity" | "settings" | "players"

  // Sidebar Component
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card select-none">
      {/* Back to Servers */}
      <div className="p-3 border-b border-border/60 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/servers")}
          className="w-full h-8 justify-start gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer border-border/80"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Server List
        </Button>
      </div>

      {/* Active Server Identity Card */}
      <div className="p-4 border-b border-border/60 shrink-0 space-y-2 bg-secondary/10">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h4 className="font-bold text-xs text-foreground truncate max-w-[150px]">
              {server.name}
            </h4>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              {server.host}:{server.port}
            </p>
          </div>
          <span className="relative flex h-2 w-2 mt-1">
            <span className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              isOnline ? "bg-emerald-500 animate-pulse" : isStarting ? "bg-amber-500 animate-pulse" : isStopping ? "bg-rose-500 animate-pulse" : "bg-muted-foreground"
            )} />
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-1">
          <span>Type: <span className="text-foreground/80 font-bold">{server.software}</span></span>
          <span>Ver: <span className="text-foreground/80 font-bold">{server.version}</span></span>
        </div>
      </div>

      {/* Navigation Tabs List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="px-2 pb-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
          Management
        </div>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <Link
              key={item.id}
              href={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 border cursor-pointer text-left",
                isActive
                  ? "bg-primary/10 border-primary/20 text-primary font-bold shadow-xs"
                  : "border-transparent text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Bottom Power Controls & Theme Toggle */}
      <div className="p-3 border-t border-border bg-muted/40 shrink-0 space-y-3">
        <div className="grid grid-cols-2 gap-1.5">
          {/* Start */}
          <Button
            variant="outline"
            size="xs"
            onClick={() => startServer(id)}
            disabled={!isOffline}
            className="cursor-pointer h-7 text-[10px] font-semibold bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 text-emerald-500 disabled:opacity-30 disabled:bg-transparent"
          >
            <Play className="h-3 w-3 mr-1 fill-emerald-500/10" />
            Start
          </Button>

          {/* Stop */}
          <Button
            variant="outline"
            size="xs"
            onClick={() => stopServer(id)}
            disabled={!isOnline}
            className="cursor-pointer h-7 text-[10px] font-semibold bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/20 text-rose-500 disabled:opacity-30 disabled:bg-transparent"
          >
            <Square className="h-3 w-3 mr-1 fill-rose-500/10" />
            Stop
          </Button>

          {/* Restart */}
          <Button
            variant="outline"
            size="xs"
            onClick={() => restartServer(id)}
            disabled={!isOnline}
            className="cursor-pointer h-7 text-[10px] font-semibold bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20 text-amber-500 disabled:opacity-30 disabled:bg-transparent"
          >
            <RotateCw className="h-3 w-3 mr-1" />
            Restart
          </Button>

          {/* Kill */}
          <Button
            variant="outline"
            size="xs"
            onClick={() => killServer(id)}
            disabled={isOffline}
            className="cursor-pointer h-7 text-[10px] font-semibold bg-red-500/5 hover:bg-red-500/15 border-red-500/20 text-red-500 disabled:opacity-30 disabled:bg-transparent"
          >
            <Skull className="h-3 w-3 mr-1" />
            Kill
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full lg:h-full h-auto">
      {/* Sidebar Card Panel on Left */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-card border border-border/80 rounded-2xl overflow-hidden h-full">
        <SidebarContent />
      </aside>

      {/* Mobile Top Header & Navigation Toggle */}
      <div className="lg:hidden w-full flex items-center justify-between p-3.5 bg-card border-b border-border backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/servers" className="h-7 w-7 rounded bg-primary flex items-center justify-center shrink-0">
            <span className="font-black text-xs text-primary-foreground font-mono">W</span>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xs font-extrabold text-foreground truncate max-w-[130px] leading-tight">
              {server.name}
            </h1>
            <p className="text-[10px] text-muted-foreground font-mono leading-none mt-0.5">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Tab
            </p>
          </div>
        </div>

        <Drawer direction="left" open={mobileOpen} onOpenChange={setMobileOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs cursor-pointer border-border">
              <Menu className="h-4 w-4" />
              Console Menu
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-full w-[280px] rounded-r-xl border-r p-0 flex flex-col">
            <SidebarContent />
          </DrawerContent>
        </Drawer>
      </div>

      {/* Right Content Workspace */}
      <div className="flex-1 min-w-0 lg:h-full h-auto flex flex-col gap-6">
        {/* Top Info Bar (Real-time Resource Utilization widgets) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-card/65 border border-border backdrop-blur-md shrink-0">
          {/* Status & Name Card */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <StatusBadge status={server.status} />
            </div>
            <p className="text-[10px] text-muted-foreground font-mono mt-1">
              IP: <span className="text-foreground/80 font-bold">{server.host}</span> Port: <span className="text-foreground/80 font-bold">{server.port}</span>
            </p>
          </div>

          {/* CPU Widget */}
          <div className="flex items-center gap-3 bg-secondary/30 p-2.5 rounded-lg border border-border/50">
            <Cpu className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[9px] text-muted-foreground block font-mono uppercase tracking-wider">CPU Utilization</span>
              <span className="text-xs font-bold text-foreground font-mono mt-0.5 block">
                {isOnline ? `${server.metrics.cpuUsage.toFixed(1)}%` : "0.0%"}
              </span>
              <div className="w-full bg-border/40 h-1 rounded-full overflow-hidden mt-1">
                <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${isOnline ? cpuPercent : 0}%` }} />
              </div>
            </div>
          </div>

          {/* RAM Widget */}
          <div className="flex items-center gap-3 bg-secondary/30 p-2.5 rounded-lg border border-border/50">
            <HardDrive className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[9px] text-muted-foreground block font-mono uppercase tracking-wider">Memory Allocation</span>
              <span className="text-xs font-bold text-foreground font-mono mt-0.5 block">
                {isOnline ? `${(server.metrics.ramUsage / 1024).toFixed(1)} GB / ${(server.ramLimit / 1024).toFixed(0)} GB` : `0.0 GB / ${(server.ramLimit / 1024).toFixed(0)} GB`}
              </span>
              <div className="w-full bg-border/40 h-1 rounded-full overflow-hidden mt-1">
                <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${isOnline ? ramPercent : 0}%` }} />
              </div>
            </div>
          </div>

          {/* Players Widget */}
          <div className="flex items-center gap-3 bg-secondary/30 p-2.5 rounded-lg border border-border/50">
            <Users className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[9px] text-muted-foreground block font-mono uppercase tracking-wider">Active Players</span>
              <span className="text-xs font-bold text-foreground font-mono mt-0.5 block">
                {isOnline ? `${server.currentPlayers} / ${server.maxPlayers}` : `0 / ${server.maxPlayers}`}
              </span>
              <div className="w-full bg-border/40 h-1 rounded-full overflow-hidden mt-1">
                <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${isOnline ? playerPercent : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Active Tab Panel Body */}
        <div className="flex-1 min-h-0 min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}
