"use client"

import { useState } from "react"
import { useServerStore } from "@/hooks/useServerStore"
import { ServerConsoleSection } from "./server-console-section"
import { ServerMetricsSection } from "./server-metrics-section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Terminal,
  Activity,
  FolderOpen,
  ToyBrick,
  Database,
  Settings2,
  FileCode,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Gamepad2,
  Gauge,
  Lock,
  Cpu,
  Shield,
  ArrowLeft,
  Play,
  Square,
  RotateCw,
  RotateCcw,
  Skull,
  Sun,
  Moon,
  Menu,
  HardDrive,
  Users
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { StatusBadge } from "@/components/common/status-badge"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import Link from "next/link"

interface ServerDetailsManagerProps {
  id: string
}

export function ServerDetailsManager({ id }: ServerDetailsManagerProps) {
  const router = useRouter()
  const { 
    servers, 
    deleteServer, 
    addLog, 
    startServer, 
    stopServer, 
    restartServer, 
    killServer 
  } = useServerStore()
  
  const [activeTab, setActiveTab] = useState<"overview" | "console" | "files" | "plugins" | "backups" | "settings" | "players">("overview")
  const [mobileOpen, setMobileOpen] = useState(false)
  const server = servers.find((s) => s.id === id)

  // Gameplay States
  const [gameMode, setGameMode] = useState<string>("Survival")
  const [difficulty, setDifficulty] = useState<string>("Easy")
  const [motd, setMotd] = useState<string>(server?.description || "A Minecraft Server")
  const [pvp, setPvp] = useState<boolean>(true)
  const [allowFlight, setAllowFlight] = useState<boolean>(false)
  const [commandBlocks, setCommandBlocks] = useState<boolean>(false)
  const [hardcore, setHardcore] = useState<boolean>(false)
  const [squidServers, setSquidServers] = useState<boolean>(false)

  // Performance States
  const [maxPlayers, setMaxPlayers] = useState<string>(String(server?.maxPlayers || 20))
  const [viewDistance, setViewDistance] = useState<string>("10")
  const [simDistance, setSimDistance] = useState<string>("8")
  const [ramAllocation, setRamAllocation] = useState<number>(server?.ramLimit || 512)

  // Security States
  const [publicServer, setPublicServer] = useState<boolean>(false)
  const [spawnProtection, setSpawnProtection] = useState<string>("16")
  const [whitelist, setWhitelist] = useState<boolean>(false)
  const [enforceWhitelist, setEnforceWhitelist] = useState<boolean>(false)
  const [onlineMode, setOnlineMode] = useState<boolean>(true)

  // Startup & JVM States
  const [javaVersion, setJavaVersion] = useState<string>("java-21")
  const [useNogui, setUseNogui] = useState<boolean>(true)
  const [jvmArgs, setJvmArgs] = useState<string>("")

  // Version States
  const [mcVersion, setMcVersion] = useState<string>("1.21.11")

  // raw server.properties Dialog State
  const [propertiesOpen, setPropertiesOpen] = useState(false)

  // Files Tab Mock Data & State
  const [files, setFiles] = useState([
    { name: "world", isDir: true, size: "-" },
    { name: "plugins", isDir: true, size: "-" },
    { name: "server.properties", isDir: false, size: "4.2 KB" },
    { name: "spigot.yml", isDir: false, size: "8.1 KB" },
    { name: "bukkit.yml", isDir: false, size: "2.3 KB" },
    { name: "ops.json", isDir: false, size: "120 B" },
    { name: "usercache.json", isDir: false, size: "18.5 KB" },
  ])
  const [newFileName, setNewFileName] = useState("")

  // Plugins Tab Mock Data & State
  // Plugins Tab Mock Data & State
  const [plugins, setPlugins] = useState([
    { name: "EssentialsX", version: "2.20.1", enabled: true, desc: "Essential commands and utilities." },
    { name: "LuckPerms", version: "5.4.102", enabled: true, desc: "Advanced permissions system." },
    { name: "WorldEdit", version: "7.2.15", enabled: true, desc: "In-game map editor." },
    { name: "Vault", version: "1.7.3", enabled: false, desc: "Vault ecosystem connectors." },
    { name: "Dynmap", version: "3.4", enabled: true, desc: "Real-time dynamic web map for Minecraft servers." },
    { name: "CoreProtect", version: "21.2", enabled: true, desc: "Fast, efficient block logging and rollbacks." },
    { name: "ClearLag", version: "3.2.2", enabled: false, desc: "Entity optimizer to reduce server tick lag." },
    { name: "Multiverse-Core", version: "4.3.1", enabled: true, desc: "Easy to use multi-world management plugin." },
  ])
  const [searchPlugin, setSearchPlugin] = useState("")
  const [pluginPage, setPluginPage] = useState(1)

  // Backups Tab Mock Data & State
  const [backups, setBackups] = useState([
    { id: "bk-1", name: "Backup-2026-06-23-BeforeUpdate", size: "482 MB", date: "2026-06-23 18:30" },
    { id: "bk-2", name: "Backup-2026-06-20-Daily", size: "450 MB", date: "2026-06-20 04:00" },
    { id: "bk-3", name: "Backup-2026-06-18-Weekly", size: "1.2 GB", date: "2026-06-18 02:00" },
    { id: "bk-4", name: "Backup-2026-06-15-System", size: "430 MB", date: "2026-06-15 11:15" },
    { id: "bk-5", name: "Backup-2026-06-10-PreMigration", size: "510 MB", date: "2026-06-10 14:05" },
    { id: "bk-6", name: "Backup-2026-06-08-Daily", size: "445 MB", date: "2026-06-08 04:00" },
    { id: "bk-7", name: "Backup-2026-06-05-PluginsUpdate", size: "480 MB", date: "2026-06-05 10:20" },
    { id: "bk-8", name: "Backup-2026-06-01-Monthly", size: "1.1 GB", date: "2026-06-01 02:00" },
    { id: "bk-9", name: "Backup-2026-05-28-Daily", size: "440 MB", date: "2026-05-28 04:00" },
    { id: "bk-10", name: "Backup-2026-05-25-Daily", size: "441 MB", date: "2026-05-25 04:00" },
    { id: "bk-11", name: "Backup-2026-05-22-Daily", size: "438 MB", date: "2026-05-22 04:00" },
    { id: "bk-12", name: "Backup-2026-05-18-Weekly", size: "1.05 GB", date: "2026-05-18 02:00" },
    { id: "bk-13", name: "Backup-2026-05-15-Daily", size: "435 MB", date: "2026-05-15 04:00" },
    { id: "bk-14", name: "Backup-2026-05-10-SecurityFix", size: "460 MB", date: "2026-05-10 16:45" },
  ])
  const [searchBackup, setSearchBackup] = useState("")
  const [backupPage, setBackupPage] = useState(1)

  // Online Players State
  const [onlinePlayers, setOnlinePlayers] = useState([
    { name: "player_one", uuid: "d3b07384-d113-4956-aab9-e8b75c123456", ping: "42ms", op: true, ip: "127.0.0.1" },
    { name: "redstone_pro", uuid: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d", ping: "18ms", op: false, ip: "192.168.1.50" },
    { name: "builder2", uuid: "f9e8d7c6-b5a4-3210-fedc-ba9876543210", ping: "75ms", op: false, ip: "10.0.0.12" },
  ])
  const [searchPlayer, setSearchPlayer] = useState("")

  const handleKickPlayer = (name: string) => {
    if (confirm(`Are you sure you want to kick player "${name}"?`)) {
      setOnlinePlayers(onlinePlayers.filter((p) => p.name !== name))
      addLog(id, `[SYSTEM] Player ${name} has been kicked from the server.`)
      toast.success(`Player ${name} kicked`)
    }
  }

  const handleToggleOp = (name: string) => {
    setOnlinePlayers(
      onlinePlayers.map((p) => {
        if (p.name === name) {
          const nextOp = !p.op
          addLog(id, `[SYSTEM] Player ${name} operator status set to: ${nextOp}`)
          toast.success(`Player ${name} ${nextOp ? "opped" : "deopped"}`)
          return { ...p, op: nextOp }
        }
        return p
      })
    )
  }

  // General Settings Panel Page State
  const [panelName, setPanelName] = useState(server?.name || "")
  const [panelDesc, setPanelDesc] = useState(server?.description || "")

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
    { id: "overview", label: "Overview", icon: Activity },
    { id: "console", label: "Console", icon: Terminal },
    { id: "files", label: "File Manager", icon: FolderOpen },
    { id: "players", label: "Players", icon: Users },
    { id: "plugins", label: "Plugins", icon: ToyBrick },
    { id: "backups", label: "Backups", icon: Database },
    { id: "settings", label: "Settings", icon: Settings2 },
  ] as const

  const handleAddFile = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFileName.trim()) return
    setFiles([...files, { name: newFileName.trim(), isDir: false, size: "0 B" }])
    addLog(id, `[SYSTEM] File created: ${newFileName}`)
    setNewFileName("")
  }

  const handleDeleteFile = (name: string) => {
    setFiles(files.filter((f) => f.name !== name))
    addLog(id, `[SYSTEM] File deleted: ${name}`)
  }

  const handleTogglePlugin = (name: string) => {
    setPlugins(
      plugins.map((p) => (p.name === name ? { ...p, enabled: !p.enabled } : p))
    )
    const pl = plugins.find((p) => p.name === name)
    addLog(
      id,
      `[SYSTEM] Plugin ${name} has been ${pl?.enabled ? "disabled" : "enabled"}. Restart required.`
    )
  }

  const handleDeletePlugin = (name: string) => {
    if (confirm(`Are you sure you want to permanently delete the plugin "${name}"?`)) {
      setPlugins(plugins.filter((p) => p.name !== name))
      addLog(id, `[SYSTEM] Plugin ${name} has been uninstalled. Server restart required to clear memory cache.`)
      toast.success(`Plugin "${name}" uninstalled successfully`)
    }
  }

  const handleCreateBackup = () => {
    const dateStr = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '').substring(0, 16)
    const newBk = {
      id: `bk-${Date.now()}`,
      name: `Backup-${new Date().toISOString().slice(0, 10)}-Manual`,
      size: `${(Math.random() * 50 + 400).toFixed(0)} MB`,
      date: dateStr,
    }
    setBackups([newBk, ...backups])
    addLog(id, `[SYSTEM] Backup created successfully: ${newBk.name}`)
  }

  const handleDeleteBackup = (bkId: string) => {
    const bk = backups.find((b) => b.id === bkId)
    setBackups(backups.filter((b) => b.id !== bkId))
    if (bk) addLog(id, `[SYSTEM] Backup deleted: ${bk.name}`)
  }

  const handleRestoreBackup = (bkId: string) => {
    const bk = backups.find((b) => b.id === bkId)
    if (bk) {
      addLog(id, `[SYSTEM] Initiated restore process for: ${bk.name}...`)
      toast.promise(
        new Promise((resolve) => setTimeout(resolve, 1500)),
        {
          loading: `Restoring data from ${bk.name}...`,
          success: () => {
            addLog(id, `[SYSTEM] Backup ${bk.name} restored successfully. Server file system updated.`)
            return `Backup restored successfully`
          },
          error: "Failed to restore backup",
        }
      )
    }
  }

  const handleSaveProperties = () => {
    server.name = panelName
    server.description = motd
    server.maxPlayers = Number(maxPlayers) || 20
    server.ramLimit = ramAllocation
    addLog(id, `[SYSTEM] Properties saved. Uptime limits and limits updated.`)
    toast.success("Settings saved successfully")
  }

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault()
    server.name = panelName
    server.description = panelDesc
    addLog(id, `[SYSTEM] General settings saved.`)
    toast.success("General settings saved")
  }

  const handleDeleteServer = () => {
    if (confirm(`Are you sure you want to delete ${server.name}?`)) {
      deleteServer(id)
      router.push("/servers")
    }
  }



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
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id)
                setMobileOpen(false)}
              }
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 border cursor-pointer text-left",
                isActive
                  ? "bg-primary/10 border-primary/20 text-primary font-bold shadow-xs"
                  : "border-transparent text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </button>
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
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300 lg:h-full h-auto">
                  {/* Host Specs */}
                  {/* Host Specs */}
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
                  <ServerMetricsSection id={id} onViewAllPlayers={() => setActiveTab("players")} />
                </div>
              </div>
            )}

            {activeTab === "console" && (
              <div className="animate-in fade-in duration-300 lg:h-full h-[450px]">
                <ServerConsoleSection id={id} />
              </div>
            )}

            {activeTab === "files" && (
              <Card className="p-5 border border-border/80 bg-card/65 animate-in fade-in duration-300 lg:h-full min-h-[450px] flex flex-col">
                <div className="flex justify-between items-center border-b border-border pb-3 shrink-0 mb-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider font-mono">Files</h3>
                  <form onSubmit={handleAddFile} className="flex gap-2">
                    <Input
                      placeholder="new-file.txt"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      className="h-8 text-xs max-w-[200px]"
                    />
                    <Button type="submit" size="sm" className="h-8 text-xs font-semibold cursor-pointer">
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      New File
                    </Button>
                  </form>
                </div>

                <div className="overflow-auto flex-1 min-h-0 pr-1">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-left">
                        <th className="py-2 font-semibold">Name</th>
                        <th className="py-2 font-semibold">Size</th>
                        <th className="py-2 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {files.map((file) => (
                        <tr key={file.name} className="hover:bg-secondary/30">
                          <td className="py-2.5 flex items-center gap-2">
                            <FileCode className={`h-4 w-4 ${file.isDir ? "text-amber-500" : "text-muted-foreground"}`} />
                            <span className={file.isDir ? "font-semibold text-foreground/90" : "text-foreground/80"}>
                              {file.name}
                            </span>
                          </td>
                          <td className="py-2.5 text-muted-foreground">{file.size}</td>
                          <td className="py-2.5 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteFile(file.name)}
                              className="h-7 w-7 text-muted-foreground hover:text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {activeTab === "players" && (
              <Card className="p-5 border border-border/80 bg-card/65 animate-in fade-in duration-300 lg:h-full min-h-[450px] flex flex-col">
                <div className="flex justify-between items-center border-b border-border pb-3 shrink-0 mb-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider font-mono">Connected Players</h3>
                  <Input
                    placeholder="Search players..."
                    value={searchPlayer}
                    onChange={(e) => setSearchPlayer(e.target.value)}
                    className="h-8 text-xs max-w-[200px]"
                    disabled={!isOnline}
                  />
                </div>

                <div className="overflow-auto flex-1 min-h-0 pr-1">
                  {!isOnline ? (
                    <div className="text-xs text-muted-foreground text-center py-12 font-mono">
                      No players connected (Server is offline)
                    </div>
                  ) : (
                    (() => {
                      const filtered = onlinePlayers.filter((p) => p.name.toLowerCase().includes(searchPlayer.toLowerCase()))
                      if (filtered.length === 0) {
                        return (
                          <div className="text-xs text-muted-foreground text-center py-12 font-mono">
                            No players found matching "{searchPlayer}"
                          </div>
                        )
                      }
                      return (
                        <table className="w-full text-xs font-mono">
                          <thead>
                            <tr className="border-b border-border text-muted-foreground text-left">
                              <th className="py-2 font-semibold">Player</th>
                              <th className="py-2 font-semibold">UUID</th>
                              <th className="py-2 font-semibold">IP Address</th>
                              <th className="py-2 font-semibold">Ping</th>
                              <th className="py-2 font-semibold text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {filtered.map((player) => (
                              <tr key={player.name} className="hover:bg-secondary/30">
                                <td className="py-2.5 flex items-center gap-2">
                                  <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center font-bold text-[10px] text-primary uppercase">
                                    {player.name.substring(0, 2)}
                                  </div>
                                  <span className="font-semibold text-foreground/90 flex items-center gap-1.5">
                                    {player.name}
                                    {player.op && (
                                      <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] px-1 py-0.2 rounded uppercase font-bold tracking-wider">
                                        OP
                                      </span>
                                    )}
                                  </span>
                                </td>
                                <td className="py-2.5 text-muted-foreground/80 font-mono text-[10px] truncate max-w-[120px]">{player.uuid}</td>
                                <td className="py-2.5 text-muted-foreground">{player.ip}</td>
                                <td className="py-2.5 text-emerald-400 font-bold">{player.ping}</td>
                                <td className="py-2.5 text-right flex gap-1.5 justify-end items-center">
                                  <Button
                                    variant="outline"
                                    size="xs"
                                    onClick={() => handleToggleOp(player.name)}
                                    className={`h-7 text-[10px] font-semibold cursor-pointer border-border ${player.op ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground hover:text-foreground"}`}
                                    title={player.op ? "Remove OP privileges" : "Grant OP privileges"}
                                  >
                                    <Shield className="h-3 w-3 mr-1" />
                                    {player.op ? "Deop" : "Op"}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="xs"
                                    onClick={() => handleKickPlayer(player.name)}
                                    className="h-7 text-[10px] font-semibold bg-rose-500/5 hover:bg-rose-500/15 border-rose-500/20 text-rose-500 cursor-pointer"
                                    title="Kick player from server"
                                  >
                                    Kick
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )
                    })()
                  )}
                </div>
              </Card>
            )}

            {activeTab === "plugins" && (() => {
              const PAGE_SIZE = 6
              const filtered = plugins.filter((p) => p.name.toLowerCase().includes(searchPlugin.toLowerCase()))
              const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
              const currentPage = Math.min(pluginPage, Math.max(1, totalPages))
              const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
              const startIndex = (currentPage - 1) * PAGE_SIZE
              
              return (
                <Card className="p-5 border border-border/80 bg-card/65 animate-in fade-in duration-300 lg:h-full min-h-[450px] flex flex-col">
                  <div className="flex justify-between items-center border-b border-border pb-3 shrink-0 mb-4">
                    <h3 className="font-bold text-sm uppercase tracking-wider font-mono">Plugins</h3>
                    <Input
                      placeholder="Search plugins..."
                      value={searchPlugin}
                      onChange={(e) => {
                        setSearchPlugin(e.target.value)
                        setPluginPage(1)
                      }}
                      className="h-8 text-xs max-w-[200px]"
                    />
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                    {paginated.length === 0 ? (
                      <div className="text-xs text-muted-foreground text-center py-8 font-mono">No plugins found matching "{searchPlugin}"</div>
                    ) : (
                      paginated.map((plugin) => (
                        <div
                          key={plugin.name}
                          className="p-3.5 border border-border rounded-xl bg-secondary/20 flex justify-between items-center gap-4 animate-in fade-in duration-150"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm">{plugin.name}</h4>
                              <span className="text-[10px] text-muted-foreground bg-border px-1.5 py-0.5 rounded font-mono">
                                v{plugin.version}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{plugin.desc}</p>
                          </div>

                          <div className="flex gap-2 items-center shrink-0">
                            <Button
                              variant={plugin.enabled ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleTogglePlugin(plugin.name)}
                              className={`h-7 text-xs font-semibold cursor-pointer ${
                                plugin.enabled ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                              }`}
                            >
                              {plugin.enabled ? "Enabled" : "Disabled"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePlugin(plugin.name)}
                              className="h-7 w-7 text-muted-foreground hover:text-rose-500 cursor-pointer"
                              title="Delete Plugin"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border pt-3.5 shrink-0 mt-4 text-xs font-mono text-muted-foreground select-none">
                      <span>
                        Showing {startIndex + 1} to {Math.min(startIndex + PAGE_SIZE, filtered.length)} of {filtered.length} plugins
                      </span>
                      <div className="flex gap-1.5">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setPluginPage(p => Math.max(p - 1, 1))}
                          disabled={currentPage === 1}
                          className="cursor-pointer h-7 text-[10px] border-border"
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setPluginPage(p => Math.min(p + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="cursor-pointer h-7 text-[10px] border-border"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })()}

            {activeTab === "backups" && (() => {
              const PAGE_SIZE = 7
              const filtered = backups.filter((b) => b.name.toLowerCase().includes(searchBackup.toLowerCase()))
              const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
              const currentPage = Math.min(backupPage, Math.max(1, totalPages))
              const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
              const startIndex = (currentPage - 1) * PAGE_SIZE
              
              return (
                <Card className="p-5 border border-border/80 bg-card/65 animate-in fade-in duration-300 lg:h-full min-h-[450px] flex flex-col">
                  <div className="flex justify-between items-center border-b border-border pb-3 shrink-0 mb-4 gap-4">
                    <h3 className="font-bold text-sm uppercase tracking-wider font-mono shrink-0">Backups</h3>
                    <div className="flex items-center gap-2 flex-1 justify-end max-w-[400px]">
                      <Input
                        placeholder="Search backups..."
                        value={searchBackup}
                        onChange={(e) => {
                          setSearchBackup(e.target.value)
                          setBackupPage(1)
                        }}
                        className="h-8 text-xs max-w-[180px]"
                      />
                      <Button onClick={handleCreateBackup} size="sm" className="h-8 text-xs font-semibold cursor-pointer shrink-0">
                        <Database className="h-3.5 w-3.5 mr-1" />
                        Create Backup
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                    {paginated.length === 0 ? (
                      <div className="text-xs text-muted-foreground text-center py-8 font-mono">No backups found matching "{searchBackup}"</div>
                    ) : (
                      paginated.map((bk) => (
                        <div
                          key={bk.id}
                          className="p-3 border border-border rounded-xl bg-secondary/20 flex justify-between items-center font-mono text-xs animate-in fade-in duration-150"
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <div>
                              <span className="font-bold text-foreground/90">{bk.name}</span>
                              <div className="text-[10px] text-muted-foreground mt-0.5 flex gap-2">
                                <span>Size: {bk.size}</span>
                                <span>Date: {bk.date}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 items-center shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRestoreBackup(bk.id)}
                              className="h-7 w-7 text-muted-foreground hover:text-emerald-500 cursor-pointer"
                              title="Restore Backup"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteBackup(bk.id)}
                              className="h-7 w-7 text-muted-foreground hover:text-rose-500 cursor-pointer"
                              title="Delete Backup"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border pt-3.5 shrink-0 mt-4 text-xs font-mono text-muted-foreground select-none">
                      <span>
                        Showing {startIndex + 1} to {Math.min(startIndex + PAGE_SIZE, filtered.length)} of {filtered.length} backups
                      </span>
                      <div className="flex gap-1.5">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setBackupPage(p => Math.max(p - 1, 1))}
                          disabled={currentPage === 1}
                          className="cursor-pointer h-7 text-[10px] border-border"
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setBackupPage(p => Math.min(p + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="cursor-pointer h-7 text-[10px] border-border"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })()}

            {activeTab === "settings" && (
              <div className="space-y-6 animate-in fade-in duration-300 lg:h-full lg:overflow-y-auto h-auto pr-1">
                {/* Header with Save Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border pb-4 gap-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Server Settings</h2>
                    <p className="text-xs text-muted-foreground">Configure your Minecraft server properties</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setPropertiesOpen(true)}
                      className="h-9 cursor-pointer gap-1.5 text-xs flex-1 sm:flex-none border-border"
                    >
                      <FileCode className="h-4 w-4" /> Open server.properties
                    </Button>
                    <Button 
                      type="button" 
                      size="sm" 
                      onClick={handleSaveProperties}
                      className="h-9 cursor-pointer gap-1.5 text-xs flex-1 sm:flex-none font-semibold"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Save Changes
                    </Button>
                  </div>
                </div>

                {/* Layout Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Gameplay Configurations */}
                  <Card className="p-5 border border-border bg-card/65 flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                        <div className="p-1.5 rounded-lg bg-secondary text-primary">
                          <Gamepad2 className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm tracking-wide">Gameplay</h3>
                          <p className="text-[10px] text-muted-foreground font-mono">General gameplay settings</p>
                        </div>
                      </div>

                      <div className="space-y-4 text-xs">
                        {/* Game Mode */}
                        <div className="space-y-1.5">
                          <span className="flex items-center gap-1 font-semibold text-muted-foreground font-mono">
                            Game Mode
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>The default game mode for joining players.</TooltipContent>
                            </Tooltip>
                          </span>
                          <Select value={gameMode} onValueChange={setGameMode}>
                            <SelectTrigger className="cursor-pointer">
                              <SelectValue placeholder="Select Game Mode" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Survival" className="cursor-pointer">Survival</SelectItem>
                              <SelectItem value="Creative" className="cursor-pointer">Creative</SelectItem>
                              <SelectItem value="Adventure" className="cursor-pointer">Adventure</SelectItem>
                              <SelectItem value="Spectator" className="cursor-pointer">Spectator</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Difficulty */}
                        <div className="space-y-1.5">
                          <span className="flex items-center gap-1 font-semibold text-muted-foreground font-mono">
                            Difficulty
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>The general difficulty level of the server.</TooltipContent>
                            </Tooltip>
                          </span>
                          <Select value={difficulty} onValueChange={setDifficulty}>
                            <SelectTrigger className="cursor-pointer">
                              <SelectValue placeholder="Select Difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Peaceful" className="cursor-pointer">Peaceful</SelectItem>
                              <SelectItem value="Easy" className="cursor-pointer">Easy</SelectItem>
                              <SelectItem value="Normal" className="cursor-pointer">Normal</SelectItem>
                              <SelectItem value="Hard" className="cursor-pointer">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Server MOTD Message */}
                        <div className="space-y-1.5">
                          <span className="flex items-center gap-1 font-semibold text-muted-foreground font-mono">
                            Server Message (MOTD)
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>Message displayed in the server list.</TooltipContent>
                            </Tooltip>
                          </span>
                          <Input value={motd} onChange={(e) => setMotd(e.target.value)} />
                        </div>

                        {/* Checkbox settings */}
                        <div className="space-y-2.5 pt-2">
                          {/* PVP */}
                          <div className="flex items-center space-x-2">
                            <Checkbox id="pvp" checked={pvp} onCheckedChange={(val) => setPvp(!!val)} />
                            <label htmlFor="pvp" className="text-xs font-semibold text-foreground/80 flex items-center gap-1 cursor-pointer">
                              Enable PVP
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>Allows players to damage each other.</TooltipContent>
                              </Tooltip>
                            </label>
                          </div>

                          {/* Allow Flight */}
                          <div className="flex items-center space-x-2">
                            <Checkbox id="flight" checked={allowFlight} onCheckedChange={(val) => setAllowFlight(!!val)} />
                            <label htmlFor="flight" className="text-xs font-semibold text-foreground/80 flex items-center gap-1 cursor-pointer">
                              Allow Flying
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>Prevents kick-back warnings when flying in Survival.</TooltipContent>
                              </Tooltip>
                            </label>
                          </div>

                          {/* Command Blocks */}
                          <div className="flex items-center space-x-2">
                            <Checkbox id="cmdblocks" checked={commandBlocks} onCheckedChange={(val) => setCommandBlocks(!!val)} />
                            <label htmlFor="cmdblocks" className="text-xs font-semibold text-foreground/80 flex items-center gap-1 cursor-pointer">
                              Enable Command Blocks
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>Allows command blocks to execute functions.</TooltipContent>
                              </Tooltip>
                            </label>
                          </div>

                          {/* Hardcore Mode */}
                          <div className="flex items-center space-x-2">
                            <Checkbox id="hardcore" checked={hardcore} onCheckedChange={(val) => setHardcore(!!val)} />
                            <label htmlFor="hardcore" className="text-xs font-semibold text-foreground/80 flex items-center gap-1 cursor-pointer">
                              Hardcore Mode
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>Locks difficulty to Hard and enables permadeath.</TooltipContent>
                              </Tooltip>
                            </label>
                          </div>

                          {/* SquidServers content */}
                          <div className="flex items-center space-x-2">
                            <Checkbox id="squid" checked={squidServers} onCheckedChange={(val) => setSquidServers(!!val)} />
                            <label htmlFor="squid" className="text-xs font-semibold text-foreground/80 flex items-center gap-1 cursor-pointer">
                              SquidServers content
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>Integrate with customized server features.</TooltipContent>
                              </Tooltip>
                            </label>
                          </div>
                        </div>

                      </div>
                    </div>
                  </Card>

                  {/* Performance Configurations */}
                  <Card className="p-5 border border-border bg-card/65 flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                        <div className="p-1.5 rounded-lg bg-secondary text-primary">
                          <Gauge className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm tracking-wide">Performance</h3>
                          <p className="text-[10px] text-muted-foreground font-mono">Optimize your server's performance</p>
                        </div>
                      </div>

                      <div className="space-y-4 text-xs">
                        {/* Max Players */}
                        <div className="space-y-1.5">
                          <span className="flex items-center gap-1 font-semibold text-muted-foreground font-mono">
                            Max Players
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>Limits concurrent player count capacity.</TooltipContent>
                            </Tooltip>
                          </span>
                          <Input type="number" value={maxPlayers} onChange={(e) => setMaxPlayers(e.target.value)} />
                        </div>

                        {/* View Distance */}
                        <div className="space-y-1.5">
                          <span className="flex items-center gap-1 font-semibold text-muted-foreground font-mono">
                            View Distance
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>Radius of chunks sent to the client (4-32).</TooltipContent>
                            </Tooltip>
                          </span>
                          <Input type="number" value={viewDistance} onChange={(e) => setViewDistance(e.target.value)} />
                        </div>

                        {/* Simulation Distance */}
                        <div className="space-y-1.5">
                          <span className="flex items-center gap-1 font-semibold text-muted-foreground font-mono">
                            Simulation Distance
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>Radius of chunks loaded around the player to update entities.</TooltipContent>
                            </Tooltip>
                          </span>
                          <Input type="number" value={simDistance} onChange={(e) => setSimDistance(e.target.value)} />
                        </div>

                        {/* RAM Allocation Input */}
                        <div className="space-y-1.5">
                          <span className="flex items-center gap-1 font-semibold text-muted-foreground font-mono">
                            RAM Allocation (MB)
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>Dedicated RAM limitation allocated to the JVM.</TooltipContent>
                            </Tooltip>
                          </span>
                          <Input type="number" value={ramAllocation} onChange={(e) => setRamAllocation(Number(e.target.value) || 512)} />
                        </div>

                        {/* RAM Slider */}
                        <div className="space-y-2 pt-2">
                          <div className="flex justify-between text-[11px] font-mono font-semibold text-muted-foreground">
                            <span>Memory Slider</span>
                            <span className="text-foreground">{ramAllocation} MB</span>
                          </div>
                          <Slider
                            value={[ramAllocation]}
                            onValueChange={(val) => setRamAllocation(val[0])}
                            min={512}
                            max={15761}
                            step={256}
                          />
                          <div className="flex justify-between text-[10px] text-muted-foreground/75 font-mono">
                            <span>512 MB</span>
                            <span>15761 MB</span>
                          </div>
                        </div>

                        {/* Warning Low RAM banner */}
                        {ramAllocation < 2048 && (
                          <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-lg flex items-start gap-2 text-amber-500 leading-normal">
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block text-[11px]">Very Low RAM</span>
                              <span className="text-[10px] block">Below minimum (2 GB). Server performance will be poor.</span>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  </Card>

                  {/* Security Configurations */}
                  <Card className="p-5 border border-border bg-card/65 flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                        <div className="p-1.5 rounded-lg bg-secondary text-primary">
                          <Lock className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm tracking-wide">Security</h3>
                          <p className="text-[10px] text-muted-foreground font-mono">Access control and security settings</p>
                        </div>
                      </div>

                      <div className="space-y-4 text-xs">
                        {/* Public Server Checkbox */}
                        <div className="flex items-center space-x-2">
                          <Checkbox id="public" checked={publicServer} onCheckedChange={(val) => setPublicServer(!!val)} />
                          <label htmlFor="public" className="text-xs font-semibold text-foreground/80 flex items-center gap-1 cursor-pointer">
                            Public Server
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>Broadcast server to external discoverability nodes.</TooltipContent>
                            </Tooltip>
                          </label>
                        </div>

                        {/* Spawn Protection */}
                        <div className="space-y-1.5">
                          <span className="flex items-center gap-1 font-semibold text-muted-foreground font-mono">
                            Spawn Protection Radius
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>Radius of spawn region protected from non-OP players.</TooltipContent>
                            </Tooltip>
                          </span>
                          <Input type="number" value={spawnProtection} onChange={(e) => setSpawnProtection(e.target.value)} />
                        </div>

                        {/* Enable Whitelist */}
                        <div className="flex items-center space-x-2">
                          <Checkbox id="whitelist" checked={whitelist} onCheckedChange={(val) => setWhitelist(!!val)} />
                          <label htmlFor="whitelist" className="text-xs font-semibold text-foreground/80 flex items-center gap-1 cursor-pointer">
                            Enable Whitelist
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>Restricts joining to users on the whitelist.</TooltipContent>
                            </Tooltip>
                          </label>
                        </div>

                        {/* Enforce Whitelist */}
                        <div className="flex items-center space-x-2">
                          <Checkbox id="enforce" checked={enforceWhitelist} onCheckedChange={(val) => setEnforceWhitelist(!!val)} />
                          <label htmlFor="enforce" className="text-xs font-semibold text-foreground/80 flex items-center gap-1 cursor-pointer">
                            Enforce Whitelist
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>Kicks whitelisted users instantly if Whitelists are disabled.</TooltipContent>
                            </Tooltip>
                          </label>
                        </div>

                        {/* Online Mode */}
                        <div className="flex items-center space-x-2">
                          <Checkbox id="online" checked={onlineMode} onCheckedChange={(val) => setOnlineMode(!!val)} />
                          <label htmlFor="online" className="text-xs font-semibold text-foreground/80 flex items-center gap-1 cursor-pointer">
                            Online Mode (Require Login)
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>Authenticates connections against Mojang authentication nodes.</TooltipContent>
                            </Tooltip>
                          </label>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Startup & JVM Configurations */}
                  <div className="space-y-6">
                    <Card className="p-5 border border-border bg-card/65 flex flex-col justify-between space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                          <div className="p-1.5 rounded-lg bg-secondary text-primary">
                            <Cpu className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm tracking-wide">Startup & JVM</h3>
                            <p className="text-[10px] text-muted-foreground font-mono">Control startup behavior and advanced JVM options</p>
                          </div>
                        </div>

                        <div className="space-y-4 text-xs font-mono">
                          {/* Java Version Dropdown */}
                          <div className="space-y-1.5">
                            <span className="flex items-center gap-1 font-semibold text-muted-foreground">
                              Java Executable
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>Java VM runtime used to execute the Jar platform.</TooltipContent>
                              </Tooltip>
                            </span>
                            <Select value={javaVersion} onValueChange={setJavaVersion}>
                              <SelectTrigger className="cursor-pointer">
                                <SelectValue placeholder="Java Runtime" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="java-21" className="cursor-pointer">Java 21.0.11 (SquidServers Provided)</SelectItem>
                                <SelectItem value="java-17" className="cursor-pointer">Java 17.0.9 (System Host)</SelectItem>
                                <SelectItem value="java-8" className="cursor-pointer">Java 1.8.0 (Legacy)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Manual Button */}
                          <div className="pt-1">
                            <Button type="button" variant="outline" size="sm" className="h-8 text-xs font-semibold cursor-pointer border-border">
                              Select Java Manually
                            </Button>
                          </div>

                          {/* Nogui Checkbox */}
                          <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="nogui" checked={useNogui} onCheckedChange={(val) => setUseNogui(!!val)} />
                            <label htmlFor="nogui" className="text-xs font-semibold text-foreground/80 flex items-center gap-1 cursor-pointer font-sans">
                              Use nogui on startup
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>Launches without graphical administration windows.</TooltipContent>
                              </Tooltip>
                            </label>
                          </div>

                          {/* Extra JVM args */}
                          <div className="space-y-1.5">
                            <span className="flex items-center gap-1 font-semibold text-muted-foreground">
                              Extra JVM -X args
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>Advanced Java options (GC flags, optimization arguments).</TooltipContent>
                              </Tooltip>
                            </span>
                            <Input placeholder="e.g. -XX:+UseG1GC -Xss1M" value={jvmArgs} onChange={(e) => setJvmArgs(e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Server Version Selection Card */}
                    <Card className="p-5 border border-border bg-card/65 space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                        <div className="p-1.5 rounded-lg bg-secondary text-primary">
                          <Settings2 className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm tracking-wide">Server Version</h3>
                          <p className="text-[10px] text-muted-foreground font-mono">Update the Minecraft version for this server</p>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs font-mono">
                        <span className="flex items-center gap-1 font-semibold text-muted-foreground">
                          Select New Version
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>Updates the target Minecraft installation version.</TooltipContent>
                          </Tooltip>
                        </span>
                        <Select value={mcVersion} onValueChange={setMcVersion}>
                          <SelectTrigger className="cursor-pointer">
                            <SelectValue placeholder="Minecraft Version" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1.21.11" className="cursor-pointer">1.21.11</SelectItem>
                            <SelectItem value="1.20.4" className="cursor-pointer">1.20.4</SelectItem>
                            <SelectItem value="1.20.2" className="cursor-pointer">1.20.2</SelectItem>
                            <SelectItem value="1.19.4" className="cursor-pointer">1.19.4</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </Card>
                  </div>

                </div>

                {/* Permanent Delete Section */}
                <Card className="p-5 border border-red-500/20 bg-red-500/5 space-y-4 mt-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm text-red-500 flex items-center gap-1.5">
                        <Trash2 className="h-4.5 w-4.5" /> Delete Server
                      </h3>
                      <p className="text-xs text-muted-foreground">Permanently delete this server and all its files</p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteServer}
                      className="text-xs font-semibold cursor-pointer bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete Server
                    </Button>
                  </div>

                  <div className="text-xs font-mono font-semibold py-1">
                    Server: <span className="text-foreground">{server.name}</span>
                  </div>

                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-semibold">
                    Warning: This action cannot be undone. All server files, configurations, worlds, and associated tunnels will be permanently deleted.
                  </div>
                </Card>

                {/* Raw server.properties Dialog View */}
                <Dialog open={propertiesOpen} onOpenChange={setPropertiesOpen}>
                  <DialogContent className="max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle className="font-mono text-sm">server.properties</DialogTitle>
                      <DialogDescription>
                        Raw properties config representation of this server instance.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="bg-black/95 p-4 rounded-lg overflow-y-auto max-h-[350px] font-mono text-xs text-zinc-300 space-y-1">
                      <div># Minecraft server properties</div>
                      <div># Generated and managed by Panel</div>
                      <div>generator-settings=</div>
                      <div>op-permission-level=4</div>
                      <div>allow-nether=true</div>
                      <div>level-name=world</div>
                      <div>enable-query=false</div>
                      <div>allow-flight={String(allowFlight)}</div>
                      <div>announce-player-achievements=true</div>
                      <div>server-port={server.port}</div>
                      <div>max-players={maxPlayers}</div>
                      <div>difficulty={difficulty.toLowerCase()}</div>
                      <div>spawn-monsters=true</div>
                      <div>pvp={String(pvp)}</div>
                      <div>hardcore={String(hardcore)}</div>
                      <div>enable-command-block={String(commandBlocks)}</div>
                      <div>gamemode={gameMode.toLowerCase()}</div>
                      <div>online-mode={String(onlineMode)}</div>
                      <div>view-distance={viewDistance}</div>
                      <div>simulation-distance={simDistance}</div>
                      <div>motd={motd}</div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border">
                      <Button onClick={() => setPropertiesOpen(false)} size="sm">
                        Close Editor
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

              </div>
            )}
          </div>

      </div>

    </div>
  )
}
