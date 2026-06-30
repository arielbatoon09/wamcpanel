"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { systemService, CheckUpdateResponse } from "@/services/system-service";
import { RefreshCw, Download, CheckCircle, AlertCircle, Server } from "lucide-react";
import { toast } from "sonner";

interface UpdatesModalProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function UpdatesModal({ children, open, onOpenChange }: UpdatesModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState<CheckUpdateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeOpen = open !== undefined ? open : isOpen;
  const activeOnOpenChange = onOpenChange !== undefined ? onOpenChange : setIsOpen;

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
    } catch (err: unknown) {
      console.error(err);
      setError("Failed to fetch system update details.");
      if (!silent) {
        toast.error("Could not check for updates.");
      }
    } finally {
      if (!silent) setChecking(false);
    }
  };

  useEffect(() => {
    if (activeOpen) {
      Promise.resolve().then(() => checkUpdates(true));
    }
  }, [activeOpen]);

  const handleUpdate = async () => {
    if (!status) return;
    const initialSessionId = status.systemSessionId;
    setUpdating(true);
    try {
      const response = await systemService.triggerUpdate();
      toast.info(response.message || "Update initiated successfully! Rebuilding stack...");

      // Start polling for server restart
      pollServerRestart(initialSessionId);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || "Failed to trigger update.");
      setUpdating(false);
    }
  };

  const pollServerRestart = (initialSessionId?: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const data = await systemService.checkUpdate();

        // If session ID changed, it restarted successfully!
        if (data.systemSessionId && initialSessionId && data.systemSessionId !== initialSessionId) {
          clearInterval(interval);
          toast.success("WAMCPanel updated and restarted successfully!");
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } catch {
        // Expected network/refused connection failures during container restart
        if (attempts > 90) { // Timeout after 4.5 minutes
          clearInterval(interval);
          setUpdating(false);
          toast.error("Rebuild took too long. Please refresh the page manually.");
        }
      }
    }, 3000);
  };

  return (
    <Dialog open={activeOpen} onOpenChange={activeOnOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md border border-border bg-card/95 text-foreground backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono text-sm font-bold tracking-wider uppercase">
            <Server className="h-4 w-4 text-primary" />
            System Updates
          </DialogTitle>
        </DialogHeader>

        {updating ? (
          <div className="flex flex-col items-center justify-center py-6 text-center font-mono text-xs">
            <Spinner className="h-8 w-8 text-primary animate-spin mb-3" />
            <span className="font-bold text-foreground">Rebuilding & Restarting WAMCPanel...</span>
            <span className="text-muted-foreground mt-2 px-4 max-w-sm leading-relaxed">
              The panel is pulling the latest changes, installing dependencies, and rebuilding the Docker container stack. This window will reload automatically.
            </span>
          </div>
        ) : (
          <div className="space-y-4 font-mono text-xs mt-2">
            <div className="rounded-lg border border-border bg-background/50 p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground uppercase font-semibold">Current Version</span>
                <span className="font-bold bg-secondary px-2 py-0.5 rounded text-[10px]">
                  {status ? `v${status.currentVersion}` : "Checking..."}
                </span>
              </div>

              {status && status.updateAvailable && (
                <div className="flex justify-between items-center border-t border-border/40 pt-2">
                  <span className="text-muted-foreground uppercase font-semibold">Latest Version</span>
                  <span className="font-bold bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px]">
                    v{status.latestVersion}
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
      </DialogContent>
    </Dialog>
  );
}
