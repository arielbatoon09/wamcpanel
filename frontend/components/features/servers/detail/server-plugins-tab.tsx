"use client"

import { useState } from "react"
import { useServerStore } from "@/hooks/useServerStore"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

export function ServerPluginsTab({ id }: { id: string }) {
  const { addLog } = useServerStore()
  const [plugins, setPlugins] = useState([
    { name: "EssentialsX", version: "2.20.1", enabled: true, desc: "Essential commands and utilities." },
    { name: "LuckPerms", version: "5.4.102", enabled: true, desc: "Advanced permissions system." },
    { name: "WorldEdit", version: "7.2.15", enabled: true, desc: "In-game map editor." },
    { name: "Vault", version: "1.7.3", enabled: false, desc: "Vault ecosystem connectors." },
    { name: "Dynmap", version: "3.4", enabled: true, desc: "Real-time dynamic web map for Minecraft servers." },
    { name: "CoreProtect", version: "21.2", enabled: true, desc: "Fast, efficient block logging and rollbacks." },
    { name: "ClearLag", version: "3.2.2", enabled: false, desc: "Entity optimizer to reduce server tick lag." },
    { name: "Multiverse-Core", version: "4.3.1", enabled: true, desc: "Easy to use multi-world management plugin." },
  ])
  const [searchPlugin, setSearchPlugin] = useState("")
  const [pluginPage, setPluginPage] = useState(1)

  const handleTogglePlugin = (name: string) => {
    setPlugins(
      plugins.map((p) => (p.name === name ? { ...p, enabled: !p.enabled } : p))
    )
    const pl = plugins.find((p) => p.name === name)
    addLog(
      id,
      `[SYSTEM] Plugin ${name} has been ${pl?.enabled ? "disabled" : "enabled"}. Restart required.`
    )
  }

  const handleDeletePlugin = (name: string) => {
    if (confirm(`Are you sure you want to permanently delete the plugin "${name}"?`)) {
      setPlugins(plugins.filter((p) => p.name !== name))
      addLog(id, `[SYSTEM] Plugin ${name} has been uninstalled. Server restart required to clear memory cache.`)
      toast.success(`Plugin "${name}" uninstalled successfully`)
    }
  }

  const PAGE_SIZE = 6
  const filtered = plugins.filter((p) => p.name.toLowerCase().includes(searchPlugin.toLowerCase()))
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const currentPage = Math.min(pluginPage, Math.max(1, totalPages))
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const startIndex = (currentPage - 1) * PAGE_SIZE

  return (
    <Card className="p-5 border border-border/80 bg-card/65 animate-in fade-in duration-300 lg:h-full min-h-[450px] flex flex-col">
      <div className="flex justify-between items-center border-b border-border pb-3 shrink-0 mb-4">
        <h3 className="font-bold text-sm uppercase tracking-wider font-mono">Plugins</h3>
        <Input
          placeholder="Search plugins..."
          value={searchPlugin}
          onChange={(e) => {
            setSearchPlugin(e.target.value)
            setPluginPage(1)
          }}
          className="h-8 text-xs max-w-[200px]"
        />
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {paginated.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-8 font-mono">No plugins found matching "{searchPlugin}"</div>
        ) : (
          paginated.map((plugin) => (
            <div
              key={plugin.name}
              className="p-3.5 border border-border rounded-xl bg-secondary/20 flex justify-between items-center gap-4 animate-in fade-in duration-150"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm">{plugin.name}</h4>
                  <span className="text-[10px] text-muted-foreground bg-border px-1.5 py-0.5 rounded font-mono">
                    v{plugin.version}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{plugin.desc}</p>
              </div>

              <div className="flex gap-2 items-center shrink-0">
                <Button
                  variant={plugin.enabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTogglePlugin(plugin.name)}
                  className={`h-7 text-xs font-semibold cursor-pointer ${
                    plugin.enabled ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                  }`}
                >
                  {plugin.enabled ? "Enabled" : "Disabled"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeletePlugin(plugin.name)}
                  className="h-7 w-7 text-muted-foreground hover:text-rose-500 cursor-pointer"
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-3.5 shrink-0 mt-4 text-xs font-mono text-muted-foreground select-none">
          <span>
            Showing {startIndex + 1} to {Math.min(startIndex + PAGE_SIZE, filtered.length)} of {filtered.length} plugins
          </span>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setPluginPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="cursor-pointer h-7 text-[10px] border-border"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setPluginPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="cursor-pointer h-7 text-[10px] border-border"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
