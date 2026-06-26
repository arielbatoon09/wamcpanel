"use client";

import { useState, useEffect, useRef } from "react";
import { useServerStore } from "@/hooks/useServerStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { fileService, FileItem } from "@/services/file-service";
import { FileEditor } from "@/components/features/servers/detail/file-editor";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Folder,
  File,
  FileArchive,
  Trash2,
  FolderPlus,
  FilePlus,
  ChevronRight,
  Home,
  UploadCloud,
  ArrowUp,
  Archive,
  Menu,
} from "lucide-react";

export function ServerFilesTab({ id }: { id: string }) {
  const { addLog } = useServerStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Navigation & States
  const [currentPath, setCurrentPath] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog/Inputs States
  const [newItemName, setNewItemName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState<"file" | "folder" | null>(null);

  // Selection State
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  // Drag and Drop Upload States
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [filename: string]: number }>({});

  // Editor Modal States
  const [editingFilePath, setEditingFilePath] = useState<string | null>(null);

  // Custom Alert Dialog states
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    file: FileItem | null;
    isBulk: boolean;
  }>({ isOpen: false, file: null, isBulk: false });

  const [extractConfirm, setExtractConfirm] = useState<{
    isOpen: boolean;
    file: FileItem | null;
    isBulk: boolean;
  }>({ isOpen: false, file: null, isBulk: false });

  const [zipDialog, setZipDialog] = useState<{
    isOpen: boolean;
    file: FileItem | null;
    isBulk: boolean;
    archiveName: string;
  }>({ isOpen: false, file: null, isBulk: false, archiveName: "" });

  const [duplicateUpload, setDuplicateUpload] = useState<{
    isOpen: boolean;
    currentFile: File | null;
    remainingFiles: any[];
  }>({ isOpen: false, currentFile: null, remainingFiles: [] });

  const [renameDialog, setRenameDialog] = useState<{
    isOpen: boolean;
    file: FileItem | null;
    newName: string;
  }>({ isOpen: false, file: null, newName: "" });

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const data = await fileService.list(id, currentPath);
      // Sort: folders first, then files alphabetically
      const sorted = [...data].sort((a, b) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return a.name.localeCompare(b.name);
      });
      setFiles(sorted);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load directory files");
    } finally {
      setLoading(false);
    }
  };

  // Fetch files on mount or path change
  useEffect(() => {
    fetchFiles();
  }, [id, currentPath]);

  // Clear selection on path change
  useEffect(() => {
    setSelectedFiles(new Set());
  }, [currentPath]);

  if (editingFilePath) {
    return (
      <FileEditor
        serverId={id}
        filePath={editingFilePath}
        onClose={() => {
          setEditingFilePath(null);
          fetchFiles();
        }}
      />
    );
  }

  // Selection Actions
  const toggleSelectFile = (name: string) => {
    const next = new Set(selectedFiles);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    setSelectedFiles(next);
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === files.length && files.length > 0) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map((f) => f.name)));
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !showCreateForm) return;

    const name = newItemName.trim();
    const isDir = showCreateForm === "folder";

    try {
      await fileService.create(id, currentPath, name, isDir);
      toast.success(`${isDir ? "Folder" : "File"} created successfully`);
      addLog(id, `[SYSTEM] Created ${isDir ? "folder" : "file"}: ${currentPath ? currentPath + "/" : ""}${name}`);
      setNewItemName("");
      setShowCreateForm(null);
      fetchFiles();

      // If we created a file, open it in the editor immediately
      if (!isDir) {
        setEditingFilePath(currentPath ? `${currentPath}/${name}` : name);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to create ${showCreateForm}`);
    }
  };

  const executeDelete = async () => {
    const { file, isBulk } = deleteConfirm;
    setDeleteConfirm({ isOpen: false, file: null, isBulk: false });

    if (isBulk) {
      if (selectedFiles.size === 0) return;
      const paths = Array.from(selectedFiles).map((name) =>
        currentPath ? `${currentPath}/${name}` : name
      );

      try {
        toast.info("Deleting selected items...");
        await fileService.deleteBulk(id, paths);
        toast.success(`Successfully deleted ${selectedFiles.size} items`);
        addLog(id, `[SYSTEM] Bulk deleted ${selectedFiles.size} items`);
        setSelectedFiles(new Set());
        fetchFiles();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Bulk delete failed");
      }
    } else {
      if (!file) return;
      const itemPath = currentPath ? `${currentPath}/${file.name}` : file.name;
      try {
        await fileService.delete(id, itemPath);
        toast.success(`Deleted ${file.name}`);
        addLog(id, `[SYSTEM] Deleted: ${itemPath}`);
        fetchFiles();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to delete item");
      }
    }
  };

  const executeZip = async () => {
    const { file, isBulk, archiveName } = zipDialog;
    if (!archiveName || !archiveName.trim()) return;

    const validName = archiveName.toLowerCase().endsWith(".zip") ? archiveName.trim() : `${archiveName.trim()}.zip`;
    setZipDialog({ isOpen: false, file: null, isBulk: false, archiveName: "" });

    if (isBulk) {
      if (selectedFiles.size === 0) return;
      try {
        toast.info(`Zipping ${selectedFiles.size} item(s)...`);
        await fileService.compress(id, currentPath, Array.from(selectedFiles), validName);
        toast.success(`Zipped selected items to ${validName}`);
        addLog(id, `[SYSTEM] Bulk zipped: ${selectedFiles.size} items to ${validName}`);
        setSelectedFiles(new Set());
        fetchFiles();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to zip items");
      }
    } else {
      if (!file) return;
      try {
        toast.info(`Zipping "${file.name}"...`);
        await fileService.compress(id, currentPath, [file.name], validName);
        toast.success(`Zipped ${file.name} to ${validName}`);
        addLog(id, `[SYSTEM] Zipped: ${file.name} -> ${validName}`);
        fetchFiles();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to zip item");
      }
    }
  };

  const executeExtract = async () => {
    const { file, isBulk } = extractConfirm;
    setExtractConfirm({ isOpen: false, file: null, isBulk: false });

    if (isBulk) {
      if (selectedFiles.size === 0) return;
      try {
        toast.info(`Extracting ${selectedFiles.size} archive(s)...`);
        for (const name of Array.from(selectedFiles)) {
          if (isZip(name)) {
            const filePath = currentPath ? `${currentPath}/${name}` : name;
            await fileService.extract(id, filePath, currentPath);
          }
        }
        toast.success("Archives extracted successfully");
        addLog(id, `[SYSTEM] Bulk extracted ${selectedFiles.size} archives`);
        setSelectedFiles(new Set());
        fetchFiles();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Bulk extraction failed");
      }
    } else {
      if (!file) return;
      const filePath = currentPath ? `${currentPath}/${file.name}` : file.name;
      toast.info(`Extracting archive ${file.name}...`);
      try {
        await fileService.extract(id, filePath, currentPath);
        toast.success(`Archive "${file.name}" extracted successfully`);
        addLog(id, `[SYSTEM] Extracted archive: ${filePath}`);
        fetchFiles();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Extraction failed");
      }
    }
  };

  // Trigger Helpers for custom Dialogs
  const handleTriggerDelete = (file: FileItem | null, isBulk = false) => {
    setDeleteConfirm({ isOpen: true, file, isBulk });
  };

  const handleTriggerExtract = (file: FileItem | null, isBulk = false) => {
    setExtractConfirm({ isOpen: true, file, isBulk });
  };

  const handleTriggerZip = (file: FileItem | null, isBulk = false) => {
    const defaultName = isBulk ? "archive.zip" : `${file?.name.split(".")[0] || "archive"}.zip`;
    setZipDialog({ isOpen: true, file, isBulk, archiveName: defaultName });
  };

  const handleTriggerRename = (file: FileItem) => {
    setRenameDialog({ isOpen: true, file, newName: file.name });
  };

  const executeRename = async () => {
    const { file, newName } = renameDialog;
    if (!file || !newName.trim() || newName.trim() === file.name) {
      setRenameDialog({ isOpen: false, file: null, newName: "" });
      return;
    }

    const itemPath = currentPath ? `${currentPath}/${file.name}` : file.name;
    setRenameDialog({ isOpen: false, file: null, newName: "" });

    try {
      toast.info(`Renaming "${file.name}" to "${newName.trim()}"...`);
      await fileService.rename(id, itemPath, newName.trim());
      toast.success("Item renamed successfully");
      addLog(id, `[SYSTEM] Renamed: ${itemPath} -> ${newName.trim()}`);
      fetchFiles();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to rename item");
    }
  };

  // Directory Navigation Helpers
  const handleFolderClick = (folderName: string) => {
    setCurrentPath(currentPath ? `${currentPath}/${folderName}` : folderName);
  };

  const handleBreadcrumbClick = (index: number) => {
    const parts = currentPath.split("/").filter(Boolean);
    const targetParts = parts.slice(0, index + 1);
    setCurrentPath(targetParts.join("/"));
  };

  const handleGoBack = () => {
    const parts = currentPath.split("/").filter(Boolean);
    if (parts.length <= 1) {
      setCurrentPath("");
    } else {
      parts.pop();
      setCurrentPath(parts.join("/"));
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Queue-based Uploader
  const processNextInQueue = async (queue: { file: File; uploadName: string }[]) => {
    if (queue.length === 0) {
      fetchFiles();
      return;
    }

    const currentItem = queue[0];
    const rest = queue.slice(1);

    const exists = files.some((f) => f.name === currentItem.uploadName);
    if (exists) {
      setDuplicateUpload({
        isOpen: true,
        currentFile: currentItem.file,
        remainingFiles: queue
      });
    } else {
      await performUpload(currentItem.file, currentItem.uploadName);
      processNextInQueue(rest);
    }
  };

  const performUpload = async (file: File, uploadName: string) => {
    setUploadProgress((prev) => ({ ...prev, [uploadName]: 0 }));

    try {
      await fileService.upload(id, currentPath, file, uploadName, (progress) => {
        setUploadProgress((prev) => ({ ...prev, [uploadName]: progress }));
      });
      toast.success(`Uploaded ${uploadName} successfully`);
      addLog(id, `[SYSTEM] Uploaded file: ${currentPath ? currentPath + "/" : ""}${uploadName}`);
    } catch (err: any) {
      toast.error(`Failed to upload ${uploadName}: ${err.response?.data?.message || err.message}`);
    } finally {
      setTimeout(() => {
        setUploadProgress((prev) => {
          const next = { ...prev };
          delete next[uploadName];
          return next;
        });
      }, 1500);
    }
  };

  const handleResolveOverwrite = async () => {
    const currentFile = duplicateUpload.currentFile;
    const rest = duplicateUpload.remainingFiles.slice(1);
    if (!currentFile) return;

    setDuplicateUpload({ isOpen: false, currentFile: null, remainingFiles: [] });
    await performUpload(currentFile, currentFile.name);
    processNextInQueue(rest);
  };

  const handleResolveRename = async () => {
    const currentFile = duplicateUpload.currentFile;
    const rest = duplicateUpload.remainingFiles.slice(1);
    if (!currentFile) return;

    let uploadName = currentFile.name;
    const lastDot = uploadName.lastIndexOf(".");
    let base = uploadName;
    let ext = "";
    if (lastDot !== -1) {
      base = uploadName.substring(0, lastDot);
      ext = uploadName.substring(lastDot);
    }

    let counter = 1;
    while (files.some((f) => f.name === `${base} (${counter})${ext}`)) {
      counter++;
    }
    uploadName = `${base} (${counter})${ext}`;

    setDuplicateUpload({ isOpen: false, currentFile: null, remainingFiles: [] });
    await performUpload(currentFile, uploadName);
    processNextInQueue(rest);
  };

  const handleResolveCancel = () => {
    const currentFile = duplicateUpload.currentFile;
    const rest = duplicateUpload.remainingFiles.slice(1);
    if (currentFile) {
      toast.warning(`Skipped "${currentFile.name}"`);
    }
    setDuplicateUpload({ isOpen: false, currentFile: null, remainingFiles: [] });
    processNextInQueue(rest);
  };

  const uploadFileList = (filesList: FileList) => {
    if (!filesList.length) return;
    const queue = Array.from(filesList).map((file) => ({
      file,
      uploadName: file.name
    }));
    processNextInQueue(queue);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files) {
      uploadFileList(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadFileList(e.target.files);
      e.target.value = "";
    }
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const formatSize = (bytes: number | null): string => {
    if (bytes === null) return "-";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const isZip = (filename: string): boolean => {
    return filename.toLowerCase().endsWith(".zip");
  };

  return (
    <Card
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex min-h-[500px] animate-in flex-col border bg-card/65 p-5 transition-all duration-200 lg:h-full select-none ${isDragging ? "border-primary bg-primary/5 ring-2 ring-primary/20 scale-[0.99]" : "border-border/80"
        }`}
    >
      {/* File Drag Overlay */}
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 rounded-xl bg-background/80 backdrop-blur-xs border border-dashed border-primary">
          <UploadCloud className="h-12 w-12 text-primary animate-bounce" />
          <span className="font-mono text-sm font-bold text-foreground">Drop files here to upload</span>
          <span className="font-mono text-xs text-muted-foreground">Uploading directly to: /{currentPath || "root"}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="mb-4 flex shrink-0 flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h3 className="font-mono text-sm font-bold tracking-wider uppercase text-foreground">File Manager</h3>
          <div className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground overflow-x-auto whitespace-nowrap py-1">
            <button
              onClick={() => setCurrentPath("")}
              className="flex items-center gap-1 hover:text-foreground cursor-pointer"
            >
              <Home className="h-3 w-3" />
              root
            </button>
            {currentPath.split("/").filter(Boolean).map((part, index) => (
              <span key={index} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3 shrink-0" />
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className="hover:text-foreground cursor-pointer"
                >
                  {part}
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {currentPath && (
            <Button variant="outline" size="sm" onClick={handleGoBack} className="h-8 text-xs font-semibold cursor-pointer gap-1">
              <ArrowUp className="h-3.5 w-3.5" />
              Up
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleUploadButtonClick}
            className="h-8 text-xs font-semibold cursor-pointer gap-1"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            Upload
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowCreateForm("file");
              setNewItemName("");
            }}
            className="h-8 text-xs font-semibold cursor-pointer gap-1"
          >
            <FilePlus className="h-3.5 w-3.5" />
            New File
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowCreateForm("folder");
              setNewItemName("");
            }}
            className="h-8 text-xs font-semibold cursor-pointer gap-1"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            New Folder
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
          />
        </div>
      </div>

      {/* Inline Create Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateItem} className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-black/20 p-3 animate-in slide-in-from-top duration-200">
          <Input
            placeholder={showCreateForm === "folder" ? "folder-name" : "filename.txt"}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="h-8 max-w-[240px] text-xs font-mono"
            autoFocus
          />
          <Button type="submit" size="sm" className="h-8 text-xs font-semibold cursor-pointer">
            Create
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowCreateForm(null)}
            className="h-8 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </Button>
        </form>
      )}

      {/* Uploading Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="mb-4 space-y-3 rounded-lg border border-border bg-muted/20 p-3.5 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
            <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Uploading Files</span>
            <span className="text-[10px] text-muted-foreground">{Object.keys(uploadProgress).length} in queue</span>
          </div>
          <div className="space-y-3">
            {Object.entries(uploadProgress).map(([filename, progress]) => (
              <div key={filename} className="space-y-1.5">
                <div className="flex items-center justify-between gap-4">
                  <span className="truncate text-foreground/80 text-[11px]">{filename}</span>
                  <span className="font-bold text-primary shrink-0 text-[11px]">{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5 bg-secondary/50" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Actions Floating Bar */}
      {selectedFiles.size > 0 && (() => {
        const allSelectedAreZips = Array.from(selectedFiles).every(name => isZip(name));
        return (
          <div className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 font-mono text-xs text-primary animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedFiles.size === files.length}
                onCheckedChange={toggleSelectAll}
                className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
              <span>Selected {selectedFiles.size} file(s)</span>
            </div>
            <div className="flex gap-2">
              {allSelectedAreZips ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTriggerExtract(null, true)}
                  className="h-7 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 gap-1 cursor-pointer font-bold"
                >
                  <Archive className="h-3.5 w-3.5" />
                  Extract Bulk
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTriggerZip(null, true)}
                  className="h-7 border-primary/20 text-primary hover:bg-primary/10 gap-1 cursor-pointer"
                >
                  <Archive className="h-3.5 w-3.5" />
                  Compress (Zip)
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleTriggerDelete(null, true)}
                className="h-7 bg-rose-600 hover:bg-rose-500 gap-1 cursor-pointer text-white"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Bulk
              </Button>
            </div>
          </div>
        );
      })()}

      {/* Files List Table */}
      <div className="min-h-0 flex-1 overflow-auto pr-1">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <Spinner className="h-8 w-8 text-primary" />
            <span className="font-mono text-xs text-muted-foreground">Reading filesystem…</span>
          </div>
        ) : files.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 border border-dashed border-border/50 rounded-lg text-muted-foreground/50">
            <UploadCloud className="h-8 w-8" />
            <span className="font-mono text-xs">Directory is empty. Drag & drop files here to upload.</span>
          </div>
        ) : (
          <table className="w-full font-mono text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground select-none">
                <th className="py-2 w-8">
                  <Checkbox
                    checked={selectedFiles.size === files.length && files.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="py-2 font-semibold">Name</th>
                <th className="py-2 font-semibold">Size</th>
                <th className="py-2 font-semibold hidden md:table-cell">Last Modified</th>
                <th className="py-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {files.map((file) => (
                <ContextMenu key={file.name}>
                  <ContextMenuTrigger asChild>
                    <tr className="hover:bg-secondary/35 group/row">
                      <td className="py-2.5">
                        <Checkbox
                          checked={selectedFiles.has(file.name)}
                          onCheckedChange={() => toggleSelectFile(file.name)}
                        />
                      </td>
                      <td className="py-2.5">
                        {file.isDir ? (
                          <button
                            onClick={() => handleFolderClick(file.name)}
                            className="flex items-center gap-2 font-semibold text-foreground/90 hover:text-primary hover:underline cursor-pointer text-left w-full truncate"
                          >
                            <Folder className="h-4 w-4 text-amber-500 shrink-0" />
                            <span className="truncate">{file.name}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (!isZip(file.name)) {
                                setEditingFilePath(currentPath ? `${currentPath}/${file.name}` : file.name);
                              }
                            }}
                            className={`flex items-center gap-2 text-left w-full truncate ${isZip(file.name)
                              ? "text-foreground/80 cursor-default"
                              : "text-foreground/80 hover:text-primary hover:underline cursor-pointer"
                              }`}
                          >
                            {isZip(file.name) ? (
                              <FileArchive className="h-4 w-4 text-rose-500 shrink-0" />
                            ) : (
                              <File className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <span className="truncate">{file.name}</span>
                          </button>
                        )}
                      </td>
                      <td className="py-2.5 text-muted-foreground">{formatSize(file.size)}</td>
                      <td className="py-2.5 text-muted-foreground hidden md:table-cell">
                        {new Date(file.updatedAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isZip(file.name) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTriggerExtract(file, false)}
                              className="h-7 px-2 cursor-pointer text-[10px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 font-bold uppercase shrink-0"
                              title="Extract Zip File"
                            >
                              Extract
                            </Button>
                          )}

                          {/* Dropdown Menu for left-click options */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-foreground shrink-0"
                                title="File Options"
                              >
                                <Menu className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-40 font-mono text-xs" align="end">
                              {file.isDir ? (
                                <DropdownMenuItem onClick={() => handleFolderClick(file.name)}>
                                  Open Folder
                                </DropdownMenuItem>
                              ) : (
                                !isZip(file.name) && (
                                  <DropdownMenuItem onClick={() => setEditingFilePath(currentPath ? `${currentPath}/${file.name}` : file.name)}>
                                    Edit File
                                  </DropdownMenuItem>
                                )
                              )}
                              {!isZip(file.name) && (
                                <DropdownMenuItem onClick={() => handleTriggerZip(file, false)}>
                                  Compress (Zip)
                                </DropdownMenuItem>
                              )}
                              {isZip(file.name) && (
                                <DropdownMenuItem onClick={() => handleTriggerExtract(file, false)}>
                                  Extract Archive
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleTriggerRename(file)}>
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleTriggerDelete(file, false)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  </ContextMenuTrigger>

                  {/* Context Menu Panel */}
                  <ContextMenuContent className="w-40 font-mono text-xs">
                    {file.isDir ? (
                      <ContextMenuItem onClick={() => handleFolderClick(file.name)}>
                        Open Folder
                      </ContextMenuItem>
                    ) : (
                      !isZip(file.name) && (
                        <ContextMenuItem onClick={() => setEditingFilePath(currentPath ? `${currentPath}/${file.name}` : file.name)}>
                          Edit File
                        </ContextMenuItem>
                      )
                    )}
                    {!isZip(file.name) && (
                      <ContextMenuItem onClick={() => handleTriggerZip(file, false)}>
                        Compress (Zip)
                      </ContextMenuItem>
                    )}
                    {isZip(file.name) && (
                      <ContextMenuItem onClick={() => handleTriggerExtract(file, false)}>
                        Extract Archive
                      </ContextMenuItem>
                    )}
                    <ContextMenuItem onClick={() => handleTriggerRename(file)}>
                      Rename
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      variant="destructive"
                      onClick={() => handleTriggerDelete(file, false)}
                    >
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm.isOpen} onOpenChange={(open) => !open && setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm.isBulk
                ? `Are you sure you want to delete the ${selectedFiles.size} selected item(s)? This action cannot be undone.`
                : `Are you sure you want to delete "${deleteConfirm.file?.name}"? ${deleteConfirm.file?.isDir ? "This will delete all contents inside the folder." : "This action cannot be undone."}`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} variant="destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Extract Confirmation Dialog */}
      <AlertDialog open={extractConfirm.isOpen} onOpenChange={(open) => !open && setExtractConfirm(prev => ({ ...prev, isOpen: false }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Extract Archive(s)</AlertDialogTitle>
            <AlertDialogDescription>
              Warning: Extracting will overwrite any existing files or folders with the same name. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeExtract}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Zip Archive Name Input Dialog */}
      <AlertDialog open={zipDialog.isOpen} onOpenChange={(open) => !open && setZipDialog(prev => ({ ...prev, isOpen: false }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Zip Archive</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a name for the zip archive:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              value={zipDialog.archiveName}
              onChange={(e) => setZipDialog((prev) => ({ ...prev, archiveName: e.target.value }))}
              placeholder="archive.zip"
              className="font-mono text-xs"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeZip} disabled={!zipDialog.archiveName.trim()}>
              Compress
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Upload Resolution Dialog */}
      <AlertDialog open={duplicateUpload.isOpen} onOpenChange={(open) => !open && handleResolveCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>File Already Exists</AlertDialogTitle>
            <AlertDialogDescription>
              The file <span className="font-bold text-foreground font-mono">"{duplicateUpload.currentFile?.name}"</span> already exists in this folder. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 justify-end sm:-mx-4 sm:-mb-4 sm:p-4 sm:bg-muted/50 sm:border-t rounded-b-xl">
            <Button variant="ghost" onClick={handleResolveCancel} className="text-xs font-semibold cursor-pointer">
              Skip File
            </Button>
            <Button variant="outline" onClick={handleResolveRename} className="text-xs font-semibold cursor-pointer">
              Auto Rename
            </Button>
            <Button onClick={handleResolveOverwrite} variant="destructive" className="text-xs font-semibold cursor-pointer text-white">
              Overwrite
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <AlertDialog open={renameDialog.isOpen} onOpenChange={(open) => !open && setRenameDialog(prev => ({ ...prev, isOpen: false }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Item</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new name for <span className="font-bold text-foreground font-mono">"{renameDialog.file?.name}"</span>:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              value={renameDialog.newName}
              onChange={(e) => setRenameDialog((prev) => ({ ...prev, newName: e.target.value }))}
              placeholder="new-name.txt"
              className="font-mono text-xs"
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeRename} disabled={!renameDialog.newName.trim() || renameDialog.newName.trim() === renameDialog.file?.name}>
              Rename
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
