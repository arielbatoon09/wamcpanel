"use client";

import { useState } from "react";
import { useServerStore } from "@/hooks/useServerStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield } from "lucide-react";

export function ServerPlayersTab({ id }: { id: string }) {
  const { servers, addLog } = useServerStore();
  const server = servers.find((s) => s.id === id);
  const isOnline = server?.status === "online";

  const [onlinePlayers, setOnlinePlayers] = useState([
    { name: "player_one", uuid: "d3b07384-d113-4956-aab9-e8b75c123456", ping: "42ms", op: true, ip: "127.0.0.1" },
    { name: "redstone_pro", uuid: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d", ping: "18ms", op: false, ip: "192.168.1.50" },
    { name: "builder2", uuid: "f9e8d7c6-b5a4-3210-fedc-ba9876543210", ping: "75ms", op: false, ip: "10.0.0.12" },
  ]);
  const [searchPlayer, setSearchPlayer] = useState("");

  const handleKickPlayer = (name: string) => {
    if (confirm(`Are you sure you want to kick player "${name}"?`)) {
      setOnlinePlayers(onlinePlayers.filter((p) => p.name !== name));
      addLog(id, `[SYSTEM] Player ${name} has been kicked from the server.`);
      toast.success(`Player ${name} kicked`);
    }
  };

  const handleToggleOp = (name: string) => {
    setOnlinePlayers(
      onlinePlayers.map((p) => {
        if (p.name === name) {
          const nextOp = !p.op;
          addLog(id, `[SYSTEM] Player ${name} operator status set to: ${nextOp}`);
          toast.success(`Player ${name} ${nextOp ? "opped" : "deopped"}`);
          return { ...p, op: nextOp };
        }
        return p;
      })
    );
  };

  return (
    <Card className="flex min-h-[450px] animate-in flex-col border border-border/80 bg-card/65 p-5 duration-300 fade-in lg:h-full">
      <div className="mb-4 flex shrink-0 items-center justify-between border-b border-border pb-3">
        <h3 className="font-mono text-sm font-bold tracking-wider uppercase">Connected Players</h3>
        <Input placeholder="Search players..." value={searchPlayer} onChange={(e) => setSearchPlayer(e.target.value)} className="h-8 max-w-[200px] text-xs" disabled={!isOnline} />
      </div>

      <div className="min-h-0 flex-1 overflow-auto pr-1">
        {!isOnline ? (
          <div className="py-12 text-center font-mono text-xs text-muted-foreground">No players connected (Server is offline)</div>
        ) : (
          (() => {
            const filtered = onlinePlayers.filter((p) => p.name.toLowerCase().includes(searchPlayer.toLowerCase()));
            if (filtered.length === 0) {
              return <div className="py-12 text-center font-mono text-xs text-muted-foreground">No players found matching &quot;{searchPlayer}&quot;</div>;
            }
            return (
              <table className="w-full font-mono text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 font-semibold">Player</th>
                    <th className="py-2 font-semibold">UUID</th>
                    <th className="py-2 font-semibold">IP Address</th>
                    <th className="py-2 font-semibold">Ping</th>
                    <th className="py-2 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filtered.map((player) => (
                    <tr key={player.name} className="hover:bg-secondary/30">
                      <td className="flex items-center gap-2 py-2.5">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/20 text-[10px] font-bold text-primary uppercase">{player.name.substring(0, 2)}</div>
                        <span className="flex items-center gap-1.5 font-semibold text-foreground/90">
                          {player.name}
                          {player.op && <span className="py-0.2 rounded border border-amber-500/20 bg-amber-500/10 px-1 text-[9px] font-bold tracking-wider text-amber-500 uppercase">OP</span>}
                        </span>
                      </td>
                      <td className="max-w-[120px] truncate py-2.5 font-mono text-[10px] text-muted-foreground/80">{player.uuid}</td>
                      <td className="py-2.5 text-muted-foreground">{player.ip}</td>
                      <td className="py-2.5 font-bold text-emerald-400">{player.ping}</td>
                      <td className="flex items-center justify-end gap-1.5 py-2.5 text-right">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleToggleOp(player.name)}
                          className={`h-7 cursor-pointer border-border text-[10px] font-semibold ${player.op ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground hover:text-foreground"}`}
                          title={player.op ? "Remove OP privileges" : "Grant OP privileges"}
                        >
                          <Shield className="mr-1 h-3 w-3" />
                          {player.op ? "Deop" : "Op"}
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleKickPlayer(player.name)}
                          className="h-7 cursor-pointer border-rose-500/20 bg-rose-500/5 text-[10px] font-semibold text-rose-500 hover:bg-rose-500/15"
                          title="Kick player from server"
                        >
                          Kick
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()
        )}
      </div>
    </Card>
  );
}
