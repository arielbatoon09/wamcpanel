"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ClipboardList,
  Search,
  X,
  Play,
  Square,
  RotateCw,
  Skull,
  Settings2,
  Upload,
  Download,
  User,
  Shield,
  AlertTriangle,
  Info,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivityLevel = "info" | "success" | "warning" | "error"
type ActivityCategory = "power" | "config" | "player" | "backup" | "system" | "file"

interface ActivityEntry {
  id: string
  timestamp: string
  level: ActivityLevel
  category: ActivityCategory
  actor: string
  message: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

// Single fixed reference for all time calculations in this module.
// Using Date.now() anywhere during render causes SSR/client hydration mismatches.
const MOCK_NOW = new Date("2026-06-24T12:00:00.000Z").getTime()

function generateMockLogs(serverId: string): ActivityEntry[] {
  const now = MOCK_NOW
  const min = 60_000

  const entries: ActivityEntry[] = [
    {
      id: "a1",
      timestamp: new Date(now - 2 * min).toISOString(),
      level: "success",
      category: "power",
      actor: "admin",
      message: "Server started successfully.",
    },
    {
      id: "a2",
      timestamp: new Date(now - 5 * min).toISOString(),
      level: "info",
      category: "player",
      actor: "system",
      message: "Player player_one joined the server.",
    },
    {
      id: "a3",
      timestamp: new Date(now - 8 * min).toISOString(),
      level: "info",
      category: "player",
      actor: "system",
      message: "Player builder2 joined the server.",
    },
    {
      id: "a4",
      timestamp: new Date(now - 12 * min).toISOString(),
      level: "warning",
      category: "system",
      actor: "system",
      message: "High memory usage detected: 87% of allocated RAM.",
    },
    {
      id: "a5",
      timestamp: new Date(now - 15 * min).toISOString(),
      level: "info",
      category: "config",
      actor: "admin",
      message: "server.properties updated — max-players changed from 20 to 50.",
    },
    {
      id: "a6",
      timestamp: new Date(now - 20 * min).toISOString(),
      level: "success",
      category: "backup",
      actor: "system",
      message: "Automatic backup completed (backup-20260624-120000.zip, 1.4 GB).",
    },
    {
      id: "a7",
      timestamp: new Date(now - 30 * min).toISOString(),
      level: "info",
      category: "file",
      actor: "admin",
      message: "File uploaded: plugins/EssentialsX-2.21.0.jar",
    },
    {
      id: "a8",
      timestamp: new Date(now - 35 * min).toISOString(),
      level: "error",
      category: "system",
      actor: "system",
      message: "Plugin WorldEdit failed to load — incompatible API version.",
    },
    {
      id: "a9",
      timestamp: new Date(now - 40 * min).toISOString(),
      level: "warning",
      category: "power",
      actor: "admin",
      message: "Server restart triggered manually.",
    },
    {
      id: "a10",
      timestamp: new Date(now - 45 * min).toISOString(),
      level: "info",
      category: "player",
      actor: "admin",
      message: "Player redstone_pro granted operator privileges.",
    },
    {
      id: "a11",
      timestamp: new Date(now - 60 * min).toISOString(),
      level: "success",
      category: "backup",
      actor: "system",
      message: "Backup restored successfully from backup-20260623-060000.zip.",
    },
    {
      id: "a12",
      timestamp: new Date(now - 90 * min).toISOString(),
      level: "info",
      category: "power",
      actor: "admin",
      message: "Server stopped gracefully.",
    },
    {
      id: "a13",
      timestamp: new Date(now - 120 * min).toISOString(),
      level: "error",
      category: "power",
      actor: "admin",
      message: "Kill signal sent — server was unresponsive for 60 seconds.",
    },
    {
      id: "a14",
      timestamp: new Date(now - 180 * min).toISOString(),
      level: "info",
      category: "file",
      actor: "admin",
      message: "File deleted: world/region/r.0.0.mca",
    },
    {
      id: "a15",
      timestamp: new Date(now - 240 * min).toISOString(),
      level: "info",
      category: "config",
      actor: "admin",
      message: "spigot.yml updated — view-distance changed from 10 to 8.",
    },
  ]

  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}


// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEVEL_META: Record<ActivityLevel, { label: string; icon: React.ElementType; className: string; badgeClass: string }> = {
  info:    { label: "Info",    icon: Info,          className: "text-sky-400",     badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  success: { label: "Success", icon: CheckCircle2,  className: "text-emerald-400", badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  warning: { label: "Warning", icon: AlertTriangle, className: "text-amber-400",   badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  error:   { label: "Error",   icon: AlertTriangle, className: "text-rose-500",    badgeClass: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
}

const CATEGORY_META: Record<ActivityCategory, { label: string; icon: React.ElementType }> = {
  power:  { label: "Power",   icon: Play },
  config: { label: "Config",  icon: Settings2 },
  player: { label: "Player",  icon: User },
  backup: { label: "Backup",  icon: Download },
  system: { label: "System",  icon: Shield },
  file:   { label: "File",    icon: Upload },
}

function formatRelativeTime(iso: string): string {
  // Use MOCK_NOW — not Date.now() — to stay deterministic between SSR and client.
  const diff = MOCK_NOW - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function formatTimestamp(iso: string): string {
  // Slice UTC time directly from the ISO string — toLocaleTimeString() produces
  // different output on Node.js (server) vs browser, causing hydration mismatches.
  // ISO format: "YYYY-MM-DDTHH:MM:SS.mmmZ" → chars 11–18 = "HH:MM:SS"
  return iso.substring(11, 19)
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ServerActivityLogTabProps {
  id: string
}

export function ServerActivityLogTab({ id }: ServerActivityLogTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [levelFilter, setLevelFilter] = useState<"all" | ActivityLevel>("all")
  const [categoryFilter, setCategoryFilter] = useState<"all" | ActivityCategory>("all")

  const allLogs = useMemo(() => generateMockLogs(id), [id])

  const filteredLogs = useMemo(() => {
    return allLogs.filter((entry) => {
      const matchesSearch =
        !searchQuery.trim() ||
        entry.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.actor.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesLevel = levelFilter === "all" || entry.level === levelFilter
      const matchesCategory = categoryFilter === "all" || entry.category === categoryFilter
      return matchesSearch && matchesLevel && matchesCategory
    })
  }, [allLogs, searchQuery, levelFilter, categoryFilter])

  const isFiltering =
    searchQuery.trim().length > 0 || levelFilter !== "all" || categoryFilter !== "all"

  const clearFilters = () => {
    setSearchQuery("")
    setLevelFilter("all")
    setCategoryFilter("all")
  }

  // Summary counts
  const counts = useMemo(
    () => ({
      error:   allLogs.filter((l) => l.level === "error").length,
      warning: allLogs.filter((l) => l.level === "warning").length,
      success: allLogs.filter((l) => l.level === "success").length,
      info:    allLogs.filter((l) => l.level === "info").length,
    }),
    [allLogs]
  )

  return (
    <div className="flex flex-col h-full gap-4 animate-in fade-in duration-300">
      {/* Summary pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
        {(["error", "warning", "success", "info"] as ActivityLevel[]).map((lvl) => {
          const meta = LEVEL_META[lvl]
          const Icon = meta.icon
          return (
            <button
              key={lvl}
              onClick={() => setLevelFilter(levelFilter === lvl ? "all" : lvl)}
              className={cn(
                "flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all duration-150 text-left",
                levelFilter === lvl
                  ? meta.badgeClass + " border-current/30 scale-[0.98]"
                  : "bg-card/65 border-border/80 hover:border-border"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", meta.className)} />
              <div>
                <p className="text-xs font-bold text-foreground">{counts[lvl]}</p>
                <p className="text-[10px] text-muted-foreground">{meta.label}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Main Log Card */}
      <Card className="flex-1 min-h-0 border border-border/80 bg-card/65 backdrop-blur-sm flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border/80 bg-secondary/20 shrink-0">
          <ClipboardList className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider mr-auto">Activity Log</span>

          {/* Search */}
          <div className="flex items-center gap-1.5 bg-background/50 border border-border/60 rounded-lg px-2.5 h-8 min-w-[180px]">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              id="activity-log-search"
              type="text"
              placeholder="Search logs…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs font-mono outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Level filter */}
          <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as "all" | ActivityLevel)}>
            <SelectTrigger className="h-8 text-xs w-[110px] border-border/60">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>

          {/* Category filter */}
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as "all" | ActivityCategory)}>
            <SelectTrigger className="h-8 text-xs w-[120px] border-border/60">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="power">Power</SelectItem>
              <SelectItem value="config">Config</SelectItem>
              <SelectItem value="player">Player</SelectItem>
              <SelectItem value="backup">Backup</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="file">File</SelectItem>
            </SelectContent>
          </Select>

          {isFiltering && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="px-4 py-1.5 border-b border-border/40 bg-secondary/10 shrink-0 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground font-mono">
            Showing <span className="text-foreground font-bold">{filteredLogs.length}</span> of {allLogs.length} events
          </span>
        </div>

        {/* Log entries */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/30">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40 gap-2 select-none py-16">
              <ClipboardList className="h-10 w-10" />
              <p className="text-xs">No activity found matching your filters.</p>
            </div>
          ) : (
            filteredLogs.map((entry) => {
              const levelMeta = LEVEL_META[entry.level]
              const catMeta = CATEGORY_META[entry.category]
              const LevelIcon = levelMeta.icon
              const CatIcon = catMeta.icon

              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors group"
                >
                  {/* Level icon */}
                  <div className={cn("mt-0.5 shrink-0", levelMeta.className)}>
                    <LevelIcon className="h-3.5 w-3.5" />
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-snug">{entry.message}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {/* Category badge */}
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <CatIcon className="h-3 w-3" />
                        {catMeta.label}
                      </span>
                      {/* Actor */}
                      <span className="text-[10px] text-muted-foreground/60 font-mono">
                        by <span className="text-muted-foreground">{entry.actor}</span>
                      </span>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {formatRelativeTime(entry.timestamp)}
                    </p>
                    <p className="text-[9px] text-muted-foreground/50 font-mono mt-0.5 group-hover:text-muted-foreground/80 transition-colors">
                      {formatTimestamp(entry.timestamp)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>
    </div>
  )
}
