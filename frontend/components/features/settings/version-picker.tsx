"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────
// Java version recommendation & helpers
// ─────────────────────────────────────────────────────────────────
export function recommendedJava(version: string): "17" | "21" | "25" {
  if (!version) return "21";
  const parts = version.split(".").map(Number);
  const major = parts[0] ?? 0;
  const minor = parts[1] ?? 0;
  if (major > 1 || (major === 1 && minor >= 26)) return "25";
  if (major === 1 && minor >= 20 && (minor > 20 || (parts[2] ?? 0) >= 5)) return "21";
  return "17";
}

export function isJavaLocked(version: string): boolean {
  const parts = version.split(".").map(Number);
  const major = parts[0] ?? 0;
  const minor = parts[1] ?? 0;
  return major > 1 || (major === 1 && minor >= 26);
}

export function javaLabel(v: "17" | "21" | "25" | string) {
  return v === "17" ? "Java 17" : v === "21" ? "Java 21" : v === "25" ? "Java 25" : `Java ${v}`;
}

interface VersionPickerProps {
  versions: string[];
  value: string;
  onChange: (v: string) => void;
  isLoading: boolean;
}

export function VersionPicker({ versions, value, onChange, isLoading }: VersionPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [openUp, setOpenUp] = useState(false);
  const [listMaxHeight, setListMaxHeight] = useState(280);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = versions.filter((v) => v.includes(query.trim()));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!open) return;

    function updateMenuPosition() {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const gap = 6;
      const viewportPadding = 12;
      const searchHeight = 49;
      const preferredListHeight = 280;
      const preferredMenuHeight = searchHeight + preferredListHeight;
      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
      const spaceAbove = rect.top - viewportPadding;
      const shouldOpenUp = spaceBelow < preferredMenuHeight && spaceAbove > spaceBelow;
      const availableHeight = Math.max(140, shouldOpenUp ? spaceAbove - gap : spaceBelow - gap);
      const menuHeight = Math.min(preferredMenuHeight, availableHeight);

      setOpenUp(shouldOpenUp);
      setListMaxHeight(Math.max(90, menuHeight - searchHeight));
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open]);

  const java = recommendedJava(value);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border border-border bg-background px-3 text-sm transition-colors hover:bg-muted/30 focus:ring-2 focus:ring-primary/40 focus:outline-none"
      >
        <span className={cn("flex items-center gap-2", !value && "text-muted-foreground")}>
          {value ? (
            <>
              <span className="font-mono font-semibold">{value}</span>
              <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">{javaLabel(java)}</span>
            </>
          ) : (
            "Select version..."
          )}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className={cn("absolute right-0 left-0 z-50 overflow-hidden rounded-xl border border-border bg-card shadow-xl", openUp ? "bottom-full mb-1.5" : "top-full mt-1.5")}>
          {/* Search */}
          <div className="border-b border-border p-2">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                className="h-8 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
                placeholder="Search versions..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto" style={{ maxHeight: listMaxHeight }}>
            {isLoading ? (
              <div className="py-6 text-center text-xs text-muted-foreground">Loading versions…</div>
            ) : filtered.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">No versions match &quot;{query}&quot;</div>
            ) : (
              filtered.map((v) => {
                const rec = recommendedJava(v);
                const isSelected = v === value;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      onChange(v);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={cn(
                      "flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted/40",
                      isSelected && "bg-primary/8 font-bold text-primary"
                    )}
                  >
                    <span className="font-mono">{v}</span>
                    <span className={cn("rounded px-1.5 py-0.5 font-mono text-[10px] font-bold", isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>{javaLabel(rec)}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
