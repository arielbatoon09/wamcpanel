"use client"

import { useState, useEffect, useRef } from "react"
import { useServerStore } from "@/hooks/useServerStore"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Terminal, Send, Trash2 } from "lucide-react"

interface ServerConsoleSectionProps {
  id: string
  className?: string
}

export function ServerConsoleSection({ id, className }: ServerConsoleSectionProps) {
  const { logs, addLog, clearLogs, servers, stopServer, startServer, restartServer } = useServerStore()
  const [command, setCommand] = useState("")
  const terminalEndRef = useRef<HTMLDivElement>(null)

  const server = servers.find((s) => s.id === id)
  const serverLogs = logs[id] || []

  // Auto-scroll terminal to bottom when new logs arrive
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [serverLogs])

  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault()
    if (!command.trim()) return

    const cmd = command.trim()
    addLog(id, `> ${cmd}`)
    setCommand("")

    if (!server) return

    if (server.status !== "online") {
      addLog(id, `[SYSTEM] Command ignored. Server is not online.`);
      return
    }

    // Command parser simulation
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
        const msg = cmd.substring(4)
        addLog(id, `[Broadcast] ${msg}`)
      } else if (lowerCmd.startsWith("op ")) {
        const player = cmd.substring(3)
        addLog(id, `[CONSOLE] Made ${player} a server operator`)
      } else if (lowerCmd.startsWith("deop ")) {
        const player = cmd.substring(5)
        addLog(id, `[CONSOLE] Removed operator status from ${player}`)
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

  return (
    <Card className={`border border-border backdrop-blur-sm bg-card/65 flex flex-col h-full overflow-hidden ${className || ""}`}>
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-border/80 bg-secondary/35">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold font-mono tracking-wider uppercase">Live Terminal Console</span>
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

      {/* Logs View */}
      <div className="flex-1 bg-black/95 p-4 overflow-y-auto font-mono text-xs text-zinc-300 space-y-1.5 selection:bg-primary/30 selection:text-white">
        {serverLogs.map((log, index) => {
          // Color code logs based on level
          let color = "text-zinc-300"
          if (log.includes("[SYSTEM]")) color = "text-amber-400 font-semibold"
          if (log.includes("> ")) color = "text-cyan-400 font-bold"
          if (log.includes("ONLINE") || log.includes("Done")) color = "text-emerald-400 font-semibold"
          if (log.includes("OFFLINE") || log.includes("stopping") || log.includes("KILL")) color = "text-rose-500 font-semibold"

          return (
            <div key={index} className={`${color} leading-relaxed break-all`}>
              {log}
            </div>
          )
        })}
        <div ref={terminalEndRef} />
      </div>

      {/* Command Input Box */}
      <form onSubmit={handleSendCommand} className="p-3 border-t border-border/80 bg-secondary/35 flex gap-2">
        <Input
          placeholder={server?.status === "online" ? "Type server command (e.g. 'help')..." : "Server is offline. Command execution disabled."}
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
