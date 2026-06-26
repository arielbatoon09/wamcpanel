"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { fileService } from "@/services/file-service";
import { Save, AlertTriangle, X } from "lucide-react";

interface FileEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverId: string;
  filePath: string;
}

export function FileEditorModal({ isOpen, onClose, serverId, filePath }: FileEditorModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);

  const isDirty = content !== originalContent;

  useEffect(() => {
    if (isOpen && filePath) {
      loadFile();
    }
  }, [isOpen, filePath]);

  const loadFile = async () => {
    setLoading(true);
    setShowConfirmDiscard(false);
    try {
      const fileContent = await fileService.view(serverId, filePath);
      setContent(fileContent);
      setOriginalContent(fileContent);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load file content");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fileService.write(serverId, filePath, content);
      setOriginalContent(content);
      toast.success("File saved successfully");
      setShowConfirmDiscard(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save file");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestClose = () => {
    if (isDirty) {
      setShowConfirmDiscard(true);
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleRequestClose}>
      <DialogContent showCloseButton={false} className="flex h-[85vh] max-w-4xl flex-col border border-border bg-card/95 p-6 shadow-2xl backdrop-blur-md">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-3">
          <div className="flex flex-col gap-1">
            <DialogTitle className="font-mono text-sm font-bold tracking-wider uppercase text-foreground">
              Editing: {filePath.split("/").pop()}
            </DialogTitle>
            <DialogDescription className="font-mono text-xs text-muted-foreground">
              Path: {filePath} {isDirty && <span className="ml-1 text-amber-500 font-bold">* Unsaved Changes</span>}
            </DialogDescription>
          </div>
          <button
            onClick={handleRequestClose}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none cursor-pointer"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2">
            <Spinner className="h-8 w-8 text-primary" />
            <span className="font-mono text-xs text-muted-foreground">Loading file content…</span>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-4 overflow-hidden py-2">
            {showConfirmDiscard && (
              <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 font-mono text-xs text-amber-400">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>You have unsaved changes. Closing will discard them.</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowConfirmDiscard(false)}
                    className="h-7 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                  >
                    Keep Editing
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={onClose}
                    className="h-7 bg-rose-600 hover:bg-rose-500"
                  >
                    Discard Changes
                  </Button>
                </div>
              </div>
            )}

            <div className="relative flex-1 overflow-hidden rounded-lg border border-border/80 bg-black/95">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={saving}
                className="h-full w-full resize-none border-0 bg-transparent p-4 font-mono text-xs leading-relaxed text-zinc-300 shadow-none focus-visible:ring-0"
              />
            </div>

            <div className="flex justify-between items-center shrink-0 border-t border-border/60 pt-3">
              <span className="font-mono text-[10px] text-muted-foreground uppercase">
                Encoding: UTF-8 | Status: {isDirty ? "Modified" : "Saved"}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRequestClose} disabled={saving} className="h-8 text-xs font-semibold cursor-pointer">
                  Close
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving || !isDirty} className="h-8 text-xs font-semibold gap-1 cursor-pointer">
                  {saving ? (
                    <Spinner className="h-3 w-3" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
