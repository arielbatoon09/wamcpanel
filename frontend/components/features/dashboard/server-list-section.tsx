"use client"

import { useState } from "react"
import { useServerStore } from "@/hooks/useServerStore"
import { ServerCard } from "@/components/features/dashboard/server-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, Server, ShieldAlert } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { serverCreateSchema } from "@/lib/schemas/serverSchema"
import { ZodError } from "zod"

export function ServerListSection() {
  const { servers, addServer } = useServerStore()
  
  // State for search and filtering
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [softwareFilter, setSoftwareFilter] = useState<string>("all")

  // State for Create Server Dialog
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [software, setSoftware] = useState<"Vanilla" | "Paper" | "Forge" | "Velocity">("Paper")
  const [version, setVersion] = useState("1.20.4")
  const [port, setPort] = useState("25565")
  const [ramLimit, setRamLimit] = useState("4096")
  const [cpuLimit, setCpuLimit] = useState("200")
  const [host, setHost] = useState("localhost")
  const [javaVersion, setJavaVersion] = useState<"17" | "21" | "25">("21")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Filtering logic
  const filteredServers = servers.filter((server) => {
    const matchesSearch = server.name.toLowerCase().includes(search.toLowerCase()) || 
                          server.host.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || server.status === statusFilter
    const matchesSoftware = softwareFilter === "all" || server.software === softwareFilter
    return matchesSearch && matchesStatus && matchesSoftware
  })

  // Form Submission
  const handleCreateServer = (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({})

    const payload = {
      name,
      description,
      software,
      version,
      port,
      ramLimit,
      cpuLimit,
      host,
      javaVersion,
    }

    try {
      // Validate with Zod
      const validated = serverCreateSchema.parse(payload)
      
      // Map to server payload
      addServer({
        name: validated.name,
        description: validated.description,
        software: validated.software,
        version: validated.version,
        host: validated.host,
        port: validated.port,
        maxPlayers: validated.software === "Velocity" ? 500 : 50,
        ramLimit: validated.ramLimit,
        cpuLimit: validated.cpuLimit,
        javaVersion: validated.javaVersion,
      })

      // Reset Form and close modal
      setName("")
      setDescription("")
      setSoftware("Paper")
      setVersion("1.20.4")
      setPort("25565")
      setRamLimit("4096")
      setCpuLimit("200")
      setJavaVersion("21")
      setOpen(false)
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {}
        err.issues.forEach((item) => {
          if (item.path[0]) {
            errors[item.path[0] as string] = item.message
          }
        })
        setFormErrors(errors)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card/40 border border-border p-4 rounded-xl backdrop-blur-md">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search servers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 w-full"
          />
        </div>

        <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-10 cursor-pointer">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">All Statuses</SelectItem>
              <SelectItem value="online" className="cursor-pointer">Online</SelectItem>
              <SelectItem value="offline" className="cursor-pointer">Offline</SelectItem>
              <SelectItem value="starting" className="cursor-pointer">Starting</SelectItem>
              <SelectItem value="stopping" className="cursor-pointer">Stopping</SelectItem>
            </SelectContent>
          </Select>

          {/* Software/Type Filter */}
          <Select value={softwareFilter} onValueChange={setSoftwareFilter}>
            <SelectTrigger className="w-[130px] h-10 cursor-pointer">
              <SelectValue placeholder="Software" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="cursor-pointer">All Software</SelectItem>
              <SelectItem value="Vanilla" className="cursor-pointer">Vanilla</SelectItem>
              <SelectItem value="Paper" className="cursor-pointer">Paper</SelectItem>
              <SelectItem value="Forge" className="cursor-pointer">Forge</SelectItem>
              <SelectItem value="Velocity" className="cursor-pointer">Velocity</SelectItem>
            </SelectContent>
          </Select>

          {/* Add Server Dialog */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 px-4 font-semibold shadow-xs cursor-pointer gap-1.5 ml-auto md:ml-0">
                <Plus className="h-4 w-4" />
                Add Server
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Server</DialogTitle>
                <DialogDescription>
                  Configure the server settings and resources.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateServer} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Server Name</label>
                    <Input
                      placeholder="Survival Server"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={formErrors.name ? "border-rose-500" : ""}
                    />
                    {formErrors.name && (
                      <p className="text-[10px] text-rose-500 font-medium">{formErrors.name}</p>
                    )}
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Description</label>
                    <Input
                      placeholder="My awesome Minecraft server..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={formErrors.description ? "border-rose-500" : ""}
                    />
                    {formErrors.description && (
                      <p className="text-[10px] text-rose-500 font-medium">{formErrors.description}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Software</label>
                    <Select value={software} onValueChange={(val: any) => setSoftware(val)}>
                      <SelectTrigger className="cursor-pointer">
                        <SelectValue placeholder="Software" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Paper" className="cursor-pointer">Paper (Spigot)</SelectItem>
                        <SelectItem value="Vanilla" className="cursor-pointer">Vanilla MC</SelectItem>
                        <SelectItem value="Forge" className="cursor-pointer">Forge Mods</SelectItem>
                        <SelectItem value="Velocity" className="cursor-pointer">Velocity Proxy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Minecraft Version</label>
                    <Input
                      placeholder="1.20.4"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      className={formErrors.version ? "border-rose-500" : ""}
                    />
                    {formErrors.version && (
                      <p className="text-[10px] text-rose-500 font-medium">{formErrors.version}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Port</label>
                    <Input
                      placeholder="25565"
                      type="number"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      className={formErrors.port ? "border-rose-500" : ""}
                    />
                    {formErrors.port && (
                      <p className="text-[10px] text-rose-500 font-medium">{formErrors.port}</p>
                    )}
                  </div>



                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Max RAM (MB)</label>
                    <Input
                      placeholder="4096"
                      type="number"
                      value={ramLimit}
                      onChange={(e) => setRamLimit(e.target.value)}
                      className={formErrors.ramLimit ? "border-rose-500" : ""}
                    />
                    {formErrors.ramLimit && (
                      <p className="text-[10px] text-rose-500 font-medium">{formErrors.ramLimit}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">CPU Limit (%)</label>
                    <Input
                      placeholder="200"
                      type="number"
                      value={cpuLimit}
                      onChange={(e) => setCpuLimit(e.target.value)}
                      className={formErrors.cpuLimit ? "border-rose-500" : ""}
                    />
                    {formErrors.cpuLimit && (
                      <p className="text-[10px] text-rose-500 font-medium">{formErrors.cpuLimit}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Java Version</label>
                    <Select value={javaVersion} onValueChange={(val: any) => setJavaVersion(val)}>
                      <SelectTrigger className="cursor-pointer">
                        <SelectValue placeholder="Java Version" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="17" className="cursor-pointer">Java 17</SelectItem>
                        <SelectItem value="21" className="cursor-pointer">Java 21</SelectItem>
                        <SelectItem value="25" className="cursor-pointer">Java 25</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="pt-4 border-t border-border mt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} className="cursor-pointer">
                    Cancel
                  </Button>
                  <Button type="submit" className="cursor-pointer">Create Server</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Grid of Servers */}
      <AnimatePresence mode="popLayout">
        {filteredServers.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredServers.map((server) => (
              <ServerCard key={server.id} server={server} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center p-12 bg-card/30 border border-dashed border-border rounded-xl"
          >
            <Server className="h-10 w-10 text-muted-foreground mb-3 stroke-[1.5]" />
            <h4 className="font-semibold text-base">No Servers Found</h4>
            <p className="text-xs text-muted-foreground text-center mt-1 max-w-sm">
              Adjust your filters or deploy a new Minecraft server instance to start managing.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
