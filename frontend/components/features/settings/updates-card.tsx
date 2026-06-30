"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { systemService, CheckUpdateResponse } from "@/services/system-service";
import { RefreshCw, Download, CheckCircle, AlertCircle, Server } from "lucide-react";
import { toast } from "sonner";

export function UpdatesCard() {
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState<CheckUpdateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkUpdates = async (silent = false) => {
    if (!silent) setChecking(true);
    setError(null);
    try {
      const data = await systemService.checkUpdate();
      setStatus(data);
      if (!silent && data.updateAvailable) {
        toast.info("A new update is available!");
      } else if (!silent && !data.updateAvailable) {
        toast.success("Panel is up to date.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch system update details.");
      if (!silent) {
        toast.error("Could not check for updates.");
      }
    } finally {
      if (!silent) setChecking(false);
    }
  };

  // Run on mount
  useEffect(() => {
    checkUpdates(true);
  }, []);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const response = await systemService.triggerUpdate();
      toast.success(response.message || "Update initiated successfully!");

      // Start polling for server restart
      pollServerRestart();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to trigger update.");
      setUpdating(false);
    }
  };

  const pollServerRestart = () => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        // Try checking update status. This will fail while container is restarting
        await systemService.checkUpdate();

        // If we reach here, it successfully responded!
        clearInterval(interval);
        toast.success("WAMCPanel updated and restarted successfully!");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        // Expected failures during container restart
        if (attempts > 60) { // Timeout after 3 minutes
          clearInterval(interval);
          setUpdating(false);
          toast.error("Rebuild took too long. Please refresh the page manually.");
        }
      }
    }, 3000);
  };

  return (
    <Card className="space-y-4 border border-border bg-card/65 p-5">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Server className="h-4 w-4 text-primary" />
        <h3 className="font-mono text-sm font-bold tracking-wider uppercase">System Updates</h3>
      </div>

      {updating ? (
        <div className="flex flex-col items-center justify-center py-6 text-center font-mono text-xs">
          <Spinner className="h-8 w-8 text-primary animate-spin mb-3" />
          <span className="font-bold text-foreground">Rebuilding & Restarting WAMCPanel...</span>
          <span className="text-muted-foreground mt-1 px-4 max-w-sm">
            The panel is pulling the latest changes, installing dependencies, and rebuilding the Docker container stack. This page will reload automatically.
          </span>
        </div>
      ) : (
        <div className="space-y-4 font-mono text-xs">
          <div className="rounded-lg border border-border bg-background/50 p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground uppercase font-semibold">Current Version</span>
              <span className="font-bold bg-secondary px-2 py-0.5 rounded text-[10px]">
                {status ? `v${status.currentVersion} (${status.currentCommit})` : "Checking..."}
              </span>
            </div>

            {status && status.updateAvailable && (
              <div className="flex justify-between items-center border-t border-border/40 pt-2">
                <span className="text-muted-foreground uppercase font-semibold">Latest Version</span>
                <span className="font-bold bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px]">
                  {`v${status.latestVersion} (${status.latestCommit})`}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center border-t border-border/40 pt-2">
              <span className="text-muted-foreground uppercase font-semibold">Update Status</span>
              {checking ? (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Checking...
                </span>
              ) : error ? (
                <span className="flex items-center gap-1 text-rose-500 font-semibold">
                  <AlertCircle className="h-3.5 w-3.5" /> Error
                </span>
              ) : status?.updateAvailable ? (
                <span className="flex items-center gap-1 text-amber-500 font-semibold">
                  <AlertCircle className="h-3.5 w-3.5" /> Outdated
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                  <CheckCircle className="h-3.5 w-3.5" /> Up to Date
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={checking}
              onClick={() => checkUpdates()}
              className="h-8 flex-1 gap-1 text-[11px] font-semibold cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 ${checking ? "animate-spin" : ""}`} />
              Check Updates
            </Button>

            {status?.updateAvailable && (
              <Button
                type="button"
                size="sm"
                onClick={handleUpdate}
                className="h-8 flex-1 gap-1 text-[11px] font-semibold cursor-pointer"
              >
                <Download className="h-3 w-3" />
                Update Panel
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
