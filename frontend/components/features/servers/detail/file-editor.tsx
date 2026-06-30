"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { fileService } from "@/services/file-service";
import { Save, AlertTriangle, X } from "lucide-react";
import Editor from "@monaco-editor/react";

interface FileEditorProps {
  serverId: string;
  filePath: string;
  onClose: () => void;
}

export function FileEditor({ serverId, filePath, onClose }: FileEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const isDirty = content !== originalContent;

  const loadFile = useCallback(async () => {
    setLoading(true);
    setShowConfirmDiscard(false);
    try {
      const fileContent = await fileService.view(serverId, filePath);
      setContent(fileContent);
      setOriginalContent(fileContent);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || "Failed to load file content");
      onCloseRef.current();
    } finally {
      setLoading(false);
    }
  }, [serverId, filePath]);

  useEffect(() => {
    if (filePath) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadFile();
    }
  }, [filePath, loadFile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fileService.write(serverId, filePath, content);
      setOriginalContent(content);
      toast.success("File saved successfully");
      setShowConfirmDiscard(false);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || "Failed to save file");
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

  const getLanguage = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "json":
        return "json";
      case "yml":
      case "yaml":
        return "yaml";
      case "properties":
      case "conf":
      case "config":
        return "ini";
      case "xml":
        return "xml";
      case "html":
        return "html";
      case "js":
        return "javascript";
      case "ts":
        return "typescript";
      case "css":
        return "css";
      case "md":
        return "markdown";
      case "sh":
      case "bash":
        return "shell";
      default:
        return "plaintext";
    }
  };

  const fileName = filePath.split("/").pop() || "";

  return (
    <Card className="flex min-h-[500px] animate-in flex-col border border-border/80 bg-card/65 p-5 duration-300 fade-in lg:h-full">
      {/* Editor Header */}
      <div className="mb-4 flex shrink-0 items-center justify-between border-b border-border pb-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-mono text-sm font-bold tracking-wider text-foreground uppercase">Editing: {fileName}</h3>
          <span className="font-mono text-[10px] text-muted-foreground">
            Path: {filePath} {isDirty && <span className="ml-1 font-bold text-amber-500">* Unsaved Changes</span>}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRequestClose} className="h-8 cursor-pointer gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
          Close
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <Spinner className="h-8 w-8 text-primary" />
          <span className="font-mono text-xs text-muted-foreground">Loading file content…</span>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          {showConfirmDiscard && (
            <div className="flex animate-in items-center justify-between gap-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 font-mono text-xs text-amber-400 duration-200 slide-in-from-top">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                <span>You have unsaved changes. Closing will discard them.</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowConfirmDiscard(false)} className="h-7 border-amber-500/20 text-amber-400 hover:bg-amber-500/20">
                  Keep Editing
                </Button>
                <Button size="sm" variant="destructive" onClick={onClose} className="h-7 bg-rose-600 hover:bg-rose-500">
                  Discard Changes
                </Button>
              </div>
            </div>
          )}

          {/* Monaco Editor Container */}
          <div className="relative min-h-[350px] flex-1 overflow-hidden rounded-lg border border-border/80 bg-zinc-950 p-2">
            <Editor
              height="100%"
              language={getLanguage(fileName)}
              theme="vs-dark"
              value={content}
              onChange={(val) => setContent(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 12,
                fontFamily: "var(--font-mono), monospace",
                automaticLayout: true,
                padding: { top: 8, bottom: 8 },
              }}
              loading={
                <div className="flex h-full flex-col items-center justify-center gap-2">
                  <Spinner className="h-6 w-6 text-primary" />
                  <span className="font-mono text-[10px] text-muted-foreground">Loading Editor Core…</span>
                </div>
              }
            />
          </div>

          <div className="flex shrink-0 items-center justify-between border-t border-border/60 pt-3">
            <span className="font-mono text-[10px] text-muted-foreground uppercase">
              Type: {getLanguage(fileName).toUpperCase()} | Status: {isDirty ? "Modified" : "Saved"}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRequestClose} disabled={saving} className="h-8 cursor-pointer text-xs font-semibold">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !isDirty} className="h-8 cursor-pointer gap-1 text-xs font-semibold">
                {saving ? <Spinner className="h-3 w-3" /> : <Save className="h-3.5 w-3.5" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
