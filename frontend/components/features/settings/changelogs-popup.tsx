"use client";

import { useState, useEffect } from "react";
import { systemService, ChangelogItem } from "@/services/system-service";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Check, ClipboardList } from "lucide-react";

export function ChangelogsPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [version, setVersion] = useState("");
  const [changelog, setChangelog] = useState<ChangelogItem | null>(null);

  useEffect(() => {
    const checkChangelogTrigger = async () => {
      try {
        const status = await systemService.checkUpdate();
        const currentVer = status.currentVersion;

        const lastSeen = localStorage.getItem("last_seen_version");

        // Show popup if version is different and lastSeen exists (meaning it's an update, not first-time load)
        if (lastSeen && lastSeen !== currentVer) {
          const item = status.changelogs[currentVer];
          if (item) {
            setVersion(currentVer);
            setChangelog(item);
            setIsOpen(true);
          }
        }

        // Save current version as seen
        localStorage.setItem("last_seen_version", currentVer);
      } catch (err) {
        console.error("Failed to fetch version/changelog for popup:", err);
      }
    };

    // Slight delay to allow layout to settle
    const timer = setTimeout(() => {
      checkChangelogTrigger();
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  if (!changelog) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="max-w-md border border-border bg-card/90 backdrop-blur-md font-mono text-xs">
        <AlertDialogHeader className="space-y-3">
          <div className="flex items-center gap-2 text-primary border-b border-border pb-3">
            <ClipboardList className="h-5 w-5 shrink-0" />
            <AlertDialogTitle className="font-bold text-sm tracking-wider uppercase text-foreground">
              System Successfully Updated!
            </AlertDialogTitle>
          </div>
          <div className="space-y-4 text-foreground/80 leading-relaxed text-[11px] text-left">
            <div className="flex justify-between items-center bg-secondary/20 px-3 py-2 rounded-lg border border-border/40">
              <span className="font-semibold text-muted-foreground uppercase text-[10px]">New Version</span>
              <span className="font-bold bg-primary/20 text-primary px-2.5 py-0.5 rounded-full text-[10px]">
                v{version}
              </span>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-[10px] text-muted-foreground uppercase block">
                What&apos;s New in {changelog.title}:
              </span>
              <ul className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {changelog.changes.map((change, i) => (
                  <li key={i} className="flex items-start gap-2 text-left">
                    <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogAction onClick={() => setIsOpen(false)} className="w-full sm:w-auto h-8 font-semibold text-xs cursor-pointer">
            Awesome
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
