"use client";

import { useState, useEffect } from "react";
import { useServerStore } from "@/hooks/useServerStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { playerService, PlayerItem } from "@/services/player-service";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Helper to strip ANSI escape sequences from player names
const stripAnsi = (text: string): string => {
  return text.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
};

export function ServerPlayersTab({ id }: { id: string }) {
  const { servers, addLog } = useServerStore();
  const server = servers.find((s) => s.id === id);
  const isOnline = server?.status === "online";

  const [onlinePlayers, setOnlinePlayers] = useState<PlayerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchPlayer, setSearchPlayer] = useState("");
  const [playerPage, setPlayerPage] = useState(1);

  const PAGE_SIZE = 6;
  const filtered = onlinePlayers.filter((p) =>
    stripAnsi(p.name).toLowerCase().includes(searchPlayer.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(playerPage, Math.max(1, totalPages));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  // Dialog States
  const [kickDialog, setKickDialog] = useState<{
    isOpen: boolean;
    player: PlayerItem | null;
  }>({ isOpen: false, player: null });

  const [opDialog, setOpDialog] = useState<{
    isOpen: boolean;
    player: PlayerItem | null;
  }>({ isOpen: false, player: null });

  const fetchPlayers = async (showLoading = false) => {
    if (!isOnline) {
      setOnlinePlayers([]);
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);
    try {
      const data = await playerService.list(id);
      setOnlinePlayers(data);
    } catch (err: any) {
      console.error("Failed to fetch players:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Poll players list if server is online
  useEffect(() => {
    fetchPlayers(true);

    let interval: NodeJS.Timeout | null = null;
    if (isOnline) {
      interval = setInterval(() => {
        fetchPlayers(false);
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [id, isOnline]);

  const handleKickConfirm = async () => {
    const player = kickDialog.player;
    if (!player) return;

    const cleanedName = stripAnsi(player.name);
    setKickDialog({ isOpen: false, player: null });
    try {
      toast.info(`Kicking player "${cleanedName}"...`);
      await playerService.kick(id, cleanedName);
      addLog(id, `[SYSTEM] Player ${cleanedName} has been kicked from the server.`);
      toast.success(`Player ${cleanedName} kicked successfully`);
      fetchPlayers(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to kick ${cleanedName}`);
    }
  };

  const handleOpConfirm = async () => {
    const player = opDialog.player;
    if (!player) return;

    const cleanedName = stripAnsi(player.name);
    setOpDialog({ isOpen: false, player: null });
    const nextOp = !player.op;
    try {
      toast.info(`${nextOp ? "Granting" : "Removing"} operator status for "${cleanedName}"...`);
      await playerService.toggleOp(id, cleanedName, nextOp);
      addLog(id, `[SYSTEM] Player ${cleanedName} operator status set to: ${nextOp}`);
      toast.success(`Player ${cleanedName} ${nextOp ? "opped" : "deopped"} successfully`);
      fetchPlayers(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update operator status");
    }
  };

  return (
    <Card className="flex min-h-[450px] animate-in flex-col border border-border/80 bg-card/65 p-5 duration-300 fade-in lg:h-full select-none">
      <div className="mb-4 flex shrink-0 items-center justify-between border-b border-border pb-3">
        <h3 className="font-mono text-sm font-bold tracking-wider uppercase">Connected Players</h3>
        <Input
          placeholder="Search players..."
          value={searchPlayer}
          onChange={(e) => {
            setSearchPlayer(e.target.value);
            setPlayerPage(1);
          }}
          className="h-8 max-w-[200px] text-xs font-mono"
          disabled={!isOnline}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-auto pr-1">
        {!isOnline ? (
          <div className="py-12 text-center font-mono text-xs text-muted-foreground">
            No players connected (Server is offline)
          </div>
        ) : loading ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2">
            <Spinner className="h-6 w-6 text-primary" />
            <span className="font-mono text-xs text-muted-foreground">Querying active players…</span>
          </div>
        ) : (() => {
          if (filtered.length === 0) {
            return (
              <div className="py-12 text-center font-mono text-xs text-muted-foreground">
                {searchPlayer ? `No players found matching "${searchPlayer}"` : "No players are currently online."}
              </div>
            );
          }
          return (
            <table className="w-full font-mono text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 font-semibold">Player</th>
                  <th className="py-2 font-semibold">UUID</th>
                  <th className="py-2 font-semibold">IP Address</th>
                  <th className="py-2 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {paginated.map((player) => {
                  const cleanedName = stripAnsi(player.name);
                  return (
                    <tr key={player.name} className="hover:bg-secondary/30">
                      <td className="flex items-center gap-2 py-2.5">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/20 text-[10px] font-bold text-primary uppercase">
                          {cleanedName.substring(0, 2)}
                        </div>
                        <span className="flex items-center gap-1.5 font-semibold text-foreground/90">
                          {cleanedName}
                          {player.op && (
                            <span className="py-0.2 rounded border border-amber-500/20 bg-amber-500/10 px-1 text-[9px] font-bold tracking-wider text-amber-500 uppercase">
                              OP
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="max-w-[120px] truncate py-2.5 font-mono text-[10px] text-muted-foreground/80">
                        {player.uuid}
                      </td>
                      <td className="py-2.5 text-muted-foreground">{player.ip}</td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => setOpDialog({ isOpen: true, player })}
                            className={`h-7 cursor-pointer border-border text-[10px] font-semibold ${player.op ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground hover:text-foreground"
                              }`}
                            title={player.op ? "Remove OP privileges" : "Grant OP privileges"}
                          >
                            <Shield className="mr-1 h-3 w-3" />
                            {player.op ? "Deop" : "Op"}
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => setKickDialog({ isOpen: true, player })}
                            className="h-7 cursor-pointer border-rose-500/20 bg-rose-500/5 text-[10px] font-semibold text-rose-500 hover:bg-rose-500/15"
                            title="Kick player from server"
                          >
                            Kick
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          );
        })()}
      </div>

      {/* Pagination Controls */}
      {isOnline && !loading && (
        <div className="mt-4 flex shrink-0 items-center justify-between border-t border-border pt-3.5 font-mono text-xs text-muted-foreground select-none">
          <span>
            Showing {filtered.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + PAGE_SIZE, filtered.length)} of {filtered.length} players
          </span>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setPlayerPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1 || totalPages <= 1}
              className="h-7 cursor-pointer border-border text-[10px]"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setPlayerPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages <= 1}
              className="h-7 cursor-pointer border-border text-[10px]"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Kick Player Confirmation Dialog */}
      <AlertDialog open={kickDialog.isOpen} onOpenChange={(open) => !open && setKickDialog({ isOpen: false, player: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kick Player</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to kick the player <span className="font-bold text-foreground font-mono">"{kickDialog.player ? stripAnsi(kickDialog.player.name) : ""}"</span>? They will be immediately disconnected from the game server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleKickConfirm} variant="destructive">
              Kick
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle OP Privileges Dialog */}
      <AlertDialog open={opDialog.isOpen} onOpenChange={(open) => !open && setOpDialog({ isOpen: false, player: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{opDialog.player?.op ? "Remove OP Status" : "Grant OP Status"}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {opDialog.player?.op ? "remove" : "grant"} operator privileges for <span className="font-bold text-foreground font-mono">"{opDialog.player ? stripAnsi(opDialog.player.name) : ""}"</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleOpConfirm}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
