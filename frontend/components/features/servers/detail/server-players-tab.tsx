"use client"

import { useState } from "react"
import { useServerStore } from "@/hooks/useServerStore"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Shield } from "lucide-react"

export function ServerPlayersTab({ id }: { id: string }) {
  const { servers, addLog } = useServerStore()
  const server = servers.find((s) => s.id === id)
  const isOnline = server?.status === "online"

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

  return (
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
  )
}
