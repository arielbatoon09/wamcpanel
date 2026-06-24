"use client";

import { useState } from "react";
import { useServerStore } from "@/hooks/useServerStore";
import { Button } from "@/components/ui/button";
import { useRouter, useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/common/status-badge";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import Link from "next/link";
import { Terminal, Activity, FolderOpen, ToyBrick, Database, Settings2, ArrowLeft, Play, Square, RotateCw, Skull, Menu, Cpu, HardDrive, Users, ClipboardList } from "lucide-react";

interface ServerDetailsLayoutProps {
  children: React.ReactNode;
}

export function ServerDetailsLayout({ children }: ServerDetailsLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const id = params.id as string;

  const { servers, startServer, stopServer, restartServer, killServer } = useServerStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const server = servers.find((s) => s.id === id);

  if (!server) return null;

  const isOnline = server.status === "online";
  const isOffline = server.status === "offline";
  const isStarting = server.status === "starting";
  const isStopping = server.status === "stopping";

  // Quick statistics calculation
  const ramPercent = server.ramLimit > 0 ? (server.metrics.ramUsage / server.ramLimit) * 100 : 0;
  const cpuPercent = server.cpuLimit > 0 ? (server.metrics.cpuUsage / server.cpuLimit) * 100 : 0;
  const playerPercent = server.maxPlayers > 0 ? (server.currentPlayers / server.maxPlayers) * 100 : 0;

  // Navigation Items
  const navItems = [
    { id: "overview", label: "Overview", icon: Activity, path: `/server/${id}` },
    { id: "console", label: "Console", icon: Terminal, path: `/server/${id}/console` },
    { id: "files", label: "File Manager", icon: FolderOpen, path: `/server/${id}/files` },
    { id: "players", label: "Players", icon: Users, path: `/server/${id}/players` },
    { id: "plugins", label: "Plugins", icon: ToyBrick, path: `/server/${id}/plugins` },
    { id: "backups", label: "Backups", icon: Database, path: `/server/${id}/backups` },
    { id: "activity", label: "Activity Logs", icon: ClipboardList, path: `/server/${id}/activity` },
    { id: "settings", label: "Settings", icon: Settings2, path: `/server/${id}/settings` },
  ] as const;

  // Determine active tab based on pathname
  const segments = pathname.split("/");
  const lastSegment = segments[segments.length - 1];
  const activeTab = (["console", "files", "players", "plugins", "backups", "activity", "settings"].includes(lastSegment) ? lastSegment : "overview") as
    | "overview"
    | "console"
    | "files"
    | "plugins"
    | "backups"
    | "activity"
    | "settings"
    | "players";

  // Sidebar Component
  const sidebarContent = (
    <div className="flex h-full flex-col bg-card select-none">
      {/* Back to Servers */}
      <div className="shrink-0 border-b border-border/60 p-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/servers")}
          className="h-8 w-full cursor-pointer justify-start gap-2 border-border/80 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Server List
        </Button>
      </div>

      {/* Active Server Identity Card */}
      <div className="shrink-0 space-y-2 border-b border-border/60 bg-secondary/10 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="max-w-[150px] truncate text-xs font-bold text-foreground">{server.name}</h4>
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
              {server.host}:{server.port}
            </p>
          </div>
          <span className="relative mt-1 flex h-2 w-2">
            <span
              className={cn(
                "relative inline-flex h-2 w-2 rounded-full",
                isOnline ? "animate-pulse bg-emerald-500" : isStarting ? "animate-pulse bg-amber-500" : isStopping ? "animate-pulse bg-rose-500" : "bg-muted-foreground"
              )}
            />
          </span>
        </div>
        <div className="flex items-center justify-between pt-1 font-mono text-[10px] text-muted-foreground">
          <span>
            Type: <span className="font-bold text-foreground/80">{server.software}</span>
          </span>
          <span>
            Ver: <span className="font-bold text-foreground/80">{server.version}</span>
          </span>
        </div>
      </div>

      {/* Navigation Tabs List */}
      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        <div className="px-2 pb-2 text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">Management</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <Link
              key={item.id}
              href={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-xs font-semibold transition-all duration-150",
                isActive ? "border-primary/20 bg-primary/10 font-bold text-primary shadow-xs" : "border-transparent text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Bottom Power Controls & Theme Toggle */}
      <div className="shrink-0 space-y-3 border-t border-border bg-muted/40 p-3">
        <div className="grid grid-cols-2 gap-1.5">
          {/* Start */}
          <Button
            variant="outline"
            size="xs"
            onClick={() => startServer(id)}
            disabled={!isOffline}
            className="h-7 cursor-pointer border-emerald-500/20 bg-emerald-500/5 text-[10px] font-semibold text-emerald-500 hover:bg-emerald-500/10 disabled:bg-transparent disabled:opacity-30"
          >
            <Play className="mr-1 h-3 w-3 fill-emerald-500/10" />
            Start
          </Button>

          {/* Stop */}
          <Button
            variant="outline"
            size="xs"
            onClick={() => stopServer(id)}
            disabled={!isOnline}
            className="h-7 cursor-pointer border-rose-500/20 bg-rose-500/5 text-[10px] font-semibold text-rose-500 hover:bg-rose-500/10 disabled:bg-transparent disabled:opacity-30"
          >
            <Square className="mr-1 h-3 w-3 fill-rose-500/10" />
            Stop
          </Button>

          {/* Restart */}
          <Button
            variant="outline"
            size="xs"
            onClick={() => restartServer(id)}
            disabled={!isOnline}
            className="h-7 cursor-pointer border-amber-500/20 bg-amber-500/5 text-[10px] font-semibold text-amber-500 hover:bg-amber-500/10 disabled:bg-transparent disabled:opacity-30"
          >
            <RotateCw className="mr-1 h-3 w-3" />
            Restart
          </Button>

          {/* Kill */}
          <Button
            variant="outline"
            size="xs"
            onClick={() => killServer(id)}
            disabled={isOffline}
            className="h-7 cursor-pointer border-red-500/20 bg-red-500/5 text-[10px] font-semibold text-red-500 hover:bg-red-500/15 disabled:bg-transparent disabled:opacity-30"
          >
            <Skull className="mr-1 h-3 w-3" />
            Kill
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-auto w-full flex-col gap-6 lg:h-full lg:flex-row">
      {/* Sidebar Card Panel on Left */}
      <aside className="hidden h-full w-64 shrink-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card lg:flex">
        {sidebarContent}
      </aside>

      {/* Mobile Top Header & Navigation Toggle */}
      <div className="flex w-full shrink-0 items-center justify-between border-b border-border bg-card p-3.5 backdrop-blur-md lg:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/servers" className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary">
            <span className="font-mono text-xs font-black text-primary-foreground">W</span>
          </Link>
          <div className="min-w-0">
            <h1 className="max-w-[130px] truncate text-xs leading-tight font-extrabold text-foreground">{server.name}</h1>
            <p className="mt-0.5 font-mono text-[10px] leading-none text-muted-foreground">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Tab</p>
          </div>
        </div>

        <Drawer direction="left" open={mobileOpen} onOpenChange={setMobileOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 cursor-pointer gap-1.5 border-border text-xs">
              <Menu className="h-4 w-4" />
              Console Menu
            </Button>
          </DrawerTrigger>
          <DrawerContent className="flex h-full w-[280px] flex-col rounded-r-xl border-r p-0">
            {sidebarContent}
          </DrawerContent>
        </Drawer>
      </div>

      {/* Right Content Workspace */}
      <div className="flex h-auto min-w-0 flex-1 flex-col gap-6 lg:h-full">
        {/* Top Info Bar (Real-time Resource Utilization widgets) */}
        <div className="grid shrink-0 grid-cols-1 gap-4 rounded-xl border border-border bg-card/65 p-4 backdrop-blur-md md:grid-cols-4">
          {/* Status & Name Card */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <StatusBadge status={server.status} />
            </div>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              IP: <span className="font-bold text-foreground/80">{server.host}</span> Port: <span className="font-bold text-foreground/80">{server.port}</span>
            </p>
          </div>

          {/* CPU Widget */}
          <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/30 p-2.5">
            <Cpu className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <span className="block font-mono text-[9px] tracking-wider text-muted-foreground uppercase">CPU Utilization</span>
              <span className="mt-0.5 block font-mono text-xs font-bold text-foreground">{isOnline ? `${server.metrics.cpuUsage.toFixed(1)}%` : "0.0%"}</span>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-border/40">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${isOnline ? cpuPercent : 0}%` }} />
              </div>
            </div>
          </div>

          {/* RAM Widget */}
          <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/30 p-2.5">
            <HardDrive className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <span className="block font-mono text-[9px] tracking-wider text-muted-foreground uppercase">Memory Allocation</span>
              <span className="mt-0.5 block font-mono text-xs font-bold text-foreground">
                {isOnline ? `${(server.metrics.ramUsage / 1024).toFixed(1)} GB / ${(server.ramLimit / 1024).toFixed(0)} GB` : `0.0 GB / ${(server.ramLimit / 1024).toFixed(0)} GB`}
              </span>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-border/40">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${isOnline ? ramPercent : 0}%` }} />
              </div>
            </div>
          </div>

          {/* Players Widget */}
          <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/30 p-2.5">
            <Users className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <span className="block font-mono text-[9px] tracking-wider text-muted-foreground uppercase">Active Players</span>
              <span className="mt-0.5 block font-mono text-xs font-bold text-foreground">{isOnline ? `${server.currentPlayers} / ${server.maxPlayers}` : `0 / ${server.maxPlayers}`}</span>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-border/40">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${isOnline ? playerPercent : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Active Tab Panel Body */}
        <div className="min-h-0 min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
