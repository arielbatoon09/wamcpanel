"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useServerStore } from "@/hooks/useServerStore"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Terminal, Send, Trash2, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ServerConsoleSectionProps {
  id: string
  className?: string
}

export function ServerConsoleSection({ id, className }: ServerConsoleSectionProps) {
  const { logs, addLog, clearLogs, servers, stopServer } = useServerStore()
  const [command, setCommand] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const terminalEndRef = useRef<HTMLDivElement>(null)

  const server = servers.find((s) => s.id === id)
  const serverLogs = logs[id] || []

  // Filtered logs — memoised, only recomputes when logs or query change
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return serverLogs
    const q = searchQuery.toLowerCase()
    return serverLogs.filter((log) => log.toLowerCase().includes(q))
  }, [serverLogs, searchQuery])

  const isFiltering = searchQuery.trim().length > 0

  // Auto-scroll only when NOT actively filtering
  useEffect(() => {
    if (!isFiltering) {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [serverLogs, isFiltering])

  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault()
    if (!command.trim()) return

    const cmd = command.trim()
    addLog(id, `> ${cmd}`)
    setCommand("")

    if (!server) return

    if (server.status !== "online") {
      addLog(id, `[SYSTEM] Command ignored. Server is not online.`)
      return
    }

    setTimeout(() => {
      const lowerCmd = cmd.toLowerCase()
      if (lowerCmd === "help") {
        addLog(id, `[CONSOLE] Available Commands:`)
        addLog(id, ` - list : Show players currently online.`)
        addLog(id, ` - op <player> : Promote player to administrator.`)
        addLog(id, ` - deop <player> : Remove administrator status from player.`)
        addLog(id, ` - say <msg> : Broadcast message to all players.`)
        addLog(id, ` - stop : Safely stop the minecraft server.`)
        addLog(id, ` - gc : Trigger Java garbage collection.`)
      } else if (lowerCmd.startsWith("say ")) {
        addLog(id, `[Broadcast] ${cmd.substring(4)}`)
      } else if (lowerCmd.startsWith("op ")) {
        addLog(id, `[CONSOLE] Made ${cmd.substring(3)} a server operator`)
      } else if (lowerCmd.startsWith("deop ")) {
        addLog(id, `[CONSOLE] Removed operator status from ${cmd.substring(5)}`)
      } else if (lowerCmd === "list") {
        addLog(id, `[CONSOLE] Currently online: 14/50 players. Active: player_one, builder2, redstone_pro.`)
      } else if (lowerCmd === "stop") {
        addLog(id, `[CONSOLE] Stopping the server via console command...`)
        stopServer(id)
      } else if (lowerCmd === "gc") {
        addLog(id, `[CONSOLE] Performing garbage collection...`)
        addLog(id, `[CONSOLE] Memory freed: 1,420 MB.`)
      } else {
        addLog(id, `[CONSOLE] Unknown command. Type "help" for a list of available commands.`)
      }
    }, 400)
  }

  const getLogColor = (log: string) => {
    if (log.includes("[SYSTEM]")) return "text-amber-400 font-semibold"
    if (log.startsWith("> ")) return "text-cyan-400 font-bold"
    if (log.includes("ONLINE") || log.includes("Done")) return "text-emerald-400 font-semibold"
    if (log.includes("OFFLINE") || log.includes("stopping") || log.includes("KILL")) return "text-rose-500 font-semibold"
    if (log.includes("[Broadcast]")) return "text-violet-400 font-semibold"
    if (log.includes("[CONSOLE]")) return "text-sky-400"
    return "text-zinc-300"
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return <span>{text}</span>
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return <span>{text}</span>
    return (
      <>
        <span>{text.slice(0, idx)}</span>
        <mark className="bg-primary/30 text-primary rounded-sm px-0.5">
          {text.slice(idx, idx + query.length)}
        </mark>
        <span>{text.slice(idx + query.length)}</span>
      </>
    )
  }

  return (
    <Card className={`border border-border backdrop-blur-sm bg-card/65 flex flex-col h-full overflow-hidden ${className || ""}`}>
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-border/80 bg-secondary/35">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold font-mono tracking-wider uppercase">Live Terminal Console</span>
          <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 h-4 text-muted-foreground">
            {serverLogs.length} lines
          </Badge>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => clearLogs(id)}
          className="h-7 w-7 text-muted-foreground hover:text-rose-500 cursor-pointer"
          title="Clear Terminal Logs"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Search / Filter Bar */}
      <div className="px-3 py-2 border-b border-border/50 bg-black/40 flex items-center gap-2">
        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <Input
          id="console-search"
          placeholder="Filter logs…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-7 text-xs font-mono bg-transparent border-0 shadow-none focus-visible:ring-0 px-0 placeholder:text-muted-foreground/50 flex-1"
        />
        {isFiltering && (
          <>
            <Badge variant="secondary" className="text-[9px] font-mono px-1.5 py-0 h-4 shrink-0">
              {filteredLogs.length} / {serverLogs.length}
            </Badge>
            <button
              onClick={() => setSearchQuery("")}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Clear filter"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Logs View */}
      <div className="flex-1 bg-black/95 p-4 overflow-y-auto font-mono text-xs text-zinc-300 space-y-1.5 selection:bg-primary/30 selection:text-white">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40 gap-2 select-none">
            <Search className="h-8 w-8" />
            <span className="text-xs">
              {isFiltering ? `No logs matching "${searchQuery}"` : "No console output yet."}
            </span>
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div key={index} className={cn(getLogColor(log), "leading-relaxed break-all")}>
              {isFiltering ? highlightMatch(log, searchQuery) : log}
            </div>
          ))
        )}
        {!isFiltering && <div ref={terminalEndRef} />}
      </div>

      {/* Command Input Box */}
      <form onSubmit={handleSendCommand} className="p-3 border-t border-border/80 bg-secondary/35 flex gap-2">
        <Input
          placeholder={server?.status === "online" ? "Type server command (e.g. 'help')…" : "Server is offline. Command execution disabled."}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          disabled={server?.status !== "online"}
          className="font-mono text-xs h-9 bg-background/50"
        />
        <Button
          type="submit"
          disabled={server?.status !== "online" || !command.trim()}
          className="h-9 font-semibold text-xs cursor-pointer gap-1 px-3"
        >
          <Send className="h-3 w-3" />
          Send
        </Button>
      </form>
    </Card>
  )
}
