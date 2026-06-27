"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useServerStore } from "@/hooks/useServerStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Trash2, UploadCloud, ShieldAlert } from "lucide-react";
import { pluginService, PluginItem } from "@/services/plugin-service";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export function ServerPluginsTab({ id }: { id: string }) {
  const { addLog } = useServerStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [plugins, setPlugins] = useState<PluginItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchPlugin, setSearchPlugin] = useState("");
  const [pluginPage, setPluginPage] = useState(1);

  // Upload States
  const [uploadingName, setUploadingName] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Dialog States
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    plugin: PluginItem | null;
  }>({ isOpen: false, plugin: null });

  const [duplicateUpload, setDuplicateUpload] = useState<{
    isOpen: boolean;
    file: File | null;
  }>({ isOpen: false, file: null });

  const [isDragging, setIsDragging] = useState(false);

  const getPluginFilename = (pluginPath: string) => {
    return pluginPath.split(/[/\\]/).pop() || "";
  };

  const checkPluginExists = (fileName: string) => {
    return plugins.some((p) => getPluginFilename(p.pluginPath).toLowerCase() === fileName.toLowerCase());
  };

  const fetchPlugins = useCallback(
    async (showLoading = false) => {
      if (showLoading) setLoading(true);
      try {
        const data = await pluginService.list(id);
        setPlugins(data);
      } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        toast.error(axiosError.response?.data?.message || "Failed to load plugins");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlugins(true);
  }, [id, fetchPlugins]);

  const handleTogglePlugin = async (plugin: PluginItem) => {
    const nextStatus = !plugin.enabled;
    try {
      toast.info(`${nextStatus ? "Enabling" : "Disabling"} plugin "${plugin.name}"...`);
      await pluginService.toggle(id, plugin.pluginPath, nextStatus);
      addLog(id, `[SYSTEM] Plugin "${plugin.name}" has been ${nextStatus ? "enabled" : "disabled"}. Restart the server to apply changes.`);
      toast.success(`Plugin ${plugin.name} ${nextStatus ? "enabled" : "disabled"}. Restart required.`);
      fetchPlugins(false);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || `Failed to toggle plugin`);
    }
  };

  const handleDeleteConfirm = async () => {
    const plugin = deleteDialog.plugin;
    if (!plugin) return;

    setDeleteDialog({ isOpen: false, plugin: null });
    try {
      toast.info(`Deleting plugin "${plugin.name}"...`);
      await pluginService.delete(id, plugin.pluginPath);
      addLog(id, `[SYSTEM] Plugin "${plugin.name}" has been uninstalled. Restart required.`);
      toast.success(`Plugin "${plugin.name}" deleted. Restart required.`);
      fetchPlugins(false);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || `Failed to delete plugin`);
    }
  };

  const performUpload = async (file: File, uploadName: string) => {
    setUploadingName(uploadName);
    setUploadProgress(0);

    try {
      await pluginService.upload(id, file, uploadName, (pct) => {
        setUploadProgress(pct);
      });
      toast.success(`Plugin "${uploadName}" uploaded successfully. Restart required.`);
      addLog(id, `[SYSTEM] Uploaded plugin: ${uploadName}. Restart the server to activate.`);
      fetchPlugins(false);
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
    while (checkPluginExists(`${base} (${counter})${ext}`)) {
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
      if (!file.name.toLowerCase().endsWith(".jar")) {
        toast.error("Only plugin .jar files are allowed");
        return;
      }

      if (checkPluginExists(file.name)) {
        setDuplicateUpload({ isOpen: true, file });
      } else {
        await performUpload(file, file.name);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith(".jar")) {
        toast.error("Only plugin .jar files are allowed");
        return;
      }

      if (checkPluginExists(file.name)) {
        setDuplicateUpload({ isOpen: true, file });
      } else {
        await performUpload(file, file.name);
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const PAGE_SIZE = 6;
  const filtered = plugins.filter((p) => p.name.toLowerCase().includes(searchPlugin.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(pluginPage, Math.max(1, totalPages));
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
          <span className="font-mono text-sm font-bold text-foreground">Drop plugin .jar here to upload</span>
        </div>
      )}

      <div className="mb-4 flex shrink-0 items-center justify-between border-b border-border pb-3">
        <h3 className="font-mono text-sm font-bold tracking-wider uppercase">Plugins</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleUploadClick} disabled={!!uploadingName} className="h-8 cursor-pointer gap-1 text-xs font-semibold">
            {uploadingName ? (
              <>
                <Spinner className="h-3 w-3" />
                Uploading...
              </>
            ) : (
              <>
                <UploadCloud className="h-3.5 w-3.5" />
                Upload Plugin
              </>
            )}
          </Button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".jar" className="hidden" disabled={!!uploadingName} />
          <Input
            placeholder="Search plugins..."
            value={searchPlugin}
            onChange={(e) => {
              setSearchPlugin(e.target.value);
              setPluginPage(1);
            }}
            className="h-8 max-w-[200px] font-mono text-xs"
          />
        </div>
      </div>

      {/* Uploading Status Overlay */}
      {uploadingName && (
        <div className="mb-4 space-y-1.5 rounded-lg border border-border bg-muted/20 p-3.5 font-mono text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="truncate font-bold text-foreground/80">Uploading {uploadingName}</span>
            <span className="shrink-0 font-bold text-primary">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-1.5 bg-secondary/50" />
        </div>
      )}

      {/* Restart Warning banner */}
      {plugins.length > 0 && (
        <div className="mb-3.5 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 font-mono text-[11px] text-amber-500">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>Note: Changing plugins status (enabling, disabling, uploading, or deleting) requires a server restart to take effect.</span>
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2">
            <Spinner className="h-6 w-6 text-primary" />
            <span className="font-mono text-xs text-muted-foreground">Reading plugins list…</span>
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-8 text-center font-mono text-xs text-muted-foreground">
            {searchPlugin ? `No plugins found matching "${searchPlugin}"` : "No plugins installed. Upload a .jar file to get started!"}
          </div>
        ) : (
          paginated.map((plugin) => (
            <div key={plugin.pluginPath} className="flex animate-in items-center justify-between gap-4 rounded-xl border border-border bg-secondary/20 p-3.5 duration-150 fade-in">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-foreground">{plugin.name}</h4>
                  <span className="rounded bg-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">v{plugin.version}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{plugin.desc}</p>
              </div>

              <div className="flex shrink-0 items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-[10px] font-bold uppercase transition-colors ${plugin.enabled ? "text-emerald-500" : "text-muted-foreground"}`}>
                    {plugin.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <Switch checked={plugin.enabled} onCheckedChange={() => handleTogglePlugin(plugin)} size="sm" className="cursor-pointer" />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteDialog({ isOpen: true, plugin })}
                  className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-rose-500"
                  title="Delete Plugin"
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
            Showing {filtered.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + PAGE_SIZE, filtered.length)} of {filtered.length} plugins
          </span>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setPluginPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1 || totalPages <= 1}
              className="h-7 cursor-pointer border-border text-[10px]"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setPluginPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages <= 1}
              className="h-7 cursor-pointer border-border text-[10px]"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && setDeleteDialog({ isOpen: false, plugin: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Uninstall Plugin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <span className="font-mono font-bold text-foreground">&quot;{deleteDialog.plugin?.name}&quot;</span>? This will remove the jar file from your
              server.
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
            <AlertDialogTitle>Plugin Already Exists</AlertDialogTitle>
            <AlertDialogDescription>
              The plugin <span className="font-mono font-bold text-foreground">&quot;{duplicateUpload.file?.name}&quot;</span> already exists. What would you like to do?
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
