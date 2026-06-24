"use client";

import { useState } from "react";
import { useServerStore } from "@/hooks/useServerStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export function ServerPluginsTab({ id }: { id: string }) {
  const { addLog } = useServerStore();
  const [plugins, setPlugins] = useState([
    { name: "EssentialsX", version: "2.20.1", enabled: true, desc: "Essential commands and utilities." },
    { name: "LuckPerms", version: "5.4.102", enabled: true, desc: "Advanced permissions system." },
    { name: "WorldEdit", version: "7.2.15", enabled: true, desc: "In-game map editor." },
    { name: "Vault", version: "1.7.3", enabled: false, desc: "Vault ecosystem connectors." },
    { name: "Dynmap", version: "3.4", enabled: true, desc: "Real-time dynamic web map for Minecraft servers." },
    { name: "CoreProtect", version: "21.2", enabled: true, desc: "Fast, efficient block logging and rollbacks." },
    { name: "ClearLag", version: "3.2.2", enabled: false, desc: "Entity optimizer to reduce server tick lag." },
    { name: "Multiverse-Core", version: "4.3.1", enabled: true, desc: "Easy to use multi-world management plugin." },
  ]);
  const [searchPlugin, setSearchPlugin] = useState("");
  const [pluginPage, setPluginPage] = useState(1);

  const handleTogglePlugin = (name: string) => {
    setPlugins(plugins.map((p) => (p.name === name ? { ...p, enabled: !p.enabled } : p)));
    const pl = plugins.find((p) => p.name === name);
    addLog(id, `[SYSTEM] Plugin ${name} has been ${pl?.enabled ? "disabled" : "enabled"}. Restart required.`);
  };

  const handleDeletePlugin = (name: string) => {
    if (confirm(`Are you sure you want to permanently delete the plugin "${name}"?`)) {
      setPlugins(plugins.filter((p) => p.name !== name));
      addLog(id, `[SYSTEM] Plugin ${name} has been uninstalled. Server restart required to clear memory cache.`);
      toast.success(`Plugin "${name}" uninstalled successfully`);
    }
  };

  const PAGE_SIZE = 6;
  const filtered = plugins.filter((p) => p.name.toLowerCase().includes(searchPlugin.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(pluginPage, Math.max(1, totalPages));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  return (
    <Card className="flex min-h-[450px] animate-in flex-col border border-border/80 bg-card/65 p-5 duration-300 fade-in lg:h-full">
      <div className="mb-4 flex shrink-0 items-center justify-between border-b border-border pb-3">
        <h3 className="font-mono text-sm font-bold tracking-wider uppercase">Plugins</h3>
        <Input
          placeholder="Search plugins..."
          value={searchPlugin}
          onChange={(e) => {
            setSearchPlugin(e.target.value);
            setPluginPage(1);
          }}
          className="h-8 max-w-[200px] text-xs"
        />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {paginated.length === 0 ? (
          <div className="py-8 text-center font-mono text-xs text-muted-foreground">No plugins found matching &quot;{searchPlugin}&quot;</div>
        ) : (
          paginated.map((plugin) => (
            <div key={plugin.name} className="flex animate-in items-center justify-between gap-4 rounded-xl border border-border bg-secondary/20 p-3.5 duration-150 fade-in">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold">{plugin.name}</h4>
                  <span className="rounded bg-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">v{plugin.version}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{plugin.desc}</p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant={plugin.enabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTogglePlugin(plugin.name)}
                  className={`h-7 cursor-pointer text-xs font-semibold ${plugin.enabled ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}`}
                >
                  {plugin.enabled ? "Enabled" : "Disabled"}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeletePlugin(plugin.name)} className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-rose-500" title="Delete Plugin">
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
            Showing {startIndex + 1} to {Math.min(startIndex + PAGE_SIZE, filtered.length)} of {filtered.length} plugins
          </span>
          <div className="flex gap-1.5">
            <Button variant="outline" size="xs" onClick={() => setPluginPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="h-7 cursor-pointer border-border text-[10px]">
              Previous
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setPluginPage((p) => Math.min(p + 1, totalPages))}
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
