"use client"

import { useState } from "react"
import { useServerStore } from "@/hooks/useServerStore"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Gamepad2,
  HelpCircle,
  Gauge,
  AlertTriangle,
  Lock,
  Cpu,
  Settings2,
  Trash2,
  FileCode,
  CheckCircle2
} from "lucide-react"

export function ServerSettingsTab({ id }: { id: string }) {
  const router = useRouter()
  const { servers, deleteServer, addLog } = useServerStore()
  const server = servers.find((s) => s.id === id)

  // Gameplay States
  const [gameMode, setGameMode] = useState<string>("Survival")
  const [difficulty, setDifficulty] = useState<string>("Easy")
  const [motd, setMotd] = useState<string>(server?.description || "A Minecraft Server")
  const [pvp, setPvp] = useState<boolean>(true)
  const [allowFlight, setAllowFlight] = useState<boolean>(false)
  const [commandBlocks, setCommandBlocks] = useState<boolean>(false)
  const [hardcore, setHardcore] = useState<boolean>(false)
  const [squidServers, setSquidServers] = useState<boolean>(false)

  // Performance States
  const [maxPlayers, setMaxPlayers] = useState<string>(String(server?.maxPlayers || 20))
  const [viewDistance, setViewDistance] = useState<string>("10")
  const [simDistance, setSimDistance] = useState<string>("8")
  const [ramAllocation, setRamAllocation] = useState<number>(server?.ramLimit || 512)

  // Security States
  const [publicServer, setPublicServer] = useState<boolean>(false)
  const [spawnProtection, setSpawnProtection] = useState<string>("16")
  const [whitelist, setWhitelist] = useState<boolean>(false)
  const [enforceWhitelist, setEnforceWhitelist] = useState<boolean>(false)
  const [onlineMode, setOnlineMode] = useState<boolean>(true)

  // Startup & JVM States
  const [javaVersion, setJavaVersion] = useState<string>("java-21")
  const [useNogui, setUseNogui] = useState<boolean>(true)
  const [jvmArgs, setJvmArgs] = useState<string>("")

  // Version States
  const [mcVersion, setMcVersion] = useState<string>("1.21.11")

  // raw server.properties Dialog State
  const [propertiesOpen, setPropertiesOpen] = useState(false)

  // General Settings Panel Page State
  const [panelName, setPanelName] = useState(server?.name || "")

  if (!server) return null

  const handleSaveProperties = () => {
    server.name = panelName
    server.description = motd
    server.maxPlayers = Number(maxPlayers) || 20
    server.ramLimit = ramAllocation
    addLog(id, `[SYSTEM] Properties saved. Uptime limits and limits updated.`)
    toast.success("Settings saved successfully")
  }

  const handleDeleteServer = () => {
    if (confirm(`Are you sure you want to delete ${server.name}?`)) {
      deleteServer(id)
      router.push("/servers")
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 lg:h-full lg:overflow-y-auto h-auto pr-1">
      {/* Header with Save Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Server Settings</h2>
          <p className="text-xs text-muted-foreground">Configure your Minecraft server properties</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => setPropertiesOpen(true)}
            className="h-9 cursor-pointer gap-1.5 text-xs flex-1 sm:flex-none border-border"
          >
            <FileCode className="h-4 w-4" /> Open server.properties
          </Button>
          <Button 
            type="button" 
            size="sm" 
            onClick={handleSaveProperties}
            className="h-9 cursor-pointer gap-1.5 text-xs flex-1 sm:flex-none font-semibold"
          >
            <CheckCircle2 className="h-4 w-4" /> Save Changes
          </Button>
        </div>
      </div>

      {/* Layout Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gameplay Configurations */}
        <Card className="p-5 border border-border bg-card/65 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
              <div className="p-1.5 rounded-lg bg-secondary text-primary">
                <Gamepad2 className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">Gameplay</h3>
                <p className="text-[10px] text-muted-foreground font-mono">General gameplay settings</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Game Mode */}
              <div className="space-y-1.5">
                <span className="flex items-center gap-1 font-semibold text-muted-foreground font-mono">
                  Game Mode
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>The default game mode for joining players.</TooltipContent>
                  </Tooltip>
                </span>
                <Select value={gameMode} onValueChange={setGameMode}>
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Select Game Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Survival" className="cursor-pointer">Survival</SelectItem>
                    <SelectItem value="Creative" className="cursor-pointer">Creative</SelectItem>
                    <SelectItem value="Adventure" className="cursor-pointer">Adventure</SelectItem>
                    <SelectItem value="Spectator" className="cursor-pointer">Spectator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty */}
              <div className="space-y-1.5">
                <span className="flex items-center gap-1 font-semibold text-muted-foreground font-mono">
                  Difficulty
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>The general difficulty level of the server.</TooltipContent>
                  </Tooltip>
                </span>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Select Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Peaceful" className="cursor-pointer">Peaceful</SelectItem>
                    <SelectItem value="Easy" className="cursor-pointer">Easy</SelectItem>
                    <SelectItem value="Normal" className="cursor-pointer">Normal</SelectItem>
                    <SelectItem value="Hard" className="cursor-pointer">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Server MOTD Message */}
              <div className="space-y-1.5">
                <span className="flex items-center gap-1 font-semibold text-muted-foreground font-mono">
                  Server Message (MOTD)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>Message displayed in the server list.</TooltipContent>
                  </Tooltip>
                </span>
                <Input value={motd} onChange={(e) => setMotd(e.target.value)} />
              </div>

              {/* Checkbox settings */}
              <div className="space-y-2.5 pt-2">
                {/* PVP */}
                <div className="flex items-center space-x-2">
                  <Checkbox id="pvp" checked={pvp} onCheckedChange={(val) => setPvp(!!val)} />
                  <label htmlFor="pvp" className="text-xs font-semibold text-foreground/80 flex items-center gap-1 cursor-pointer">
                    Enable PVP
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>Allows players to damage each other.</TooltipContent>
                    </Tooltip>
                  </label>
                </div>

                {/* Allow Flight */}
                <div className="flex items-center space-x-2">
                  <Checkbox id="flight" checked={allowFlight} onCheckedChange={(val) => setAllowFlight(!!val)} />
                  <label htmlFor="flight" className="text-xs font-semibold text-foreground/80 flex items-center gap-1 cursor-pointer">
                    Allow Flying
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>Prevents kick-back warnings when flying in Survival.</TooltipContent>
                    </Tooltip>
                  </label>
                </div>

                {/* Command Blocks */}
                <div className="flex items-center space-x-2">
                  <Checkbox id="cmdblocks" checked={commandBlocks} onCheckedChange={(val) => setCommandBlocks(!!val)} />
                  <label htmlFor="cmdblocks" className="text-xs font-semibold text-foreground/80 flex items-center gap-1 cursor-pointer">
                    Enable Command Blocks
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>Allows command blocks to execute functions.</TooltipContent>
                    </Tooltip>
                  </label>
                </div>

                {/* Hardcore Mode */}
                <div className="flex items-center space-x-2">
                  <Checkbox id="hardcore" checked={hardcore} onCheckedChange={(val) => setHardcore(!!val)} />
                  <label htmlFor="hardcore" className="text-xs font-semibold text-foreground/80 flex items-center gap-1 cursor-pointer">
                    Hardcore Mode
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>Locks difficulty to Hard and enables permadeath.</TooltipContent>
                    </Tooltip>
                  </label>
                </div>

                {/* SquidServers content */}
                <div className="flex items-center space-x-2">
                  <Checkbox id="squid" checked={squidServers} onCheckedChange={(val) => setSquidServers(!!val)} />
                  <label htmlFor="squid" className="text-xs font-semibold text-foreground/80 flex items-center gap-1 cursor-pointer">
                    SquidServers content
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>Integrate with customized server features.</TooltipContent>
                    </Tooltip>
                  </label>
                </div>
              </div>

            </div>
          </div>
        </Card>

        {/* Performance Configurations */}
        <Card className="p-5 border border-border bg-card/65 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
              <div className="p-1.5 rounded-lg bg-secondary text-primary">
                <Gauge className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">Performance</h3>
                <p className="text-[10px] text-muted-foreground font-mono">Optimize your server's performance</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Max Players */}
              <div className="space-y-1.5">
                <span className="flex items-center gap-1 font-semibold text-muted-foreground font-mono">
                  Max Players
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>Limits concurrent player count capacity.</TooltipContent>
                  </Tooltip>
                </span>
                <Input type="number" value={maxPlayers} onChange={(e) => setMaxPlayers(e.target.value)} />
              </div>

              {/* View Distance */}
              <div className="space-y-1.5">
                <span className="flex items-center gap-1 font-semibold text-muted-foreground font-mono">
                  View Distance
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>Radius of chunks sent to the client (4-32).</TooltipContent>
                  </Tooltip>
                </span>
                <Input type="number" value={viewDistance} onChange={(e) => setViewDistance(e.target.value)} />
              </div>

              {/* Simulation Distance */}
              <div className="space-y-1.5">
                <span className="flex items-center gap-1 font-semibold text-muted-foreground font-mono">
                  Simulation Distance
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>Radius of chunks loaded around the player to update entities.</TooltipContent>
                  </Tooltip>
                </span>
                <Input type="number" value={simDistance} onChange={(e) => setSimDistance(e.target.value)} />
              </div>

              {/* RAM Allocation Input */}
              <div className="space-y-1.5">
                <span className="flex items-center gap-1 font-semibold text-muted-foreground font-mono">
                  RAM Allocation (MB)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>Dedicated RAM limitation allocated to the JVM.</TooltipContent>
                  </Tooltip>
                </span>
                <Input type="number" value={ramAllocation} onChange={(e) => setRamAllocation(Number(e.target.value) || 512)} />
              </div>

              {/* RAM Slider */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-[11px] font-mono font-semibold text-muted-foreground">
                  <span>Memory Slider</span>
                  <span className="text-foreground">{ramAllocation} MB</span>
                </div>
                <Slider
                  value={[ramAllocation]}
                  onValueChange={(val) => setRamAllocation(val[0])}
                  min={512}
                  max={15761}
                  step={256}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground/75 font-mono">
                  <span>512 MB</span>
                  <span>15761 MB</span>
                </div>
              </div>

              {/* Warning Low RAM banner */}
              {ramAllocation < 2048 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-lg flex items-start gap-2 text-amber-500 leading-normal">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-[11px]">Very Low RAM</span>
                    <span className="text-[10px] block">Below minimum (2 GB). Server performance will be poor.</span>
                  </div>
                </div>
              )}

            </div>
          </div>
        </Card>

        {/* Security Configurations */}
        <Card className="p-5 border border-border bg-card/65 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
              <div className="p-1.5 rounded-lg bg-secondary text-primary">
                <Lock className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">Security</h3>
                <p className="text-[10px] text-muted-foreground font-mono">Access control and security settings</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Public Server Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox id="public" checked={publicServer} onCheckedChange={(val) => setPublicServer(val === true)} />
                <label htmlFor="public" className="text-xs font-semibold text-foreground/80 flex items-center gap-1 cursor-pointer">
                  Public Server
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>Broadcast server to external discoverability nodes.</TooltipContent>
                  </Tooltip>
                </label>
              </div>

              {/* Spawn Protection */}
              <div className="space-y-1.5">
                <span className="flex items-center gap-1 font-semibold text-muted-foreground font-mono">
                  Spawn Protection Radius
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>Radius of spawn region protected from non-OP players.</TooltipContent>
                  </Tooltip>
                </span>
                <Input type="number" value={spawnProtection} onChange={(e) => setSpawnProtection(e.target.value)} />
              </div>

              {/* Enable Whitelist */}
              <div className="flex items-center space-x-2">
                <Checkbox id="whitelist" checked={whitelist} onCheckedChange={(val) => setWhitelist(val === true)} />
                <label htmlFor="whitelist" className="text-xs font-semibold text-foreground/80 flex items-center gap-1 cursor-pointer">
                  Enable Whitelist
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>Restricts joining to users on the whitelist.</TooltipContent>
                  </Tooltip>
                </label>
              </div>

              {/* Enforce Whitelist */}
              <div className="flex items-center space-x-2">
                <Checkbox id="enforce" checked={enforceWhitelist} onCheckedChange={(val) => setEnforceWhitelist(val === true)} />
                <label htmlFor="enforce" className="text-xs font-semibold text-foreground/80 flex items-center gap-1 cursor-pointer">
                  Enforce Whitelist
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>Kicks whitelisted users instantly if Whitelists are disabled.</TooltipContent>
                  </Tooltip>
                </label>
              </div>

              {/* Online Mode */}
              <div className="flex items-center space-x-2">
                <Checkbox id="online" checked={onlineMode} onCheckedChange={(val) => setOnlineMode(val === true)} />
                <label htmlFor="online" className="text-xs font-semibold text-foreground/80 flex items-center gap-1 cursor-pointer">
                  Online Mode (Require Login)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>Authenticates connections against Mojang authentication nodes.</TooltipContent>
                  </Tooltip>
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Startup & JVM Configurations */}
        <div className="space-y-6">
          <Card className="p-5 border border-border bg-card/65 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
                <div className="p-1.5 rounded-lg bg-secondary text-primary">
                  <Cpu className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">Startup & JVM</h3>
                  <p className="text-[10px] text-muted-foreground font-mono">Control startup behavior and advanced JVM options</p>
                </div>
              </div>

              <div className="space-y-4 text-xs font-mono">
                {/* Java Version Dropdown */}
                <div className="space-y-1.5">
                  <span className="flex items-center gap-1 font-semibold text-muted-foreground">
                    Java Executable
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>Java VM runtime used to execute the Jar platform.</TooltipContent>
                    </Tooltip>
                  </span>
                  <Select value={javaVersion} onValueChange={setJavaVersion}>
                    <SelectTrigger className="cursor-pointer">
                      <SelectValue placeholder="Java Runtime" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="java-21" className="cursor-pointer">Java 21.0.11 (SquidServers Provided)</SelectItem>
                      <SelectItem value="java-17" className="cursor-pointer">Java 17.0.9 (System Host)</SelectItem>
                      <SelectItem value="java-8" className="cursor-pointer">Java 1.8.0 (Legacy)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Manual Button */}
                <div className="pt-1">
                  <Button type="button" variant="outline" size="sm" className="h-8 text-xs font-semibold cursor-pointer border-border">
                    Select Java Manually
                  </Button>
                </div>

                {/* Nogui Checkbox */}
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox id="nogui" checked={useNogui} onCheckedChange={(val) => setUseNogui(val === true)} />
                  <label htmlFor="nogui" className="text-xs font-semibold text-foreground/80 flex items-center gap-1 cursor-pointer font-sans">
                    Use nogui on startup
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>Launches without graphical administration windows.</TooltipContent>
                    </Tooltip>
                  </label>
                </div>

                {/* Extra JVM args */}
                <div className="space-y-1.5">
                  <span className="flex items-center gap-1 font-semibold text-muted-foreground">
                    Extra JVM -X args
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>Advanced Java options (GC flags, optimization arguments).</TooltipContent>
                    </Tooltip>
                  </span>
                  <Input placeholder="e.g. -XX:+UseG1GC -Xss1M" value={jvmArgs} onChange={(e) => setJvmArgs(e.target.value)} />
                </div>
              </div>
            </div>
          </Card>

          {/* Server Version Selection Card */}
          <Card className="p-5 border border-border bg-card/65 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border/40">
              <div className="p-1.5 rounded-lg bg-secondary text-primary">
                <Settings2 className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">Server Version</h3>
                <p className="text-[10px] text-muted-foreground font-mono">Update the Minecraft version for this server</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <span className="flex items-center gap-1 font-semibold text-muted-foreground">
                Select New Version
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>Updates the target Minecraft installation version.</TooltipContent>
                </Tooltip>
              </span>
              <Select value={mcVersion} onValueChange={setMcVersion}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Minecraft Version" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1.21.11" className="cursor-pointer">1.21.11</SelectItem>
                  <SelectItem value="1.20.4" className="cursor-pointer">1.20.4</SelectItem>
                  <SelectItem value="1.20.2" className="cursor-pointer">1.20.2</SelectItem>
                  <SelectItem value="1.19.4" className="cursor-pointer">1.19.4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        </div>

      </div>

      {/* Permanent Delete Section */}
      <Card className="p-5 border border-red-500/20 bg-red-500/5 space-y-4 mt-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-red-500 flex items-center gap-1.5">
              <Trash2 className="h-4.5 w-4.5" /> Delete Server
            </h3>
            <p className="text-xs text-muted-foreground">Permanently delete this server and all its files</p>
          </div>
          <Button
            variant="destructive"
            onClick={handleDeleteServer}
            className="text-xs font-semibold cursor-pointer bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="h-4 w-4 mr-1" /> Delete Server
          </Button>
        </div>

        <div className="text-xs font-mono font-semibold py-1">
          Server: <span className="text-foreground">{server.name}</span>
        </div>

        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-semibold">
          Warning: This action cannot be undone. All server files, configurations, worlds, and associated tunnels will be permanently deleted.
        </div>
      </Card>

      {/* Raw server.properties Dialog View */}
      <Dialog open={propertiesOpen} onOpenChange={setPropertiesOpen}>
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">server.properties</DialogTitle>
            <DialogDescription>
              Raw properties config representation of this server instance.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-black/95 p-4 rounded-lg overflow-y-auto max-h-[350px] font-mono text-xs text-zinc-300 space-y-1">
            <div># Minecraft server properties</div>
            <div># Generated and managed by Panel</div>
            <div>generator-settings=</div>
            <div>op-permission-level=4</div>
            <div>allow-nether=true</div>
            <div>level-name=world</div>
            <div>enable-query=false</div>
            <div>allow-flight={String(allowFlight)}</div>
            <div>announce-player-achievements=true</div>
            <div>server-port={server.port}</div>
            <div>max-players={maxPlayers}</div>
            <div>difficulty={difficulty.toLowerCase()}</div>
            <div>spawn-monsters=true</div>
            <div>pvp={String(pvp)}</div>
            <div>hardcore={String(hardcore)}</div>
            <div>enable-command-block={String(commandBlocks)}</div>
            <div>gamemode={gameMode.toLowerCase()}</div>
            <div>online-mode={String(onlineMode)}</div>
            <div>view-distance={viewDistance}</div>
            <div>simulation-distance={simDistance}</div>
            <div>motd={motd}</div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button onClick={() => setPropertiesOpen(false)} size="sm">
              Close Editor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
