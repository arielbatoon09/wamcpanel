"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useServerStore } from "@/hooks/useServerStore";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Terminal, Send, Trash2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { io, Socket } from "socket.io-client";

interface ServerConsoleSectionProps {
  id: string;
  className?: string;
}

const EMPTY_LOGS: string[] = [];

export function ServerConsoleSection({ id, className }: ServerConsoleSectionProps) {
  const { logs, addLog, clearLogs, servers } = useServerStore();
  const [command, setCommand] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const server = servers.find((s) => s.id === id);
  const serverLogs = logs[id] || EMPTY_LOGS;

  // Filtered logs — memoised, only recomputes when logs or query change
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return serverLogs;
    const q = searchQuery.toLowerCase();
    return serverLogs.filter((log) => log.toLowerCase().includes(q));
  }, [serverLogs, searchQuery]);

  const isFiltering = searchQuery.trim().length > 0;

  // Socket Connection and Logs Streaming
  useEffect(() => {
    const socketUrl = typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:8000`
      : "http://localhost:8000";
    const socket = io(socketUrl);

    socket.on("connect", () => {
      clearLogs(id);
      addLog(id, "[SYSTEM] Connected to console gateway.");
      socket.emit("subscribe-logs", id);
    });

    socket.on("log-line", (data: { serverId: string; line: string }) => {
      if (data.serverId === id) {
        addLog(id, data.line);
      }
    });

    socket.on("disconnect", () => {
      addLog(id, "[SYSTEM] Disconnected from console gateway.");
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [id, addLog, clearLogs]);

  // Auto-scroll only when NOT actively filtering
  useEffect(() => {
    if (!isFiltering) {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [serverLogs, isFiltering]);

  const handleClearTerminal = () => {
    clearLogs(id);
    if (socketRef.current) {
      socketRef.current.emit("clear-logs", id);
    }
  };

  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    const cmd = command.trim();
    addLog(id, `> ${cmd}`);
    setCommand("");

    if (!server) return;

    if (server.status.toLowerCase() !== "online") {
      addLog(id, `[SYSTEM] Command ignored. Server is not online.`);
      return;
    }

    if (socketRef.current) {
      socketRef.current.emit("send-command", { serverId: id, command: cmd });
    }
  };

  const getLogColor = (log: string) => {
    if (log.includes("[SYSTEM]")) return "text-amber-400 font-semibold";
    if (log.startsWith("> ")) return "text-cyan-400 font-bold";
    if (log.includes("ONLINE") || log.includes("Done")) return "text-emerald-400 font-semibold";
    if (log.includes("OFFLINE") || log.includes("stopping") || log.includes("KILL")) return "text-rose-500 font-semibold";
    if (log.includes("[Broadcast]")) return "text-violet-400 font-semibold";
    if (log.includes("[CONSOLE]")) return "text-sky-400";
    return "text-zinc-300";
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return <span>{text}</span>;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <span>{text}</span>;
    return (
      <>
        <span>{text.slice(0, idx)}</span>
        <mark className="rounded-sm bg-primary/30 px-0.5 text-primary">{text.slice(idx, idx + query.length)}</mark>
        <span>{text.slice(idx + query.length)}</span>
      </>
    );
  };

  return (
    <Card className={`flex h-full flex-col overflow-hidden border border-border bg-card/65 !py-0 backdrop-blur-sm ${className || ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 bg-secondary/35 px-4 py-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <span className="font-mono text-xs font-bold tracking-wider uppercase">Live Terminal Console</span>
          <Badge variant="outline" className="h-4 px-1.5 py-0 font-mono text-[9px] text-muted-foreground">
            {serverLogs.length} lines
          </Badge>
        </div>
        <Button variant="outline" size="icon" onClick={handleClearTerminal} className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-rose-500" title="Clear Terminal Logs">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Search / Filter Bar */}
      <div className="flex items-center gap-2 border-b border-border/50 bg-black/40 px-3 py-2">
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <Input
          id="console-search"
          placeholder="Filter logs…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-7 flex-1 border-0 bg-transparent px-0 font-mono text-xs shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
        />
        {isFiltering && (
          <>
            <Badge variant="secondary" className="h-4 shrink-0 px-1.5 py-0 font-mono text-[9px]">
              {filteredLogs.length} / {serverLogs.length}
            </Badge>
            <button onClick={() => setSearchQuery("")} className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground" title="Clear filter">
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Logs View */}
      <div className="flex-1 space-y-1.5 overflow-y-auto bg-black/95 p-4 font-mono text-xs text-zinc-300 selection:bg-primary/30 selection:text-white">
        {filteredLogs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground/40 select-none">
            <Search className="h-8 w-8" />
            <span className="text-xs">{isFiltering ? `No logs matching "${searchQuery}"` : "No console output yet."}</span>
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
      <form onSubmit={handleSendCommand} className="flex gap-2 border-t border-border/80 bg-secondary/35 p-3">
        <Input
          placeholder={server?.status === "online" ? "Type server command (e.g. 'help')…" : "Server is offline. Command execution disabled."}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          disabled={server?.status !== "online"}
          className="h-9 bg-background/50 font-mono text-xs"
        />
        <Button type="submit" disabled={server?.status !== "online" || !command.trim()} className="h-9 cursor-pointer gap-1 px-3 text-xs font-semibold">
          <Send className="h-3 w-3" />
          Send
        </Button>
      </form>
    </Card>
  );
}
