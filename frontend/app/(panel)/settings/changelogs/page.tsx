"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { systemService, ChangelogItem } from "@/services/system-service";
import { ClipboardList, Calendar, Check, GitBranch } from "lucide-react";

export default function ChangelogsPage() {
  const [changelogs, setChangelogs] = useState<Record<string, ChangelogItem>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChangelogs = async () => {
      try {
        const data = await systemService.checkUpdate();
        setChangelogs(data.changelogs || {});
      } catch (err) {
        console.error("Failed to load changelogs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchChangelogs();
  }, []);

  const sortedVersions = Object.keys(changelogs).sort((a, b) => {
    const partsA = a.split(".").map(Number);
    const partsB = b.split(".").map(Number);
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const pA = partsA[i] || 0;
      const pB = partsB[i] || 0;
      if (pA !== pB) return pB - pA; // Descending (latest first)
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">System Changelogs</h1>
        <p className="mt-1 text-xs text-muted-foreground">Keep track of updates, security patches, and feature additions for WAMCPanel.</p>
      </div>

      {loading ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2">
          <Spinner className="h-8 w-8 text-primary" />
          <span className="font-mono text-xs text-muted-foreground">Loading update history…</span>
        </div>
      ) : sortedVersions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 text-center border-border bg-card/65 font-mono text-xs text-muted-foreground">
          <ClipboardList className="h-10 w-10 text-muted-foreground/45 mb-2" />
          <span>No changelogs recorded yet.</span>
        </Card>
      ) : (
        <div className="relative border-l border-border/80 ml-4 pl-6 space-y-8 font-mono text-xs">
          {sortedVersions.map((version) => {
            const item = changelogs[version];
            return (
              <div key={version} className="relative">
                {/* Timeline node icon */}
                <span className="absolute -left-[35px] mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-primary/45 bg-background text-primary">
                  <GitBranch className="h-2 w-2" />
                </span>

                <Card className="border border-border bg-card/65 p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold bg-primary/20 text-primary px-2.5 py-0.5 rounded-full text-[10px]">
                          v{version}
                        </span>
                        <h3 className="font-bold text-foreground text-sm">{item.title}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-semibold">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{item.date}</span>
                    </div>
                  </div>

                  <ul className="space-y-2.5">
                    {item.changes.map((change, i) => (
                      <li key={i} className="flex items-start gap-2 text-foreground/80 leading-relaxed text-[11px]">
                        <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                          <Check className="h-2.5 w-2.5" />
                        </span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
