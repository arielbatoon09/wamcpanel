"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useServerStore } from "@/hooks/useServerStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Database, CheckCircle2, RotateCcw, Trash2, UploadCloud, Download, ShieldAlert } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { backupService, BackupItem } from "@/services/backup-service";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export function ServerBackupsTab({ id }: { id: string }) {
  const { addLog } = useServerStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchBackup, setSearchBackup] = useState("");
  const [backupPage, setBackupPage] = useState(1);

  // Upload States
  const [uploadingName, setUploadingName] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);

  // Modal / Dialog States
  const [createDialog, setCreateDialog] = useState({
    isOpen: false,
    name: "",
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    backup: BackupItem | null;
  }>({ isOpen: false, backup: null });

  const [restoreDialog, setRestoreDialog] = useState<{
    isOpen: boolean;
    backup: BackupItem | null;
  }>({ isOpen: false, backup: null });

  const [duplicateUpload, setDuplicateUpload] = useState<{
    isOpen: boolean;
    file: File | null;
  }>({ isOpen: false, file: null });

  const fetchBackups = useCallback(
    async (showLoading = false) => {
      if (showLoading) setLoading(true);
      try {
        const data = await backupService.list(id);
        setBackups(data);
      } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        toast.error(axiosError.response?.data?.message || "Failed to load backups list");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBackups(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchBackups]);

  const checkBackupExists = (fileName: string) => {
    return backups.some((b) => b.name.toLowerCase() === fileName.toLowerCase());
  };

  const performUpload = async (file: File, uploadName: string) => {
    setUploadingName(uploadName);
    setUploadProgress(0);

    try {
      await backupService.upload(id, file, uploadName, (pct) => {
        setUploadProgress(pct);
      });
      toast.success(`Backup "${uploadName}" uploaded successfully.`);
      addLog(id, `[SYSTEM] Uploaded backup file: ${uploadName}`);
      fetchBackups(false);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || `Upload failed for ${uploadName}`);
    } finally {
      setUploadingName(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleResolveOverwrite = async () => {
    const file = duplicateUpload.file;
    if (!file) return;
    setDuplicateUpload({ isOpen: false, file: null });
    await performUpload(file, file.name);
  };

  const handleResolveRename = async () => {
    const file = duplicateUpload.file;
    if (!file) return;

    let uploadName = file.name;
    const lastDot = uploadName.lastIndexOf(".");
    let base = uploadName;
    let ext = "";
    if (lastDot !== -1) {
      base = uploadName.substring(0, lastDot);
      ext = uploadName.substring(lastDot);
    }

    let counter = 1;
    while (checkBackupExists(`${base} (${counter})${ext}`)) {
      counter++;
    }
    uploadName = `${base} (${counter})${ext}`;

    setDuplicateUpload({ isOpen: false, file: null });
    await performUpload(file, uploadName);
  };

  const handleResolveCancel = () => {
    const file = duplicateUpload.file;
    if (file) {
      toast.warning(`Skipped "${file.name}"`);
    }
    setDuplicateUpload({ isOpen: false, file: null });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith(".zip")) {
        toast.error("Only backup .zip archives are allowed");
        return;
      }

      if (checkBackupExists(file.name)) {
        setDuplicateUpload({ isOpen: true, file });
      } else {
        await performUpload(file, file.name);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (!file.name.toLowerCase().endsWith(".zip")) {
        toast.error("Only backup .zip archives are allowed");
        return;
      }

      if (checkBackupExists(file.name)) {
        setDuplicateUpload({ isOpen: true, file });
      } else {
        await performUpload(file, file.name);
      }
    }
  };

  const handleCreateConfirm = async () => {
    const name = createDialog.name.trim();
    setCreateDialog({ isOpen: false, name: "" });

    toast.info("Initiating server backup...");
    try {
      await backupService.create(id, name);
      toast.success("Backup created successfully");
      addLog(id, `[SYSTEM] Manual backup created: ${name || "Auto"}`);
      fetchBackups(false);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || "Failed to create backup");
    }
  };

  const handleDeleteConfirm = async () => {
    const bk = deleteDialog.backup;
    if (!bk) return;

    setDeleteDialog({ isOpen: false, backup: null });
    try {
      toast.info(`Deleting backup "${bk.name}"...`);
      await backupService.delete(id, bk.name);
      addLog(id, `[SYSTEM] Deleted backup file: ${bk.name}`);
      toast.success("Backup deleted successfully");
      fetchBackups(false);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || "Failed to delete backup");
    }
  };

  const handleRestoreConfirm = async () => {
    const bk = restoreDialog.backup;
    if (!bk) return;

    setRestoreDialog({ isOpen: false, backup: null });
    addLog(id, `[SYSTEM] Initiating restoration of backup: ${bk.name}. Stopping server...`);

    toast.promise(backupService.restore(id, bk.name), {
      loading: `Restoring data from ${bk.name}... This stops and wipes active files.`,
      success: () => {
        addLog(id, `[SYSTEM] Backup &quot;${bk.name}&quot; restored successfully. Server file system updated.`);
        fetchBackups(false);
        return `Backup restored successfully.`;
      },
      error: (err: unknown) => {
        const axiosError = err as { message?: string; response?: { data?: { message?: string } } };
        addLog(id, `[SYSTEM] Backup restoration failed: ${axiosError.message || "Unknown error"}`);
        return axiosError.response?.data?.message || "Failed to restore backup";
      },
    });
  };

  const handleDownloadBackup = async (bk: BackupItem) => {
    try {
      toast.info(`Downloading backup archive "${bk.name}"...`);
      const blob = await backupService.download(id, bk.name);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = bk.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (err: unknown) {
      toast.error("Download failed");
      console.error(err);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const PAGE_SIZE = 6;
  const filtered = backups.filter((b) => b.name.toLowerCase().includes(searchBackup.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(backupPage, Math.max(1, totalPages));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  return (
    <Card
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex min-h-[450px] animate-in flex-col border bg-card/65 p-5 transition-all duration-200 select-none lg:h-full ${
        isDragging ? "scale-[0.99] border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border/80"
      }`}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary bg-background/80 backdrop-blur-xs">
          <UploadCloud className="h-12 w-12 animate-bounce text-primary" />
          <span className="font-mono text-sm font-bold text-foreground">Drop backup .zip here to upload</span>
        </div>
      )}

      <div className="mb-4 flex shrink-0 items-center justify-between gap-4 border-b border-border pb-3">
        <h3 className="shrink-0 font-mono text-sm font-bold tracking-wider uppercase">Backups</h3>
        <div className="flex max-w-[500px] flex-1 items-center justify-end gap-2">
          <Input
            placeholder="Search backups..."
            value={searchBackup}
            onChange={(e) => {
              setSearchBackup(e.target.value);
              setBackupPage(1);
            }}
            className="h-8 max-w-[180px] font-mono text-xs"
          />
          <Button variant="outline" size="sm" onClick={handleUploadClick} disabled={!!uploadingName} className="h-8 shrink-0 cursor-pointer gap-1 text-xs font-semibold">
            {uploadingName ? (
              <>
                <Spinner className="h-3 w-3" />
                Uploading...
              </>
            ) : (
              <>
                <UploadCloud className="h-3.5 w-3.5" />
                Upload
              </>
            )}
          </Button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".zip" className="hidden" disabled={!!uploadingName} />
          <Button onClick={() => setCreateDialog({ isOpen: true, name: "" })} disabled={!!uploadingName} size="sm" className="h-8 shrink-0 cursor-pointer gap-1 text-xs font-semibold">
            <Database className="h-3.5 w-3.5" />
            Create Backup
          </Button>
        </div>
      </div>

      {/* Uploading Status Overlay */}
      {uploadingName && (
        <div className="mb-4 space-y-1.5 rounded-lg border border-border bg-muted/20 p-3.5 font-mono text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="truncate font-bold text-foreground/80">Uploading {uploadingName}</span>
            <span className="shrink-0 font-bold text-primary">{uploadProgress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/50">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        </div>
      )}

      {/* Restore Warning banner */}
      {!loading && backups.length > 0 && (
        <div className="mb-3.5 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 font-mono text-[11px] text-amber-500">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>Note: Restoring a backup clears existing files and restarts the server container. Make sure server is empty before proceeding.</span>
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2">
            <Spinner className="h-6 w-6 text-primary" />
            <span className="font-mono text-xs text-muted-foreground">Reading backups list…</span>
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-12 text-center font-mono text-xs text-muted-foreground">
            {searchBackup ? `No backups found matching "${searchBackup}"` : "No backups found. Create or upload a backup to get started!"}
          </div>
        ) : (
          paginated.map((bk) => (
            <div
              key={bk.id}
              className="flex animate-in items-center justify-between rounded-xl border border-border bg-secondary/20 p-3.5 font-mono text-xs duration-150 fade-in hover:bg-secondary/35"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <div className="min-w-0">
                  <span className="block truncate font-bold text-foreground/90" title={bk.name}>
                    {bk.name}
                  </span>
                  <div className="mt-0.5 flex gap-3 text-[10px] text-muted-foreground">
                    <span>Size: {bk.size}</span>
                    <span>Date: {bk.date}</span>
                  </div>
                </div>
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-1.5">
                <Button variant="ghost" size="icon" onClick={() => handleDownloadBackup(bk)} className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-primary" title="Download Backup">
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRestoreDialog({ isOpen: true, backup: bk })}
                  className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-emerald-500"
                  title="Restore Backup"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteDialog({ isOpen: true, backup: bk })}
                  className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-rose-500"
                  title="Delete Backup"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && (
        <div className="mt-4 flex shrink-0 items-center justify-between border-t border-border pt-3.5 font-mono text-xs text-muted-foreground select-none">
          <span>
            Showing {filtered.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + PAGE_SIZE, filtered.length)} of {filtered.length} backups
          </span>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setBackupPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1 || totalPages <= 1}
              className="h-7 cursor-pointer border-border text-[10px]"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setBackupPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages <= 1}
              className="h-7 cursor-pointer border-border text-[10px]"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Backup Prompt Dialog */}
      <AlertDialog open={createDialog.isOpen} onOpenChange={(open) => !open && setCreateDialog({ isOpen: false, name: "" })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Server Backup</AlertDialogTitle>
            <AlertDialogDescription>Enter a name for the new backup archive (leave blank for automatic name):</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              value={createDialog.name}
              onChange={(e) => setCreateDialog((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Pre-Plugin-Update"
              className="font-mono text-xs"
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateConfirm}>Create</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialog.isOpen} onOpenChange={(open) => !open && setRestoreDialog({ isOpen: false, backup: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Server Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore <span className="font-mono font-bold text-foreground">&quot;{restoreDialog.backup?.name}&quot;</span>?
              <br />
              <span className="font-semibold text-rose-500">
                Warning: This will shut down the server container, wipe the current file system (excluding backups), and restore the saved files. This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreConfirm} className="bg-emerald-600 text-white hover:bg-emerald-700">
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && setDeleteDialog({ isOpen: false, backup: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Backup Archive</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <span className="font-mono font-bold text-foreground">&quot;{deleteDialog.backup?.name}&quot;</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} variant="destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Upload Resolution Dialog */}
      <AlertDialog open={duplicateUpload.isOpen} onOpenChange={(open) => !open && handleResolveCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Backup Already Exists</AlertDialogTitle>
            <AlertDialogDescription>
              The backup archive <span className="font-mono font-bold text-foreground">&quot;{duplicateUpload.file?.name}&quot;</span> already exists. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col justify-end gap-2 rounded-b-xl sm:-mx-4 sm:-mb-4 sm:flex-row sm:border-t sm:bg-muted/50 sm:p-4">
            <Button variant="ghost" onClick={handleResolveCancel} className="cursor-pointer text-xs font-semibold">
              Skip File
            </Button>
            <Button variant="outline" onClick={handleResolveRename} className="cursor-pointer text-xs font-semibold">
              Auto Rename
            </Button>
            <Button onClick={handleResolveOverwrite} variant="destructive" className="cursor-pointer text-xs font-semibold text-white">
              Overwrite
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
