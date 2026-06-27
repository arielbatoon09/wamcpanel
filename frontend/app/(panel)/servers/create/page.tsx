"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Search,
  Terminal,
  Cpu,
  Database,
  HardDrive,
  Globe,
  Rocket,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useForm, useStore } from "@tanstack/react-form";
import { useCreateServer, useMinecraftVersions } from "@/services/server-service";
import { serverCreateSchema } from "@/lib/schemas/serverSchema";
import { toast } from "sonner";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────
// Software catalogue
// ─────────────────────────────────────────────────────────────────
type SoftwareKey = "Paper" | "Vanilla" | "Fabric" | "Forge" | "NeoForge" | "Bedrock" | "Velocity";

const SOFTWARE_CATALOGUE: {
  key: SoftwareKey;
  label: string;
  description: string;
  icon: string | null;
  tag?: string;
  defaultPort?: number;
}[] = [
    { key: "Paper", label: "Paper", description: "Vanilla but better — huge plugin ecosystem & optimisation.", icon: "/icons/paper.webp", tag: "Recommended" },
    { key: "Vanilla", label: "Vanilla", description: "Pure Minecraft from Mojang — no plugins or mods.", icon: "/icons/vanilla.webp" },
    { key: "Fabric", label: "Fabric", description: "Lightweight, fast-updating modding platform.", icon: "/icons/fabric.webp" },
    { key: "Forge", label: "Forge", description: "The classic, most popular option for mods.", icon: "/icons/forge.webp" },
    { key: "NeoForge", label: "NeoForge", description: "A community fork of Forge with active development.", icon: "/icons/neoforge.webp" },
    { key: "Bedrock", label: "Bedrock", description: "Official Bedrock edition — supports PE/Console players.", icon: "/icons/bedrock.webp" },
    { key: "Velocity", label: "Velocity", description: "High-performance proxy for routing between servers.", icon: "/icons/velocity.png", defaultPort: 25577 },
  ];

// ─────────────────────────────────────────────────────────────────
// Java version recommendation
// ─────────────────────────────────────────────────────────────────
import {
  VersionPicker,
  recommendedJava,
  isJavaLocked,
  javaLabel,
} from "@/components/features/settings/version-picker";

