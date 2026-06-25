"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Terminal, Cpu, Database, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { serverCreateSchema } from "@/lib/schemas/serverSchema";
import { useForm, useStore } from "@tanstack/react-form";
import { useCreateServer, useMinecraftVersions, usePaperBuilds } from "@/services/server-service";
import { toast } from "sonner";
import Link from "next/link";

export default function CreateServerPage() {
  const router = useRouter();
  const createMutation = useCreateServer();
  const { data: versionsList, isLoading: versionsLoading } = useMinecraftVersions();

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      software: "Paper" as "Vanilla" | "Paper" | "Modpack" | "Fabric" | "Bedrock" | "Forge" | "NeoForge" | "Quilt" | "Velocity",
      version: "1.20.4",
      buildNumber: "",
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
          toast.success("Server created successfully!");
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

  const { data: buildsList, isLoading: buildsLoading } = usePaperBuilds(watchedVersion);

  // Auto-update resource defaults when software changes
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
  }, [watchedSoftware, form]);

  const isVelocity = watchedSoftware === "Velocity";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild className="h-8 w-8">
              <Link href="/servers">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-extrabold tracking-tight">Deploy New Server</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground ml-10">Configure and deploy an isolated Minecraft server instance.</p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Main Config Cards */}
          <div className="space-y-6 lg:col-span-3">
            {/* Server Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">General Information</CardTitle>
                <CardDescription>Give your server a name and a description for your dashboard.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <form.Field
                  name="name"
                  children={(field) => (
                    <Field className="gap-3">
                      <FieldLabel htmlFor="name">Server Name</FieldLabel>
                      <Input id="name" placeholder="Survival Realm" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
                      {field.state.meta.errors && <FieldError>{field.state.meta.errors.join(", ")}</FieldError>}
                    </Field>
                  )}
                />
                <form.Field
                  name="description"
                  children={(field) => (
                    <Field className="gap-3">
                      <FieldLabel htmlFor="description">Description</FieldLabel>
                      <Input
                        id="description"
                        placeholder="Brief overview of the server purpose..."
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      {field.state.meta.errors && <FieldError>{field.state.meta.errors.join(", ")}</FieldError>}
                    </Field>
                  )}
                />
              </CardContent>
            </Card>

            {/* Core Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Software & Core Settings</CardTitle>
                <CardDescription>Choose the Minecraft platform, version, and runtime engine.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <form.Field
                  name="software"
                  children={(field) => (
                    <Field className="col-span-1 md:col-span-2 gap-3">
                      <FieldLabel htmlFor="software">Server Software / Type</FieldLabel>
                      <Select value={field.state.value} onValueChange={(val: any) => field.handleChange(val)}>
                        <SelectTrigger id="software" className="cursor-pointer">
                          <SelectValue placeholder="Select Software" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[250px] overflow-y-auto">
                          <SelectItem value="Paper" className="cursor-pointer">Paper (Plugin Platform)</SelectItem>
                          <SelectItem value="Vanilla" className="cursor-pointer">Vanilla Minecraft</SelectItem>
                          <SelectItem value="Fabric" className="cursor-pointer">Fabric Mod Loader</SelectItem>
                          <SelectItem value="Forge" className="cursor-pointer">Forge Mod Loader</SelectItem>
                          <SelectItem value="NeoForge" className="cursor-pointer">NeoForge Loader</SelectItem>
                          <SelectItem value="Quilt" className="cursor-pointer">Quilt Mod Loader</SelectItem>
                          <SelectItem value="Modpack" className="cursor-pointer">CurseForge / Custom Modpack</SelectItem>
                          <SelectItem value="Bedrock" className="cursor-pointer">Bedrock Edition (PE/Console)</SelectItem>
                          <SelectItem value="Velocity" className="cursor-pointer">Velocity Proxy Gateway</SelectItem>
                        </SelectContent>
                      </Select>
                      {field.state.meta.errors && <FieldError>{field.state.meta.errors.join(", ")}</FieldError>}
                    </Field>
                  )}
                />

                <form.Field
                  name="version"
                  children={(field) => (
                    <Field className="gap-3">
                      <FieldLabel htmlFor="version">Minecraft Version</FieldLabel>
                      <Select value={field.state.value} onValueChange={(val: any) => field.handleChange(val)}>
                        <SelectTrigger id="version" className="cursor-pointer">
                          <SelectValue placeholder="Select Version" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[250px] overflow-y-auto">
                          {versionsLoading ? (
                            <SelectItem value="loading" disabled>Loading versions...</SelectItem>
                          ) : (
                            versionsList?.map((v) => (
                              <SelectItem key={v} value={v} className="cursor-pointer">
                                {v}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {field.state.meta.errors && <FieldError>{field.state.meta.errors.join(", ")}</FieldError>}
                    </Field>
                  )}
                />

                {watchedSoftware === "Paper" ? (
                  <form.Field
                    name="buildNumber"
                    children={(field) => (
                      <Field className="gap-3">
                        <FieldLabel htmlFor="buildNumber">Build Number</FieldLabel>
                        <Select value={field.state.value ?? ""} onValueChange={(val: any) => field.handleChange(val)}>
                          <SelectTrigger id="buildNumber" className="cursor-pointer">
                            <SelectValue placeholder="Latest Stable" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[250px] overflow-y-auto">
                            {buildsLoading ? (
                              <SelectItem value="loading" disabled>Loading builds...</SelectItem>
                            ) : buildsList?.length ? (
                              buildsList.map((b) => (
                                <SelectItem key={b} value={String(b)} className="cursor-pointer">
                                  Build #{b}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>No builds found</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {field.state.meta.errors && <FieldError>{field.state.meta.errors.join(", ")}</FieldError>}
                      </Field>
                    )}
                  />
                ) : (
                  <form.Field
                    name="javaVersion"
                    children={(field) => (
                      <Field className="gap-3">
                        <FieldLabel htmlFor="javaVersion">Java Version</FieldLabel>
                        <Select value={field.state.value} onValueChange={(val: any) => field.handleChange(val)}>
                          <SelectTrigger id="javaVersion" className="cursor-pointer">
                            <SelectValue placeholder="Select Java" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[250px] overflow-y-auto">
                            <SelectItem value="17" className="cursor-pointer">Java 17 (1.18–1.20)</SelectItem>
                            <SelectItem value="21" className="cursor-pointer">Java 21 (1.20.5+)</SelectItem>
                            <SelectItem value="25" className="cursor-pointer">Java 25 (Experimental)</SelectItem>
                          </SelectContent>
                        </Select>
                        {field.state.meta.errors && <FieldError>{field.state.meta.errors.join(", ")}</FieldError>}
                      </Field>
                    )}
                  />
                )}

                {watchedSoftware === "Paper" && (
                  <form.Field
                    name="javaVersion"
                    children={(field) => (
                      <Field className="col-span-1 md:col-span-2 gap-3">
                        <FieldLabel htmlFor="javaVersion">Java Version</FieldLabel>
                        <Select value={field.state.value} onValueChange={(val: any) => field.handleChange(val)}>
                          <SelectTrigger id="javaVersion" className="cursor-pointer">
                            <SelectValue placeholder="Select Java" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[250px] overflow-y-auto">
                            <SelectItem value="17" className="cursor-pointer">Java 17 (1.18–1.20)</SelectItem>
                            <SelectItem value="21" className="cursor-pointer">Java 21 (1.20.5+)</SelectItem>
                            <SelectItem value="25" className="cursor-pointer">Java 25 (Experimental)</SelectItem>
                          </SelectContent>
                        </Select>
                        {field.state.meta.errors && <FieldError>{field.state.meta.errors.join(", ")}</FieldError>}
                      </Field>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* World Settings Card */}
            {!isVelocity && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">World Customization</CardTitle>
                  <CardDescription>Setup your seed generator parameters and world styles.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <form.Field
                    name="worldSeed"
                    children={(field) => (
                      <Field className="col-span-1 md:col-span-2 gap-3">
                        <FieldLabel htmlFor="worldSeed">World Seed (Optional)</FieldLabel>
                        <Input
                          id="worldSeed"
                          placeholder="Leave blank for random seed..."
                          value={field.state.value ?? ""}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                        />
                        {field.state.meta.errors && <FieldError>{field.state.meta.errors.join(", ")}</FieldError>}
                      </Field>
                    )}
                  />
                  <form.Field
                    name="worldType"
                    children={(field) => (
                      <Field className="gap-3">
                        <FieldLabel htmlFor="worldType">World Type</FieldLabel>
                        <Select value={field.state.value} onValueChange={(val: any) => field.handleChange(val)}>
                          <SelectTrigger id="worldType" className="cursor-pointer">
                            <SelectValue placeholder="Select Type" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[250px] overflow-y-auto">
                            <SelectItem value="DEFAULT" className="cursor-pointer">Standard (Default)</SelectItem>
                            <SelectItem value="FLAT" className="cursor-pointer">Superflat (Creative)</SelectItem>
                            <SelectItem value="LARGE_BIOMES" className="cursor-pointer">Large Biomes</SelectItem>
                            <SelectItem value="AMPLIFIED" className="cursor-pointer">Amplified (Mountains)</SelectItem>
                          </SelectContent>
                        </Select>
                        {field.state.meta.errors && <FieldError>{field.state.meta.errors.join(", ")}</FieldError>}
                      </Field>
                    )}
                  />
                  <form.Field
                    name="generateStructures"
                    children={(field) => (
                      <Field className="gap-3">
                        <FieldLabel htmlFor="generateStructures">Generate Structures</FieldLabel>
                        <Select value={field.state.value ? "true" : "false"} onValueChange={(val) => field.handleChange(val === "true")}>
                          <SelectTrigger id="generateStructures" className="cursor-pointer">
                            <SelectValue placeholder="Structures" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[250px] overflow-y-auto">
                            <SelectItem value="true" className="cursor-pointer">Enabled (Villages/Fortress)</SelectItem>
                            <SelectItem value="false" className="cursor-pointer">Disabled (Flat landscape)</SelectItem>
                          </SelectContent>
                        </Select>
                        {field.state.meta.errors && <FieldError>{field.state.meta.errors.join(", ")}</FieldError>}
                      </Field>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Resources Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resources & Limits</CardTitle>
                <CardDescription>Allocate CPU, RAM, and specify port binding configurations.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <form.Field
                  name="ramLimit"
                  children={(field) => (
                    <Field className="gap-3">
                      <FieldLabel htmlFor="ramLimit">Max RAM Allocation (MB)</FieldLabel>
                      <Input
                        id="ramLimit"
                        type="number"
                        placeholder={isVelocity ? "2048" : "4096"}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(Number(e.target.value))}
                        onBlur={field.handleBlur}
                      />
                      {field.state.meta.errors && <FieldError>{field.state.meta.errors.join(", ")}</FieldError>}
                    </Field>
                  )}
                />
                <form.Field
                  name="cpuLimit"
                  children={(field) => (
                    <Field className="gap-3">
                      <FieldLabel htmlFor="cpuLimit">CPU Core Limit (%)</FieldLabel>
                      <Input
                        id="cpuLimit"
                        type="number"
                        placeholder={isVelocity ? "100" : "200"}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(Number(e.target.value))}
                        onBlur={field.handleBlur}
                      />
                      {field.state.meta.errors && <FieldError>{field.state.meta.errors.join(", ")}</FieldError>}
                    </Field>
                  )}
                />
                <form.Field
                  name="port"
                  children={(field) => (
                    <Field className="col-span-1 md:col-span-2 gap-3">
                      <FieldLabel htmlFor="port">Port Binding</FieldLabel>
                      <Input
                        id="port"
                        type="number"
                        placeholder={isVelocity ? "25577" : "25565"}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(Number(e.target.value))}
                        onBlur={field.handleBlur}
                      />
                      {field.state.meta.errors && <FieldError>{field.state.meta.errors.join(", ")}</FieldError>}
                    </Field>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sticky Deployment Sidebar */}
          <div className="lg:col-span-2">
            <div className="sticky top-6 space-y-6">
              <Card className="overflow-hidden border-primary/20 bg-card/60 backdrop-blur-md">
                <div className="h-2 bg-gradient-to-r from-primary to-violet-500" />
                <CardHeader>
                  <CardTitle className="text-lg">Deployment Summary</CardTitle>
                  <CardDescription>Live stats of the target server configuration.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Summary Specs */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
                      <Terminal className="h-5 w-5 text-primary" />
                      <div>
                        <div className="text-xs text-muted-foreground">Software Platform</div>
                        <div className="font-mono text-sm font-bold">{watchedSoftware} ({watchedVersion})</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
                      <Database className="h-5 w-5 text-indigo-500" />
                      <div>
                        <div className="text-xs text-muted-foreground">Allocated Memory</div>
                        <div className="font-mono text-sm font-bold">{watchedRam} MB ({(watchedRam / 1024).toFixed(1)} GB)</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
                      <Cpu className="h-5 w-5 text-emerald-500" />
                      <div>
                        <div className="text-xs text-muted-foreground">CPU Core Limits</div>
                        <div className="font-mono text-sm font-bold">{(watchedCpu / 100).toFixed(1)} Cores ({watchedCpu}%)</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
                      <HardDrive className="h-5 w-5 text-amber-500" />
                      <div>
                        <div className="text-xs text-muted-foreground">Connection Port</div>
                        <div className="font-mono text-sm font-bold">:{watchedPort}</div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 space-y-4">
                    <div className="text-xs text-muted-foreground">
                      Deploying will register <span className="font-bold text-foreground">{watchedName || "Unnamed Server"}</span> and allocate host system containers.
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" asChild className="flex-1 cursor-pointer">
                        <Link href="/servers">Cancel</Link>
                      </Button>
                      <Button type="submit" className="flex-1 cursor-pointer gap-2" disabled={createMutation.isPending}>
                        {createMutation.isPending ? (
                          "Deploying..."
                        ) : (
                          <>
                            <span>Deploy</span>
                            <Check className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
