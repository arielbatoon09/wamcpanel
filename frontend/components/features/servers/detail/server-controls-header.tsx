"use client";

import Link from "next/link";
import { useServerStore } from "@/hooks/useServerStore";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Play, Square, RotateCw, Skull, ArrowLeft } from "lucide-react";

interface ServerControlsHeaderProps {
  id: string;
}

export function ServerControlsHeader({ id }: ServerControlsHeaderProps) {
  const { servers, startServer, stopServer, restartServer, killServer } = useServerStore();

  const server = servers.find((s) => s.id === id);

  if (!server) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-destructive/20 bg-card/45 p-4 text-sm font-semibold text-destructive">
        Server not found!
        <Link href="/servers">
          <Button size="sm" variant="outline" className="cursor-pointer">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Server List
          </Button>
        </Link>
      </div>
    );
  }

  const isOnline = server.status === "online";
  const isOffline = server.status === "offline";

  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-card/40 p-5 backdrop-blur-md md:flex-row md:items-center">
      {/* Name and IP Info */}
      <div className="flex items-center gap-4">
        <Link href="/servers" passHref>
          <Button variant="outline" size="icon" className="h-10 w-10 cursor-pointer rounded-xl border border-border/80" title="Back to Server List">
            <ArrowLeft className="h-4 w-4 text-foreground/80" />
          </Button>
        </Link>

        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground md:text-2xl">{server.name}</h1>
            <StatusBadge status={server.status} />
          </div>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            IP: <span className="font-semibold text-foreground/80">{server.host}</span> Port: <span className="font-semibold text-foreground/80">{server.port}</span>
          </p>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
        {/* Start */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => startServer(id)}
          disabled={!isOffline}
          className="h-9 cursor-pointer gap-1.5 rounded-lg border-emerald-500/20 bg-emerald-500/5 px-3.5 text-xs font-semibold text-emerald-500 hover:bg-emerald-500/10 disabled:bg-transparent disabled:opacity-40"
        >
          <Play className="h-3.5 w-3.5 fill-emerald-500/10" />
          Start
        </Button>

        {/* Restart */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => restartServer(id)}
          disabled={!isOnline}
          className="h-9 cursor-pointer gap-1.5 rounded-lg border-amber-500/20 bg-amber-500/5 px-3.5 text-xs font-semibold text-amber-500 hover:bg-amber-500/10 disabled:bg-transparent disabled:opacity-40"
        >
          <RotateCw className="h-3.5 w-3.5" />
          Restart
        </Button>

        {/* Stop */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => stopServer(id)}
          disabled={!isOnline}
          className="h-9 cursor-pointer gap-1.5 rounded-lg border-rose-500/20 bg-rose-500/5 px-3.5 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 disabled:bg-transparent disabled:opacity-40"
        >
          <Square className="h-3.5 w-3.5 fill-rose-500/10" />
          Stop
        </Button>

        {/* Force Kill */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => killServer(id)}
          disabled={isOffline}
          className="ml-auto h-9 cursor-pointer gap-1.5 rounded-lg border-red-500/20 bg-red-500/5 px-3.5 text-xs font-semibold text-red-500 hover:bg-red-500/15 disabled:bg-transparent disabled:opacity-40 md:ml-0"
        >
          <Skull className="h-3.5 w-3.5" />
          Kill
        </Button>
      </div>
    </div>
  );
}