// ─────────────────────────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  const labels = ["Server Details", "Server Type", "Resources"];
  return (
    <div className="flex items-center gap-0">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                  done && "bg-primary text-primary-foreground",
                  active && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  !done && !active && "bg-muted text-muted-foreground"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : step}
              </div>
              <span className={cn("text-[10px] font-semibold tracking-wide", active ? "text-primary" : "text-muted-foreground")}>
                {labels[i]}
              </span>
            </div>
            {step < total && (
              <div className={cn("mx-3 mb-4 h-px w-16 transition-colors duration-300", done ? "bg-primary" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main wizard page
// ─────────────────────────────────────────────────────────────────
export default function CreateServerPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const createMutation = useCreateServer();
  const { data: versionsList = [], isLoading: versionsLoading } = useMinecraftVersions();

  const form = useForm({
    defaultValues: {
      name: "",
      description: "A Minecraft Server",
      software: "Paper" as SoftwareKey,
      version: "",
      port: 25565,
      ramLimit: 4096,
      cpuLimit: 200,
      host: "localhost",
      javaVersion: "21" as "17" | "21" | "25",
      worldSeed: "",
      worldType: "DEFAULT" as "DEFAULT" | "FLAT" | "LARGE_BIOMES" | "AMPLIFIED",
      generateStructures: true,
    },
    validators: { onSubmit: serverCreateSchema },
    onSubmit: async ({ value }) => {
      createMutation.mutate(value, {
        onSuccess: () => {
          form.reset();
          toast.success("Server deployed successfully!");
          router.push("/servers");
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || err.message || "Failed to create server");
        },
      });
    },
  });

  const watchedSoftware = useStore(form.store, (s) => s.values.software);
  const watchedVersion = useStore(form.store, (s) => s.values.version);
  const watchedName = useStore(form.store, (s) => s.values.name);
  const watchedPort = useStore(form.store, (s) => s.values.port);
  const watchedRam = useStore(form.store, (s) => s.values.ramLimit);
  const watchedCpu = useStore(form.store, (s) => s.values.cpuLimit);
  const watchedJava = useStore(form.store, (s) => s.values.javaVersion);
  const watchedHost = useStore(form.store, (s) => s.values.host);

  const isVelocity = watchedSoftware === "Velocity";
  const softwareMeta = SOFTWARE_CATALOGUE.find((s) => s.key === watchedSoftware);

  // Auto-set port + resources when software changes
  useEffect(() => {
    if (watchedSoftware === "Velocity") {
      form.setFieldValue("port", 25577);
      form.setFieldValue("ramLimit", 2048);
      form.setFieldValue("cpuLimit", 100);
    } else {
      form.setFieldValue("port", 25565);
      form.setFieldValue("ramLimit", 4096);
      form.setFieldValue("cpuLimit", 200);
    }
  }, [watchedSoftware]);

  // Auto-set Java when version changes
  useEffect(() => {
    if (watchedVersion) {
      form.setFieldValue("javaVersion", recommendedJava(watchedVersion));
    }
  }, [watchedVersion]);

  // Auto-select first version when list loads
  useEffect(() => {
    if (versionsList.length > 0 && !watchedVersion) {
      form.setFieldValue("version", versionsList[0]);
    }
  }, [versionsList]);

  // Step 1 validation: name ≥ 3, host non-empty
  const step1Valid = watchedName.trim().length >= 3 && watchedHost.trim().length >= 3;
  // Step 2 validation: software + version selected
  const step2Valid = !!watchedSoftware && (isVelocity || !!watchedVersion);

  const javaLocked = watchedVersion ? isJavaLocked(watchedVersion) : false;

  // ─────────────────────── render ───────────────────────────────
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-12">
      <div className="flex justify-center">
        <StepIndicator current={step} total={3} />
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card/65 p-4 backdrop-blur-md">
        <Link href="/servers">
          <Button variant="outline" size="icon" className="h-9 w-9 cursor-pointer rounded-xl border-border/80">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="space-y-3">
          <h1 className="text-2xl font-medium tracking-tight">Deploy New Server</h1>
          <p className="text-xs text-muted-foreground">Configure and launch a new Minecraft server instance.</p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
        {/* ──────────── STEP 1 — Server Details ──────────── */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 space-y-6 duration-300">
            <div className="rounded-xl border border-border/80 bg-card/65 p-6 backdrop-blur-md">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold">Server Identity</h2>
                  <p className="text-xs text-muted-foreground">Name and describe your new server.</p>
                </div>
              </div>

              <div className="space-y-4">
                <form.Field name="name">
                  {(field) => (
                    <div className="space-y-3">
                      <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Server Name <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="name"
                        placeholder="Survival Realm"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        className="h-10"
                      />
                      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                        <p className="text-xs text-destructive">{field.state.meta.errors[0]?.toString()}</p>
                      )}
                    </div>
                  )}
                </form.Field>

                <form.Field name="description">
                  {(field) => (
                    <div className="space-y-3">
                      <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Description</label>
                      <Input
                        id="description"
                        placeholder="Brief overview of the server purpose..."
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        className="h-10"
                      />
                    </div>
                  )}
                </form.Field>

                <div className="grid grid-cols-2 gap-4">
                  <form.Field name="host">
                    {(field) => (
                      <div className="space-y-3">
                        <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                          Host / IP <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="host"
                          placeholder="localhost"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          className="h-10 font-mono"
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="port">
                    {(field) => (
                      <div className="space-y-3">
                        <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Port</label>
                        <Input
                          id="port"
                          type="number"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(Number(e.target.value))}
                          onBlur={field.handleBlur}
                          className="h-10 font-mono"
                        />
                        {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                          <p className="text-xs text-destructive">{field.state.meta.errors[0]?.toString()}</p>
                        )}
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>
            </div>

            {/* Step 1 nav */}
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={!step1Valid}
                className="h-10 cursor-pointer gap-2 px-6 font-semibold"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ──────────── STEP 2 — Server Type ──────────── */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 space-y-6 duration-300">
            {/* Software picker */}
            <div className="rounded-xl border border-border/80 bg-card/65 p-6 backdrop-blur-md">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Terminal className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold">Choose Server Type</h2>
                  <p className="text-xs text-muted-foreground">Select the software platform that runs your server.</p>
                </div>
              </div>

              {/* Recommended */}
              <p className="mb-2 text-[11px] font-bold tracking-wider text-primary uppercase">⭐ Recommended</p>
              <div className="mb-5 grid grid-cols-1 gap-2">
                {SOFTWARE_CATALOGUE.filter((s) => s.tag === "Recommended").map((sw) => (
                  <SoftwareCard key={sw.key} sw={sw} selected={watchedSoftware === sw.key} onSelect={() => form.setFieldValue("software", sw.key)} />
                ))}
              </div>

              {/* Proxy */}
              <p className="mb-2 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Proxy</p>
              <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SOFTWARE_CATALOGUE.filter((s) => s.key === "Velocity").map((sw) => (
                  <SoftwareCard key={sw.key} sw={sw} selected={watchedSoftware === sw.key} onSelect={() => form.setFieldValue("software", sw.key)} />
                ))}
              </div>

              {/* Other */}
              <p className="mb-2 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Other Server Types</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SOFTWARE_CATALOGUE.filter((s) => !s.tag && s.key !== "Velocity").map((sw) => (
                  <SoftwareCard key={sw.key} sw={sw} selected={watchedSoftware === sw.key} onSelect={() => form.setFieldValue("software", sw.key)} />
                ))}
              </div>
            </div>

            {/* Version + Java */}
            {!isVelocity && (
              <div className="rounded-xl border border-border/80 bg-card/65 p-6 backdrop-blur-md">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold">Minecraft Version</h2>
                    <p className="text-xs text-muted-foreground">Pick the version and Java runtime for your server.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Game Version</label>
                    <VersionPicker
                      versions={versionsList}
                      value={watchedVersion}
                      onChange={(v) => form.setFieldValue("version", v)}
                      isLoading={versionsLoading}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Java Runtime
                      {watchedVersion && (
                        <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary normal-case">
                          Recommended: {javaLabel(recommendedJava(watchedVersion))}
                        </span>
                      )}
                    </label>
                    <Select
                      value={watchedJava}
                      onValueChange={(v) => form.setFieldValue("javaVersion", v as "17" | "21" | "25")}
                      disabled={javaLocked}
                    >
                      <SelectTrigger className={cn("h-10 cursor-pointer", javaLocked && "opacity-60 cursor-not-allowed")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="17" disabled={javaLocked} className="cursor-pointer">
                          Java 17 — Legacy (≤ 1.20.4)
                        </SelectItem>
                        <SelectItem value="21" disabled={javaLocked} className="cursor-pointer">
                          Java 21 — Standard (1.20.5–1.25.x)
                        </SelectItem>
                        <SelectItem value="25" className="cursor-pointer">
                          Java 25 — Latest (≥ 1.26.x)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {javaLocked && (
                      <p className="text-[11px] text-amber-500">
                        ⚠ Java 25 is required for Minecraft {watchedVersion}+ and cannot be changed.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 nav */}
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-10 cursor-pointer gap-2 px-6">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button type="button" onClick={() => setStep(3)} disabled={!step2Valid} className="h-10 cursor-pointer gap-2 px-6 font-semibold">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ──────────── STEP 3 — Resources ──────────── */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 space-y-6 duration-300">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              {/* Left — settings */}
              <div className="space-y-5 lg:col-span-3">
                {/* Resources */}
                <div className="rounded-xl border border-border/80 bg-card/65 p-6 backdrop-blur-md">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold">Resources & Limits</h2>
                      <p className="text-xs text-muted-foreground">Allocate CPU and RAM for this server.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <form.Field name="ramLimit">
                      {(field) => (
                        <div className="space-y-3">
                          <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">RAM (MB)</label>
                          <Input type="number" value={field.state.value} onChange={(e) => field.handleChange(Number(e.target.value))} className="h-10 font-mono" />
                          {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                            <p className="text-xs text-destructive">{field.state.meta.errors[0]?.toString()}</p>
                          )}
                        </div>
                      )}
                    </form.Field>

                    <form.Field name="cpuLimit">
                      {(field) => (
                        <div className="space-y-3">
                          <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">CPU (%)</label>
                          <Input type="number" value={field.state.value} onChange={(e) => field.handleChange(Number(e.target.value))} className="h-10 font-mono" />
                          {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                            <p className="text-xs text-destructive">{field.state.meta.errors[0]?.toString()}</p>
                          )}
                        </div>
                      )}
                    </form.Field>
                  </div>
                </div>

                {/* World settings — only non-Velocity */}
                {!isVelocity && (
                  <div className="rounded-xl border border-border/80 bg-card/65 p-6 backdrop-blur-md">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                        <Globe className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold">World Settings</h2>
                        <p className="text-xs text-muted-foreground">Optional world generation parameters.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <form.Field name="worldSeed">
                        {(field) => (
                          <div className="col-span-full space-y-3">
                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">World Seed (optional)</label>
                            <Input placeholder="Leave blank for random…" value={field.state.value ?? ""} onChange={(e) => field.handleChange(e.target.value)} className="h-10 font-mono" />
                          </div>
                        )}
                      </form.Field>

                      <form.Field name="worldType">
                        {(field) => (
                          <div className="space-y-3">
                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">World Type</label>
                            <Select value={field.state.value} onValueChange={(v: any) => field.handleChange(v)}>
                              <SelectTrigger className="h-10 w-full cursor-pointer"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DEFAULT" className="cursor-pointer">Standard (Default)</SelectItem>
                                <SelectItem value="FLAT" className="cursor-pointer">Superflat</SelectItem>
                                <SelectItem value="LARGE_BIOMES" className="cursor-pointer">Large Biomes</SelectItem>
                                <SelectItem value="AMPLIFIED" className="cursor-pointer">Amplified</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </form.Field>

                      <form.Field name="generateStructures">
                        {(field) => (
                          <div className="space-y-3">
                            <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Structures</label>
                            <Select value={field.state.value ? "true" : "false"} onValueChange={(v) => field.handleChange(v === "true")}>
                              <SelectTrigger className="h-10 w-full cursor-pointer"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true" className="cursor-pointer">Enabled</SelectItem>
                                <SelectItem value="false" className="cursor-pointer">Disabled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </form.Field>
                    </div>
                  </div>
                )}
              </div>

              {/* Right — deployment summary */}
              <div className="lg:col-span-2">
                <div className="sticky top-6">
                  <div className="overflow-hidden rounded-xl border border-border/80 bg-card/65 backdrop-blur-md">
                    <div className="h-1.5 bg-gradient-to-r from-primary via-violet-500 to-indigo-500" />
                    <div className="p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <Rocket className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-bold">Deployment Summary</h3>
                      </div>

                      <div className="space-y-3">
                        <SummaryRow icon={<Terminal className="h-4 w-4 text-primary" />} label="Platform" value={`${watchedSoftware}${watchedVersion ? ` ${watchedVersion}` : ""}`} />
                        <SummaryRow icon={<Database className="h-4 w-4 text-indigo-500" />} label="Memory" value={`${watchedRam} MB (${(watchedRam / 1024).toFixed(1)} GB)`} />
                        <SummaryRow icon={<Cpu className="h-4 w-4 text-emerald-500" />} label="CPU" value={`${(watchedCpu / 100).toFixed(1)} Cores (${watchedCpu}%)`} />
                        <SummaryRow icon={<HardDrive className="h-4 w-4 text-amber-500" />} label="Port" value={`:${watchedPort}`} />
                        {!isVelocity && watchedJava && (
                          <SummaryRow icon={<Globe className="h-4 w-4 text-rose-500" />} label="Java" value={javaLabel(watchedJava)} />
                        )}
                      </div>

                      <div className="mt-4 border-t border-border pt-4">
                        <p className="mb-3 text-xs text-muted-foreground">
                          Deploying{" "}
                          <span className="font-bold text-foreground">{watchedName || "Unnamed Server"}</span> — container
                          will be created and allocated from host resources.
                        </p>
                        <Button
                          type="submit"
                          className="h-10 w-full cursor-pointer gap-2 font-bold"
                          disabled={createMutation.isPending}
                        >
                          {createMutation.isPending ? (
                            <>
                              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Deploying…
                            </>
                          ) : (
                            <>
                              <Rocket className="h-4 w-4" /> Deploy Server
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 nav */}
            <div className="flex justify-start">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="h-10 cursor-pointer gap-2 px-6">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────
function SoftwareCard({
  sw,
  selected,
  onSelect,
}: {
  sw: (typeof SOFTWARE_CATALOGUE)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all duration-150",
        selected
          ? "border-primary/60 bg-primary/8 ring-2 ring-primary/20"
          : "border-border bg-card/40 hover:border-border/80 hover:bg-muted/30"
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background">
        {sw.icon ? (
          <Image src={sw.icon} alt={sw.label} width={28} height={28} className="rounded object-contain" />
        ) : (
          <Terminal className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">{sw.label}</span>
          {sw.tag && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">{sw.tag}</span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{sw.description}</p>
      </div>
      <div className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
        selected ? "border-primary bg-primary" : "border-border"
      )}>
        {selected && <Check className="h-3 w-3 text-primary-foreground" />}
      </div>
    </button>
  );
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2">
      {icon}
      <div className="min-w-0 flex-1">
        <span className="block text-[10px] text-muted-foreground">{label}</span>
        <span className="block truncate font-mono text-xs font-bold">{value}</span>
      </div>
    </div>
  );
}
