"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { systemService, CheckUpdateResponse } from "@/services/system-service";
import { GitBranch, AlertCircle, RefreshCw } from "lucide-react";

export function PanelVersionBadge() {
  const [status, setStatus] = useState<CheckUpdateResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await systemService.checkUpdate();
        setStatus(data);
      } catch (err) {
        console.error("Failed to check panel version:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/10 px-3 py-1.5 font-mono text-[10px] text-muted-foreground select-none">
        <RefreshCw className="h-3 w-3 animate-spin" />
        Checking Version...
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className="flex items-center gap-2 select-none">
      {status.updateAvailable ? (
        <Link
          href="/settings"
          className="group flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 font-mono text-[10px] font-semibold text-amber-500 transition-all hover:bg-amber-500/10 active:scale-95"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
          </span>
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>Update Available (v{status.latestVersion})</span>
        </Link>
      ) : null}

      <div className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/15 px-3 py-1.5 font-mono text-[10px] text-muted-foreground">
        <GitBranch className="h-3 w-3 shrink-0" />
        <span>Panel Ver: <span className="font-bold text-foreground/80">v{status.currentVersion}</span></span>
      </div>
    </div>
  );
}
