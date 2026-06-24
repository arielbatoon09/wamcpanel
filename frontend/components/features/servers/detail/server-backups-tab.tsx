"use client";

import { useState } from "react";
import { useServerStore } from "@/hooks/useServerStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Database, CheckCircle2, RotateCcw, Trash2 } from "lucide-react";

export function ServerBackupsTab({ id }: { id: string }) {
  const { addLog } = useServerStore();
  const [backups, setBackups] = useState([
    { id: "bk-1", name: "Backup-2026-06-23-BeforeUpdate", size: "482 MB", date: "2026-06-23 18:30" },
    { id: "bk-2", name: "Backup-2026-06-20-Daily", size: "450 MB", date: "2026-06-20 04:00" },
    { id: "bk-3", name: "Backup-2026-06-18-Weekly", size: "1.2 GB", date: "2026-06-18 02:00" },
    { id: "bk-4", name: "Backup-2026-06-15-System", size: "430 MB", date: "2026-06-15 11:15" },
    { id: "bk-5", name: "Backup-2026-06-10-PreMigration", size: "510 MB", date: "2026-06-10 14:05" },
    { id: "bk-6", name: "Backup-2026-06-08-Daily", size: "445 MB", date: "2026-06-08 04:00" },
    { id: "bk-7", name: "Backup-2026-06-05-PluginsUpdate", size: "480 MB", date: "2026-06-05 10:20" },
    { id: "bk-8", name: "Backup-2026-06-01-Monthly", size: "1.1 GB", date: "2026-06-01 02:00" },
    { id: "bk-9", name: "Backup-2026-05-28-Daily", size: "440 MB", date: "2026-05-28 04:00" },
    { id: "bk-10", name: "Backup-2026-05-25-Daily", size: "441 MB", date: "2026-05-25 04:00" },
    { id: "bk-11", name: "Backup-2026-05-22-Daily", size: "438 MB", date: "2026-05-22 04:00" },
    { id: "bk-12", name: "Backup-2026-05-18-Weekly", size: "1.05 GB", date: "2026-05-18 02:00" },
    { id: "bk-13", name: "Backup-2026-05-15-Daily", size: "435 MB", date: "2026-05-15 04:00" },
    { id: "bk-14", name: "Backup-2026-05-10-SecurityFix", size: "460 MB", date: "2026-05-10 16:45" },
  ]);
  const [searchBackup, setSearchBackup] = useState("");
  const [backupPage, setBackupPage] = useState(1);

  const handleCreateBackup = () => {
    const dateStr = new Date().toISOString().replace(/T/, " ").replace(/\..+/, "").substring(0, 16);
    const newBk = {
      id: `bk-${Date.now()}`,
      name: `Backup-${new Date().toISOString().slice(0, 10)}-Manual`,
      size: `${(Math.random() * 50 + 400).toFixed(0)} MB`,
      date: dateStr,
    };
    setBackups([newBk, ...backups]);
    addLog(id, `[SYSTEM] Backup created successfully: ${newBk.name}`);
  };

  const handleDeleteBackup = (bkId: string) => {
    const bk = backups.find((b) => b.id !== bkId);
    setBackups(backups.filter((b) => b.id !== bkId));
    if (bk) addLog(id, `[SYSTEM] Backup deleted: ${bk.name}`);
  };

  const handleRestoreBackup = (bkId: string) => {
    const bk = backups.find((b) => b.id === bkId);
    if (bk) {
      addLog(id, `[SYSTEM] Initiated restore process for: ${bk.name}...`);
      toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
        loading: `Restoring data from ${bk.name}...`,
        success: () => {
          addLog(id, `[SYSTEM] Backup ${bk.name} restored successfully. Server file system updated.`);
          return `Backup restored successfully`;
        },
        error: "Failed to restore backup",
      });
    }
  };

  const PAGE_SIZE = 7;
  const filtered = backups.filter((b) => b.name.toLowerCase().includes(searchBackup.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(backupPage, Math.max(1, totalPages));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  return (
    <Card className="flex min-h-[450px] animate-in flex-col border border-border/80 bg-card/65 p-5 duration-300 fade-in lg:h-full">
      <div className="mb-4 flex shrink-0 items-center justify-between gap-4 border-b border-border pb-3">
        <h3 className="shrink-0 font-mono text-sm font-bold tracking-wider uppercase">Backups</h3>
        <div className="flex max-w-[400px] flex-1 items-center justify-end gap-2">
          <Input
            placeholder="Search backups..."
            value={searchBackup}
            onChange={(e) => {
              setSearchBackup(e.target.value);
              setBackupPage(1);
            }}
            className="h-8 max-w-[180px] text-xs"
          />
          <Button onClick={handleCreateBackup} size="sm" className="h-8 shrink-0 cursor-pointer text-xs font-semibold">
            <Database className="mr-1 h-3.5 w-3.5" />
            Create Backup
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {paginated.length === 0 ? (
          <div className="py-8 text-center font-mono text-xs text-muted-foreground">No backups found matching &quot;{searchBackup}&quot;</div>
        ) : (
          paginated.map((bk) => (
            <div key={bk.id} className="flex animate-in items-center justify-between rounded-xl border border-border bg-secondary/20 p-3 font-mono text-xs duration-150 fade-in">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <div>
                  <span className="font-bold text-foreground/90">{bk.name}</span>
                  <div className="mt-0.5 flex gap-2 text-[10px] text-muted-foreground">
                    <span>Size: {bk.size}</span>
                    <span>Date: {bk.date}</span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleRestoreBackup(bk.id)} className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-emerald-500" title="Restore Backup">
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteBackup(bk.id)} className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-rose-500" title="Delete Backup">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-4 flex shrink-0 items-center justify-between border-t border-border pt-3.5 font-mono text-xs text-muted-foreground select-none">
          <span>
            Showing {startIndex + 1} to {Math.min(startIndex + PAGE_SIZE, filtered.length)} of {filtered.length} backups
          </span>
          <div className="flex gap-1.5">
            <Button variant="outline" size="xs" onClick={() => setBackupPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="h-7 cursor-pointer border-border text-[10px]">
              Previous
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setBackupPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="h-7 cursor-pointer border-border text-[10px]"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
