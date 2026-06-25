"use client";

import { useState, useEffect } from "react";
import { Plus, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { serverCreateSchema } from "@/lib/schemas/serverSchema";
import { useForm, useStore } from "@tanstack/react-form";
import { useCreateServer, useMinecraftVersions, usePaperBuilds } from "@/services/server-service";
import { toast } from "sonner";

const STEP_FIELDS: Record<number, string[]> = {
  1: ["name", "description"],
  2: ["software", "version", "javaVersion"],
  3: ["worldSeed", "worldType", "generateStructures"],
  4: ["ramLimit", "cpuLimit", "port"],
};

export function CreateServerDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);

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
          setOpen(false);
          setStep(1);
          toast.success("Server created successfully!");
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || err.message || "Failed to create server");
        },
      });
    },
  });

  const watchedSoftware = useStore(form.store, (s) => s.values.software);
  const watchedVersion = useStore(form.store, (s) => s.values.version);
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

  const handleNext = async () => {
    const fields = STEP_FIELDS[step] ?? [];
    let hasErrors = false;
    for (const f of fields) {
      const errs = await form.validateField(f as any, "submit");
      if (errs?.length) hasErrors = true;
    }
    if (hasErrors) {
      toast.error("Please fix validation errors before continuing.");
      return;
    }
    if (step === 2 && watchedSoftware === "Velocity") {
      setStep(4);
    } else {
      setStep((p) => Math.min(p + 1, 4));
    }
  };

  const handlePrev = () => {
    if (step === 4 && watchedSoftware === "Velocity") {
      setStep(2);
    } else {
      setStep((p) => Math.max(p - 1, 1));
    }
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setStep(1);
      form.reset();
    }
  };

  const isVelocity = watchedSoftware === "Velocity";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="ml-auto h-10 cursor-pointer gap-1.5 px-4 font-semibold shadow-xs md:ml-0">
          <Plus className="h-4 w-4" />
          Add Server
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Deploy New Server</DialogTitle>
          <DialogDescription>Complete the wizard steps to create and configure your server.</DialogDescription>
        </DialogHeader>

        {/* Stepper Progress Bar */}
        <div className="mb-6 flex items-center justify-between border-b border-border/40 pb-4 font-mono text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
          {[{ n: 1, label: "Info" }, { n: 2, label: "Core" }, ...(!isVelocity ? [{ n: 3, label: "World" }] : []), { n: 4, label: "Resources" }].map(({ n, label }, i, arr) => (
            <div key={n} className="flex items-center gap-1">
              {i > 0 && <div className="mx-1 h-[2px] w-6 flex-shrink-0 bg-border/40" />}
              <div className="flex items-center gap-1.5">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[9px] ${step >= n ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                  {n}
                </span>
                <span className={step >= n ? "text-foreground" : ""}>{label}</span>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          {/* STEP 1: GENERAL INFO */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <FieldGroup className="grid grid-cols-1 gap-4">
                <form.Field
                  name="name"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor="name">Server Name</FieldLabel>
                      <Input id="name" placeholder="Survival Realm" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
                      {field.state.meta.errors && <FieldError>{field.state.meta.errors.join(", ")}</FieldError>}
                    </Field>
                  )}
                />
                <form.Field
                  name="description"
                  children={(field) => (
                    <Field>
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
              </FieldGroup>
            </motion.div>
          )}

          {/* STEP 2: SOFTWARE & CORE */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <FieldGroup className="grid grid-cols-2 gap-4">
                {/* Software */}
                <form.Field
                  name="software"
                  children={(field) => (
                    <Field className="col-span-2">
                      <FieldLabel htmlFor="software">Server Software / Type</FieldLabel>
                      <Select value={field.state.value} onValueChange={(val: any) => field.handleChange(val)}>
                        <SelectTrigger id="software" className="cursor-pointer">
                          <SelectValue placeholder="Select Software" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Paper" className="cursor-pointer">
                            Paper (Plugin Platform)
                          </SelectItem>
                          <SelectItem value="Vanilla" className="cursor-pointer">
                            Vanilla Minecraft
                          </SelectItem>
                          <SelectItem value="Fabric" className="cursor-pointer">
                            Fabric Mod Loader
                          </SelectItem>
                          <SelectItem value="Forge" className="cursor-pointer">
                            Forge Mod Loader
                          </SelectItem>
                          <SelectItem value="NeoForge" className="cursor-pointer">
                            NeoForge Loader
                          </SelectItem>
                          <SelectItem value="Quilt" className="cursor-pointer">
                            Quilt Mod Loader
                          </SelectItem>
                          <SelectItem value="Modpack" className="cursor-pointer">
                            CurseForge / Custom Modpack
                          </SelectItem>
                          <SelectItem value="Bedrock" className="cursor-pointer">
                            Bedrock Edition (PE/Console)
                          </SelectItem>
                          <SelectItem value="Velocity" className="cursor-pointer">
                            Velocity Proxy Gateway
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {field.state.meta.errors && <FieldError>{field.state.meta.errors.join(", ")}</FieldError>}
                    </Field>
                  )}
                />

                {/* Minecraft Version */}
                <form.Field
                  name="version"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor="version">Minecraft Version</FieldLabel>
                      <Select value={field.state.value} onValueChange={(val: any) => field.handleChange(val)}>
                        <SelectTrigger id="version" className="cursor-pointer">
                          <SelectValue placeholder="Select Version" />
                        </SelectTrigger>
                        <SelectContent>
                          {versionsLoading ? (
                            <SelectItem value="loading" disabled>
                              Loading versions...
                            </SelectItem>
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

                {/* Build Number (Paper only) or Java Version */}
                {watchedSoftware === "Paper" ? (
                  <form.Field
                    name="buildNumber"
                    children={(field) => (
                      <Field>
                        <FieldLabel htmlFor="buildNumber">Build Number</FieldLabel>
                        <Select value={field.state.value ?? ""} onValueChange={(val: any) => field.handleChange(val)}>
                          <SelectTrigger id="buildNumber" className="cursor-pointer">
                            <SelectValue placeholder="Latest Stable" />
                          </SelectTrigger>
                          <SelectContent>
                            {buildsLoading ? (
                              <SelectItem value="loading" disabled>
                                Loading builds...
                              </SelectItem>
                            ) : buildsList?.length ? (
                              buildsList.map((b) => (
                                <SelectItem key={b} value={String(b)} className="cursor-pointer">
                                  Build #{b}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>
                                No builds found
                              </SelectItem>
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
                      <Field>
                        <FieldLabel htmlFor="javaVersion">Java Version</FieldLabel>
                        <Select value={field.state.value} onValueChange={(val: any) => field.handleChange(val)}>
                          <SelectTrigger id="javaVersion" className="cursor-pointer">
                            <SelectValue placeholder="Select Java" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="17" className="cursor-pointer">
                              Java 17 (1.18–1.20)
                            </SelectItem>
                            <SelectItem value="21" className="cursor-pointer">
                              Java 21 (1.20.5+)
                            </SelectItem>
                            <SelectItem value="25" className="cursor-pointer">
                              Java 25 (Experimental)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {field.state.meta.errors && <FieldError>{field.state.meta.errors.join(", ")}</FieldError>}
                      </Field>
                    )}
                  />
                )}

                {/* Extra Java Version row when Paper (needs buildNumber + javaVersion) */}
                {watchedSoftware === "Paper" && (
                  <form.Field
                    name="javaVersion"
                    children={(field) => (
                      <Field className="col-span-2">
                        <FieldLabel htmlFor="javaVersion">Java Version</FieldLabel>
                        <Select value={field.state.value} onValueChange={(val: any) => field.handleChange(val)}>
                          <SelectTrigger id="javaVersion" className="cursor-pointer">
                            <SelectValue placeholder="Select Java" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="17" className="cursor-pointer">
                              Java 17 (1.18–1.20)
                            </SelectItem>
                            <SelectItem value="21" className="cursor-pointer">
                              Java 21 (1.20.5+)
                            </SelectItem>
                            <SelectItem value="25" className="cursor-pointer">
                              Java 25 (Experimental)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {field.state.meta.errors && <FieldError>{field.state.meta.errors.join(", ")}</FieldError>}
                      </Field>
                    )}
                  />
                )}
              </FieldGroup>
            </motion.div>
          )}

          {/* STEP 3: WORLD CUSTOMIZATION */}
          {step === 3 && !isVelocity && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <FieldGroup className="grid grid-cols-2 gap-4">
                <form.Field
                  name="worldSeed"
                  children={(field) => (
                    <Field className="col-span-2">
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
                    <Field>
                      <FieldLabel htmlFor="worldType">World Type</FieldLabel>
                      <Select value={field.state.value} onValueChange={(val: any) => field.handleChange(val)}>
                        <SelectTrigger id="worldType" className="cursor-pointer">
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DEFAULT" className="cursor-pointer">
                            Standard (Default)
                          </SelectItem>
                          <SelectItem value="FLAT" className="cursor-pointer">
                            Superflat (Creative)
                          </SelectItem>
                          <SelectItem value="LARGE_BIOMES" className="cursor-pointer">
                            Large Biomes
                          </SelectItem>
                          <SelectItem value="AMPLIFIED" className="cursor-pointer">
                            Amplified (Mountains)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {field.state.meta.errors && <FieldError>{field.state.meta.errors.join(", ")}</FieldError>}
                    </Field>
                  )}
                />
                <form.Field
                  name="generateStructures"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor="generateStructures">Generate Structures</FieldLabel>
                      <Select value={field.state.value ? "true" : "false"} onValueChange={(val) => field.handleChange(val === "true")}>
                        <SelectTrigger id="generateStructures" className="cursor-pointer">
                          <SelectValue placeholder="Structures" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true" className="cursor-pointer">
                            Enabled (Villages/Fortress)
                          </SelectItem>
                          <SelectItem value="false" className="cursor-pointer">
                            Disabled (Flat landscape)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {field.state.meta.errors && <FieldError>{field.state.meta.errors.join(", ")}</FieldError>}
                    </Field>
                  )}
                />
              </FieldGroup>
            </motion.div>
          )}

          {/* STEP 4: RESOURCE ALLOCATION */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <FieldGroup className="grid grid-cols-2 gap-4">
                <form.Field
                  name="ramLimit"
                  children={(field) => (
                    <Field>
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
                    <Field>
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
                    <Field className="col-span-2">
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
              </FieldGroup>
            </motion.div>
          )}

          {/* Footer */}
          <DialogFooter className="mt-6 flex items-center justify-between border-t border-border pt-4">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={handlePrev} className="cursor-pointer gap-1">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
            ) : (
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="cursor-pointer">
                Cancel
              </Button>
            )}

            {step < 4 ? (
              <Button type="button" onClick={handleNext} className="ml-auto cursor-pointer gap-1">
                Next <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button type="submit" className="ml-auto cursor-pointer gap-1" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  "Deploying..."
                ) : (
                  <>
                    <span>Deploy</span>
                    <Check className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
