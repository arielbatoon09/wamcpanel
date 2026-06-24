"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, usePathname, useRouter } from "next/navigation"
import { useServerStore } from "@/hooks/useServerStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { 
  Search, 
  ChevronLeft, 
  Server, 
  Menu,
  Sun,
  Moon,
  Shield
} from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer"

export default function ServerDetailLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { servers } = useServerStore()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)
  
  const currentId = params?.id as string | undefined
  const activeServer = servers.find((s) => s.id === currentId)

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // Filter servers based on search
  const filteredServers = servers.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.software.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Status color mapper
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-emerald-500 animate-pulse"
      case "starting":
        return "bg-amber-500 animate-pulse"
      case "stopping":
        return "bg-rose-500 animate-pulse"
      default:
        return "bg-muted-foreground/60"
    }
  }

  // Sidebar list content component to avoid repetition
  const SidebarList = () => (
    <div className="flex flex-col h-full bg-card">
      {/* Header Logo & Back Action */}
      <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
        <Link href="/servers" className="flex items-center gap-2 overflow-hidden select-none">
          <div className="h-7 w-7 rounded bg-primary flex items-center justify-center shrink-0">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-extrabold text-sm tracking-tight font-sans whitespace-nowrap">
            Server Panel
          </span>
        </Link>
      </div>

      {/* Title & Count */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-wider font-sans">
          <Server className="h-3.5 w-3.5" />
          <span>My Servers</span>
        </div>
        <span className="text-[10px] bg-secondary/80 border border-border px-2 py-0.5 rounded-full font-mono text-muted-foreground">
          {servers.length}
        </span>
      </div>

      {/* Search Input */}
      <div className="px-3 py-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Quick search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-secondary/30 border-border/60"
          />
        </div>
      </div>

      {/* Server list scrollarea */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {filteredServers.length > 0 ? (
          filteredServers.map((srv) => {
            const isActive = srv.id === currentId
            return (
              <Link
                key={srv.id}
                href={`/servers/${srv.id}`}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-lg text-xs transition-all duration-200 border cursor-pointer select-none group",
                  isActive
                    ? "bg-primary/10 border-primary/30 text-foreground font-semibold"
                    : "border-transparent text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                )}
              >
                {/* Status Indicator Dot */}
                <div className="relative flex h-2.5 w-2.5 shrink-0 justify-center items-center">
                  <span className={cn("h-2 w-2 rounded-full", getStatusColor(srv.status))} />
                </div>

                {/* Server Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-1.5">
                    <p className={cn(
                      "font-bold truncate text-[11px] leading-tight transition-colors duration-150",
                      isActive ? "text-primary" : "group-hover:text-foreground"
                    )}>
                      {srv.name}
                    </p>
                    <span className="text-[9px] uppercase font-mono bg-secondary/80 border border-border/60 px-1 py-0.2 rounded shrink-0">
                      {srv.software}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                    {srv.host}:{srv.port}
                  </p>
                </div>
              </Link>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <span className="text-xs">No servers found</span>
          </div>
        )}
      </div>

      {/* Footer Area with Navigation & Settings */}
      <div className="p-3 border-t border-border bg-muted/40 shrink-0 space-y-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          className="w-full h-8 justify-start gap-2 text-xs font-semibold cursor-pointer border-border"
        >
          <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 shrink-0 text-amber-500" />
          <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 shrink-0 text-blue-400" />
          <span>Toggle Theme</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/servers")}
          className="w-full h-8 justify-start gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to Server List
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col lg:flex-row min-h-screen h-screen overflow-hidden bg-background">
      
      {/* Sidebar for Desktop Viewports */}
      <aside className="hidden lg:block w-72 shrink-0 bg-card border-r border-border h-full sticky top-0">
        <div className="h-full flex flex-col">
          <SidebarList />
        </div>
      </aside>

      {/* Mobile Top Navigation & Drawer Trigger */}
      <div className="lg:hidden w-full flex items-center justify-between p-3.5 bg-card/45 border-b border-border backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", activeServer ? getStatusColor(activeServer.status) : "bg-muted-foreground")} />
          <div className="min-w-0">
            <span className="text-xs text-muted-foreground block font-mono uppercase tracking-wider leading-none">Active Server</span>
            <span className="text-sm font-bold text-foreground truncate block mt-0.5">
              {activeServer?.name || "Select Server..."}
            </span>
          </div>
        </div>

        <Drawer direction="left" open={mobileOpen} onOpenChange={setMobileOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs cursor-pointer border-border">
              <Menu className="h-4 w-4" />
              Servers
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-full w-[280px] rounded-r-xl border-r p-0 flex flex-col">
            <SidebarList />
          </DrawerContent>
        </Drawer>
      </div>

      {/* Main Server Detail Content */}
      <div className="flex-1 min-w-0 h-full overflow-y-auto p-6 bg-background/50">
        <div className="max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </div>

    </div>
  )
}
