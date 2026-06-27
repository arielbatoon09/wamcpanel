"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ClipboardList, Search, X, Play, Settings2, Upload, Download, User, Shield, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { activityLogService, ActivityLogEntry } from "@/services/activity-log-service";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivityLevel = "info" | "success" | "warning" | "error";
type ActivityCategory = "power" | "config" | "player" | "backup" | "system" | "file";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEVEL_META: Record<ActivityLevel, { label: string; icon: React.ElementType; className: string; badgeClass: string }> = {
  info: { label: "Info", icon: Info, className: "text-sky-400", badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  success: {
    label: "Success",
    icon: CheckCircle2,
    className: "text-emerald-400",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  warning: { label: "Warning", icon: AlertTriangle, className: "text-amber-400", badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  error: { label: "Error", icon: AlertTriangle, className: "text-rose-500", badgeClass: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
};

const CATEGORY_META: Record<ActivityCategory, { label: string; icon: React.ElementType }> = {
  power: { label: "Power", icon: Play },
  config: { label: "Config", icon: Settings2 },
  player: { label: "Player", icon: User },
  backup: { label: "Backup", icon: Download },
  system: { label: "System", icon: Shield },
  file: { label: "File", icon: Upload },
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatTimestamp(iso: string): string {
  return iso.substring(11, 19);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ServerActivityLogTab({ id }: { id: string }) {
  const [allLogs, setAllLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<"all" | ActivityLevel>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | ActivityCategory>("all");
  const [logPage, setLogPage] = useState(1);

  const fetchLogs = useCallback(
    async (showLoading = false) => {
      if (showLoading) setLoading(true);
      try {
        const data = await activityLogService.list(id);
        setAllLogs(data);
      } catch (err: unknown) {
        toast.error("Failed to load activity logs");
        console.error(err);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    return allLogs.filter((entry) => {
      const matchesSearch = !searchQuery.trim() || entry.message.toLowerCase().includes(searchQuery.toLowerCase()) || entry.actor.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLevel = levelFilter === "all" || entry.level === levelFilter;
      const matchesCategory = categoryFilter === "all" || entry.category === categoryFilter;
      return matchesSearch && matchesLevel && matchesCategory;
    });
  }, [allLogs, searchQuery, levelFilter, categoryFilter]);

  const isFiltering = searchQuery.trim().length > 0 || levelFilter !== "all" || categoryFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setLevelFilter("all");
    setCategoryFilter("all");
    setLogPage(1);
  };

  // Summary counts
  const counts = useMemo(
    () => ({
      error: allLogs.filter((l) => l.level === "error").length,
      warning: allLogs.filter((l) => l.level === "warning").length,
      success: allLogs.filter((l) => l.level === "success").length,
      info: allLogs.filter((l) => l.level === "info").length,
    }),
    [allLogs]
  );

  const PAGE_SIZE = 8;
  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE);
  const currentPage = Math.min(logPage, Math.max(1, totalPages));
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  return (
    <div className="flex h-full animate-in flex-col gap-4 duration-300 select-none fade-in">
      {/* Summary pills */}
      <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4">
        {(["error", "warning", "success", "info"] as ActivityLevel[]).map((lvl) => {
          const meta = LEVEL_META[lvl];
          const Icon = meta.icon;
          return (
            <button
              key={lvl}
              onClick={() => {
                setLevelFilter(levelFilter === lvl ? "all" : lvl);
                setLogPage(1);
              }}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-left transition-all duration-150",
                levelFilter === lvl ? meta.badgeClass + " scale-[0.98] border-current/30" : "border-border/80 bg-card/65 hover:border-border"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", meta.className)} />
              <div>
                <p className="text-xs font-bold text-foreground">{counts[lvl]}</p>
                <p className="text-[10px] text-muted-foreground">{meta.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Log Card */}
      <Card className="flex min-h-[450px] flex-1 flex-col overflow-hidden border border-border/80 bg-card/65 backdrop-blur-sm">
        {/* Toolbar */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/80 bg-secondary/20 px-4 py-3">
          <ClipboardList className="h-4 w-4 shrink-0 text-primary" />
          <span className="mr-auto text-xs font-bold tracking-wider uppercase">Activity Log</span>

          {/* Search */}
          <div className="flex h-8 min-w-[180px] items-center gap-1.5 rounded-lg border border-border/60 bg-background/50 px-2.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              id="activity-log-search"
              type="text"
              placeholder="Search logs…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setLogPage(1);
              }}
              className="min-w-0 flex-1 bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/50"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setLogPage(1);
                }}
                className="cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Level filter */}
          <Select
            value={levelFilter}
            onValueChange={(v) => {
              setLevelFilter(v as "all" | ActivityLevel);
              setLogPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[110px] border-border/60 text-xs">
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
          <Select
            value={categoryFilter}
            onValueChange={(v) => {
              setCategoryFilter(v as "all" | ActivityCategory);
              setLogPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[120px] border-border/60 text-xs">
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
            <button onClick={clearFilters} className="flex cursor-pointer items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="flex shrink-0 items-center justify-between border-b border-border/40 bg-secondary/10 px-4 py-1.5">
          <span className="font-mono text-[10px] text-muted-foreground">
            Showing <span className="font-bold text-foreground">{filteredLogs.length}</span> of {allLogs.length} events
          </span>
        </div>

        {/* Log entries */}
        <div className="flex-1 divide-y divide-border/30 overflow-y-auto">
          {loading ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2">
              <Spinner className="h-6 w-6 text-primary" />
              <span className="font-mono text-xs text-muted-foreground">Querying activity logs…</span>
            </div>
          ) : paginatedLogs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-muted-foreground/40 select-none">
              <ClipboardList className="h-10 w-10" />
              <p className="text-xs">No activity found matching your filters.</p>
            </div>
          ) : (
            paginatedLogs.map((entry) => {
              const levelMeta = LEVEL_META[entry.level];
              const catMeta = CATEGORY_META[entry.category];
              const LevelIcon = levelMeta.icon;
              const CatIcon = catMeta.icon;

              return (
                <div key={entry.id} className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/20">
                  {/* Level icon */}
                  <div className={cn("mt-0.5 shrink-0", levelMeta.className)}>
                    <LevelIcon className="h-3.5 w-3.5" />
                  </div>

                  {/* Main content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-snug text-foreground">{entry.message}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {/* Category badge */}
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <CatIcon className="h-3 w-3" />
                        {catMeta.label}
                      </span>
                      {/* Actor */}
                      <span className="font-mono text-[10px] text-muted-foreground/60">
                        by <span className="text-muted-foreground">{entry.actor}</span>
                      </span>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-[10px] text-muted-foreground">{formatRelativeTime(entry.timestamp)}</p>
                    <p className="mt-0.5 font-mono text-[9px] text-muted-foreground/50 transition-colors group-hover:text-muted-foreground/80">{formatTimestamp(entry.timestamp)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && (
          <div className="mt-auto flex shrink-0 items-center justify-between border-t border-border/80 px-4 py-3 font-mono text-xs text-muted-foreground select-none">
            <span>
              Showing {filteredLogs.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length} events
            </span>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="xs"
                onClick={() => setLogPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1 || totalPages <= 1}
                className="h-7 cursor-pointer border-border text-[10px]"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setLogPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages <= 1}
                className="h-7 cursor-pointer border-border text-[10px]"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
