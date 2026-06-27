"use client";

import { useState, useEffect } from "react";
import { useServerStore } from "@/hooks/useServerStore";
import { useRouter } from "next/navigation";
import { useDeleteServer, useMinecraftVersions } from "@/services/server-service";
import { VersionPicker, recommendedJava, isJavaLocked, javaLabel } from "@/components/features/settings/version-picker";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gamepad2, HelpCircle, Gauge, AlertTriangle, Lock, Cpu, Settings2, Trash2, FileCode, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
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

export function ServerSettingsTab({ id }: { id: string }) {
  const router = useRouter();
  const { servers, deleteServer, updateServer, addLog } = useServerStore();
  const deleteMutation = useDeleteServer();
  const server = servers.find((s) => s.id === id);
  const initialSettings = server?.settings || {};

  const { data: versionsList = [], isLoading: versionsLoading } = useMinecraftVersions();

  // Gameplay States
  const [gameMode, setGameMode] = useState<string>("Survival");
  const [difficulty, setDifficulty] = useState<string>("Easy");
  const [motd, setMotd] = useState<string>(initialSettings.motd || server?.description || "A Minecraft Server");
  const [pvp, setPvp] = useState<boolean>(true);
  const [allowFlight, setAllowFlight] = useState<boolean>(false);
  const [commandBlocks, setCommandBlocks] = useState<boolean>(false);
  const [hardcore, setHardcore] = useState<boolean>(false);
  const [squidServers, setSquidServers] = useState<boolean>(false);

  // Performance States
  const [maxPlayers, setMaxPlayers] = useState<string>(initialSettings["max-players"] || String(server?.maxPlayers || 20));
  const [viewDistance, setViewDistance] = useState<string>("10");
  const [simDistance, setSimDistance] = useState<string>("8");
  const [ramAllocation, setRamAllocation] = useState<number>(server?.ramLimit || 4096);

  // Security States
  const [spawnProtection, setSpawnProtection] = useState<string>("16");
  const [whitelist, setWhitelist] = useState<boolean>(false);
  const [enforceWhitelist, setEnforceWhitelist] = useState<boolean>(false);
  const [onlineMode, setOnlineMode] = useState<boolean>(true);

  // Startup & JVM States
  const [javaVersion, setJavaVersion] = useState<string>("21");
  const [useNogui, setUseNogui] = useState<boolean>(true);
  const [jvmArgs, setJvmArgs] = useState<string>("");

  // Version States
  const [mcVersion, setMcVersion] = useState<string>("1.21.11");
  const javaLocked = isJavaLocked(mcVersion);

  // Track loaded server to only initialize once
  const [loadedServerId, setLoadedServerId] = useState<string | null>(null);

  // Delete Confirmation States
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  const caps = (s?: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
  const settings = server?.settings || {};

  const originalGameMode = caps(settings.gamemode) || "Survival";
  const originalDifficulty = caps(settings.difficulty) || "Easy";
  const originalMotd = settings.motd || server?.description || "A Minecraft Server";
  const originalPvp = settings.pvp !== undefined ? settings.pvp === "true" : true;
  const originalAllowFlight = settings["allow-flight"] === "true";
  const originalCommandBlocks = settings["enable-command-block"] === "true";
  const originalHardcore = settings.hardcore === "true";
  const originalMaxPlayers = settings["max-players"] || String(server?.maxPlayers || 20);
  const originalViewDistance = settings["view-distance"] || "10";
  const originalSimDistance = settings["simulation-distance"] || "8";
  const originalRamAllocation = server?.ramLimit || 4096;
  const originalSpawnProtection = settings["spawn-protection"] || "16";
  const originalWhitelist = settings["white-list"] === "true";
  const originalEnforceWhitelist = settings["enforce-whitelist"] === "true";
  const originalOnlineMode = settings["online-mode"] !== undefined ? settings["online-mode"] === "true" : true;
  const originalJavaVersion = server?.javaVersion || "21";
  const originalMcVersion = server?.version || "1.21.11";

  const hasChanges =
    gameMode !== originalGameMode ||
    difficulty !== originalDifficulty ||
    motd !== originalMotd ||
    pvp !== originalPvp ||
    allowFlight !== originalAllowFlight ||
    commandBlocks !== originalCommandBlocks ||
    hardcore !== originalHardcore ||
    maxPlayers !== originalMaxPlayers ||
    viewDistance !== originalViewDistance ||
    simDistance !== originalSimDistance ||
    ramAllocation !== originalRamAllocation ||
    spawnProtection !== originalSpawnProtection ||
    whitelist !== originalWhitelist ||
    enforceWhitelist !== originalEnforceWhitelist ||
    onlineMode !== originalOnlineMode ||
    javaVersion !== originalJavaVersion ||
    mcVersion !== originalMcVersion;

  // Sync state from server on mount/change or when server updates and there are no local edits
  useEffect(() => {
    if (server && (loadedServerId !== server.id || !hasChanges)) {
      const settings = server.settings || {};
      setLoadedServerId(server.id);
      setMotd(settings.motd || server.description || "A Minecraft Server");
      setMaxPlayers(settings["max-players"] || String(server.maxPlayers || 20));
      setRamAllocation(server.ramLimit || 4096);
      setJavaVersion(server.javaVersion || "21");
      setMcVersion(server.version || "1.21.11");

      const caps = (s?: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

      setGameMode(caps(settings.gamemode) || "Survival");
      setDifficulty(caps(settings.difficulty) || "Easy");

      // Defaults: Online mode true, PVP true, Game Mode Survival
      setPvp(settings.pvp !== undefined ? settings.pvp === "true" : true);
      setAllowFlight(settings["allow-flight"] === "true");
      setCommandBlocks(settings["enable-command-block"] === "true");
      setHardcore(settings.hardcore === "true");
      setViewDistance(settings["view-distance"] || "10");
      setSimDistance(settings["simulation-distance"] || "8");
      setSpawnProtection(settings["spawn-protection"] || "16");
      setWhitelist(settings["white-list"] === "true");
      setEnforceWhitelist(settings["enforce-whitelist"] === "true");
      setOnlineMode(settings["online-mode"] !== undefined ? settings["online-mode"] === "true" : true);
    }
  }, [server, loadedServerId, hasChanges]);

  if (!server) return null;

  const handleSaveProperties = () => {
    updateServer(id, {
      description: motd,
      maxPlayers: Number(maxPlayers) || 20,
      ramLimit: ramAllocation,
      javaVersion: javaVersion,
      version: mcVersion,
      settings: {
        motd: motd,
        "max-players": maxPlayers,
        gamemode: gameMode.toLowerCase(),
        difficulty: difficulty.toLowerCase(),
        pvp: String(pvp),
        "allow-flight": String(allowFlight),
        "enable-command-block": String(commandBlocks),
        hardcore: String(hardcore),
        "view-distance": viewDistance,
        "simulation-distance": simDistance,
        "spawn-protection": spawnProtection,
        "white-list": String(whitelist),
        "enforce-whitelist": String(enforceWhitelist),
        "online-mode": String(onlineMode),
      },
    });
    addLog(id, `[SYSTEM] Properties saved. Uptime limits and limits updated.`);
    toast.success("Settings saved successfully");
  };

  const handleDeleteServer = () => {
    deleteMutation.mutate({ id, name: confirmName }, {
      onSuccess: () => {
        deleteServer(id);
        setIsDeleteDialogOpen(false);
        setConfirmName("");
        router.push("/servers");
        toast.success("Server deleted successfully");
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || err.message || "Failed to delete server");
      },
    });
  };

  return (
    <div className="h-auto animate-in space-y-6 pr-1 duration-300 fade-in lg:h-full lg:overflow-y-auto">
      {/* Header with Save Actions */}
      <div className="sticky top-0 z-20 flex flex-col items-start justify-between gap-4 border-b border-border bg-background/95 backdrop-blur-md pb-4 pt-1 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Server Settings</h2>
          <p className="text-xs text-muted-foreground">Configure your Minecraft server properties</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push(`/server/${id}/files?edit=server.properties`)}
            className="h-9 flex-1 cursor-pointer gap-1.5 border-border text-xs sm:flex-none"
          >
            <FileCode className="h-4 w-4" /> Open server.properties
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSaveProperties}
            disabled={!hasChanges}
            className={`h-9 flex-1 gap-1.5 text-xs font-semibold sm:flex-none ${hasChanges ? "cursor-pointer" : "cursor-not-allowed opacity-60"
              }`}
          >
            <CheckCircle2 className="h-4 w-4" /> Save Changes
          </Button>
        </div>
      </div>

      {/* Layout Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gameplay Configurations */}
        <Card className="flex flex-col justify-between space-y-4 border border-border bg-card/65 p-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border/40 pb-2">
              <div className="rounded-lg bg-secondary p-1.5 text-primary">
                <Gamepad2 className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-wide">Gameplay</h3>
                <p className="font-mono text-[10px] text-muted-foreground">General gameplay settings</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Game Mode */}
              <div className="space-y-1.5">
                <span className="flex items-center gap-1 font-mono font-semibold text-muted-foreground">
                  Game Mode
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 cursor-help text-muted-foreground/60" />
                    </TooltipTrigger>
                    <TooltipContent>The default game mode for joining players.</TooltipContent>
                  </Tooltip>
                </span>
                <Select value={gameMode} onValueChange={setGameMode}>
                  <SelectTrigger className="cursor-pointer w-full">
                    <SelectValue placeholder="Select Game Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Survival" className="cursor-pointer">
                      Survival
                    </SelectItem>
                    <SelectItem value="Creative" className="cursor-pointer">
                      Creative
                    </SelectItem>
                    <SelectItem value="Adventure" className="cursor-pointer">
                      Adventure
                    </SelectItem>
                    <SelectItem value="Spectator" className="cursor-pointer">
                      Spectator
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty */}
              <div className="space-y-1.5">
                <span className="flex items-center gap-1 font-mono font-semibold text-muted-foreground">
                  Difficulty
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 cursor-help text-muted-foreground/60" />
                    </TooltipTrigger>
                    <TooltipContent>The general difficulty level of the server.</TooltipContent>
                  </Tooltip>
                </span>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="cursor-pointer w-full">
                    <SelectValue placeholder="Select Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Peaceful" className="cursor-pointer">
                      Peaceful
                    </SelectItem>
                    <SelectItem value="Easy" className="cursor-pointer">
                      Easy
                    </SelectItem>
                    <SelectItem value="Normal" className="cursor-pointer">
                      Normal
                    </SelectItem>
                    <SelectItem value="Hard" className="cursor-pointer">
                      Hard
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Server MOTD Message */}
              <div className="space-y-1.5">
                <span className="flex items-center gap-1 font-mono font-semibold text-muted-foreground">
                  Server Message (MOTD)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 cursor-help text-muted-foreground/60" />
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
                  <label htmlFor="pvp" className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-foreground/80">
                    Enable PVP
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground/60" />
                      </TooltipTrigger>
                      <TooltipContent>Allows players to damage each other.</TooltipContent>
                    </Tooltip>
                  </label>
                </div>

                {/* Allow Flight */}
                <div className="flex items-center space-x-2">
                  <Checkbox id="flight" checked={allowFlight} onCheckedChange={(val) => setAllowFlight(!!val)} />
                  <label htmlFor="flight" className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-foreground/80">
                    Allow Flying
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground/60" />
                      </TooltipTrigger>
                      <TooltipContent>Prevents kick-back warnings when flying in Survival.</TooltipContent>
                    </Tooltip>
                  </label>
                </div>

                {/* Command Blocks */}
                <div className="flex items-center space-x-2">
                  <Checkbox id="cmdblocks" checked={commandBlocks} onCheckedChange={(val) => setCommandBlocks(!!val)} />
                  <label htmlFor="cmdblocks" className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-foreground/80">
                    Enable Command Blocks
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground/60" />
                      </TooltipTrigger>
                      <TooltipContent>Allows command blocks to execute functions.</TooltipContent>
                    </Tooltip>
                  </label>
                </div>

                {/* Hardcore Mode */}
                <div className="flex items-center space-x-2">
                  <Checkbox id="hardcore" checked={hardcore} onCheckedChange={(val) => setHardcore(!!val)} />
                  <label htmlFor="hardcore" className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-foreground/80">
                    Hardcore Mode
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground/60" />
                      </TooltipTrigger>
                      <TooltipContent>Locks difficulty to Hard and enables permadeath.</TooltipContent>
                    </Tooltip>
                  </label>
                </div>

                {/* SquidServers content */}
                <div className="flex items-center space-x-2">
                  <Checkbox id="squid" checked={squidServers} onCheckedChange={(val) => setSquidServers(!!val)} />
                  <label htmlFor="squid" className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-foreground/80">
                    SquidServers content
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground/60" />
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
        <Card className="flex flex-col justify-between space-y-4 border border-border bg-card/65 p-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border/40 pb-2">
              <div className="rounded-lg bg-secondary p-1.5 text-primary">
                <Gauge className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-wide">Performance</h3>
                <p className="font-mono text-[10px] text-muted-foreground">Optimize your server&apos;s performance</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Max Players */}
              <div className="space-y-1.5">
                <span className="flex items-center gap-1 font-mono font-semibold text-muted-foreground">
                  Max Players
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 cursor-help text-muted-foreground/60" />
                    </TooltipTrigger>
                    <TooltipContent>Limits concurrent player count capacity.</TooltipContent>
                  </Tooltip>
                </span>
                <Input type="number" value={maxPlayers} onChange={(e) => setMaxPlayers(e.target.value)} />
              </div>

              {/* View Distance */}
              <div className="space-y-1.5">
                <span className="flex items-center gap-1 font-mono font-semibold text-muted-foreground">
                  View Distance
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 cursor-help text-muted-foreground/60" />
                    </TooltipTrigger>
                    <TooltipContent>Radius of chunks sent to the client (4-32).</TooltipContent>
                  </Tooltip>
                </span>
                <Input type="number" value={viewDistance} onChange={(e) => setViewDistance(e.target.value)} />
              </div>

              {/* Simulation Distance */}
              <div className="space-y-1.5">
                <span className="flex items-center gap-1 font-mono font-semibold text-muted-foreground">
                  Simulation Distance
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 cursor-help text-muted-foreground/60" />
                    </TooltipTrigger>
                    <TooltipContent>Radius of chunks loaded around the player to update entities.</TooltipContent>
                  </Tooltip>
                </span>
                <Input type="number" value={simDistance} onChange={(e) => setSimDistance(e.target.value)} />
              </div>

              {/* RAM Allocation Input */}
              <div className="space-y-1.5">
                <span className="flex items-center gap-1 font-mono font-semibold text-muted-foreground">
                  RAM Allocation (MB)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 cursor-help text-muted-foreground/60" />
                    </TooltipTrigger>
                    <TooltipContent>Dedicated RAM limitation allocated to the JVM.</TooltipContent>
                  </Tooltip>
                </span>
                <Input type="number" value={ramAllocation} onChange={(e) => setRamAllocation(Number(e.target.value) || 512)} />
              </div>

              {/* RAM Slider */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between font-mono text-[11px] font-semibold text-muted-foreground">
                  <span>Memory Slider</span>
                  <span className="text-foreground">{ramAllocation} MB</span>
                </div>
                <Slider value={[ramAllocation]} onValueChange={(val) => setRamAllocation(val[0])} min={512} max={15761} step={256} />
                <div className="flex justify-between font-mono text-[10px] text-muted-foreground/75">
                  <span>512 MB</span>
                  <span>15761 MB</span>
                </div>
              </div>

              {/* Warning Low RAM banner */}
              {ramAllocation < 2048 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 leading-normal text-amber-500">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <span className="block text-[11px] font-bold">Very Low RAM</span>
                    <span className="block text-[10px]">Below minimum (2 GB). Server performance will be poor.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Security Configurations */}
        <Card className="flex flex-col justify-between space-y-4 border border-border bg-card/65 p-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border/40 pb-2">
              <div className="rounded-lg bg-secondary p-1.5 text-primary">
                <Lock className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-wide">Security</h3>
                <p className="font-mono text-[10px] text-muted-foreground">Access control and security settings</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">

              {/* Spawn Protection */}
              <div className="space-y-1.5">
                <span className="flex items-center gap-1 font-mono font-semibold text-muted-foreground">
                  Spawn Protection Radius
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 cursor-help text-muted-foreground/60" />
                    </TooltipTrigger>
                    <TooltipContent>Radius of spawn region protected from non-OP players.</TooltipContent>
                  </Tooltip>
                </span>
                <Input type="number" value={spawnProtection} onChange={(e) => setSpawnProtection(e.target.value)} />
              </div>

              {/* Enable Whitelist */}
              <div className="flex items-center space-x-2">
                <Checkbox id="whitelist" checked={whitelist} onCheckedChange={(val) => setWhitelist(val === true)} />
                <label htmlFor="whitelist" className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-foreground/80">
                  Enable Whitelist
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground/60" />
                    </TooltipTrigger>
                    <TooltipContent>Restricts joining to users on the whitelist.</TooltipContent>
                  </Tooltip>
                </label>
              </div>

              {/* Enforce Whitelist */}
              <div className="flex items-center space-x-2">
                <Checkbox id="enforce" checked={enforceWhitelist} onCheckedChange={(val) => setEnforceWhitelist(val === true)} />
                <label htmlFor="enforce" className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-foreground/80">
                  Enforce Whitelist
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground/60" />
                    </TooltipTrigger>
                    <TooltipContent>Kicks whitelisted users instantly if Whitelists are disabled.</TooltipContent>
                  </Tooltip>
                </label>
              </div>

              {/* Online Mode */}
              <div className="flex items-center space-x-2">
                <Checkbox id="online" checked={onlineMode} onCheckedChange={(val) => setOnlineMode(val === true)} />
                <label htmlFor="online" className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-foreground/80">
                  Online Mode (Require Login)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground/60" />
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
          <Card className="flex flex-col justify-between space-y-4 border border-border bg-card/65 p-5">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 border-b border-border/40 pb-2">
                <div className="rounded-lg bg-secondary p-1.5 text-primary">
                  <Cpu className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide">Startup & JVM</h3>
                  <p className="font-mono text-[10px] text-muted-foreground">Control startup behavior and advanced JVM options</p>
                </div>
              </div>

              <div className="space-y-4 font-mono text-xs">
                {/* Java Version Dropdown */}
                <div className="space-y-1.5">
                  <span className="flex items-center gap-1 font-semibold text-muted-foreground">
                    Java Executable
                    {mcVersion && (
                      <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary normal-case">
                        Recommended: {javaLabel(recommendedJava(mcVersion))}
                      </span>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 cursor-help text-muted-foreground/60" />
                      </TooltipTrigger>
                      <TooltipContent>Java VM runtime used to execute the Jar platform.</TooltipContent>
                    </Tooltip>
                  </span>
                  <Select value={javaVersion} onValueChange={setJavaVersion} disabled={javaLocked}>
                    <SelectTrigger className={cn("cursor-pointer w-full", javaLocked && "opacity-60 cursor-not-allowed")}>
                      <SelectValue placeholder="Java Runtime" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="21" disabled={javaLocked} className="cursor-pointer">
                        Java 21 (Paper Standard)
                      </SelectItem>
                      <SelectItem value="17" disabled={javaLocked} className="cursor-pointer">
                        Java 17 (Legacy Support)
                      </SelectItem>
                      <SelectItem value="25" className="cursor-pointer">
                        Java 25 (Latest)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {javaLocked && (
                    <p className="text-[11px] text-amber-500 font-sans mt-1">
                      ⚠ Java 25 is required for Minecraft {mcVersion}+ and cannot be changed.
                    </p>
                  )}
                </div>


                {/* Nogui Checkbox */}
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox id="nogui" checked={useNogui} onCheckedChange={(val) => setUseNogui(val === true)} />
                  <label htmlFor="nogui" className="flex cursor-pointer items-center gap-1 font-sans text-xs font-semibold text-foreground/80">
                    Use nogui on startup
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground/60" />
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
                        <HelpCircle className="h-3.5 w-3.5 cursor-help text-muted-foreground/60" />
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
          <Card className="overflow-visible space-y-4 border border-border bg-card/65 p-5">
            <div className="flex items-center gap-2.5 border-b border-border/40 pb-2">
              <div className="rounded-lg bg-secondary p-1.5 text-primary">
                <Settings2 className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-wide">Server Version</h3>
                <p className="font-mono text-[10px] text-muted-foreground">Update the Minecraft version for this server</p>
              </div>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <span className="flex items-center gap-1 font-semibold text-muted-foreground">
                Select New Version
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 cursor-help text-muted-foreground/60" />
                  </TooltipTrigger>
                  <TooltipContent>Updates the target Minecraft installation version.</TooltipContent>
                </Tooltip>
              </span>
              <VersionPicker
                versions={versionsList}
                value={mcVersion}
                onChange={(v) => {
                  setMcVersion(v);
                  setJavaVersion(recommendedJava(v));
                }}
                isLoading={versionsLoading}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Permanent Delete Section */}
      <Card className="mt-6 space-y-4 border border-red-500/20 bg-red-500/5 p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-red-500">
              <Trash2 className="h-4.5 w-4.5" /> Delete Server
            </h3>
            <p className="text-xs text-muted-foreground">Permanently delete this server and all its files</p>
          </div>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} className="cursor-pointer bg-red-600 text-xs font-semibold text-white hover:bg-red-700">
            <Trash2 className="mr-1 h-4 w-4" /> Delete Server
          </Button>
        </div>

        <div className="py-1 font-mono text-xs font-semibold">
          Server: <span className="text-foreground">{server.name}</span>
        </div>

        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs font-semibold text-red-400">
          Warning: This action cannot be undone. All server files, configurations, worlds, and associated tunnels will be permanently deleted.
        </div>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open);
        if (!open) setConfirmName("");
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              This action <strong>cannot</strong> be undone. This will permanently delete the server <strong>{server.name}</strong>, all its files, worlds, configs, and metrics.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 mt-2">
            <label className="text-xs font-semibold text-muted-foreground block">
              Please type <span className="font-mono text-foreground font-bold">{server.name}</span> to confirm.
            </label>
            <Input
              placeholder="Type server name"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className="font-mono text-sm"
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteServer}
              disabled={confirmName !== server.name || deleteMutation.isPending}
              className={cn(
                "bg-red-600 text-white hover:bg-red-700 font-semibold cursor-pointer",
                (confirmName !== server.name || deleteMutation.isPending) && "opacity-50 cursor-not-allowed"
              )}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Server"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
