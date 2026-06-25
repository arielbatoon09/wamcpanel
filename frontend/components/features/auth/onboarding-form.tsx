"use client";

import * as React from "react";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import * as z from "zod";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "One number", test: (pw) => /[0-9]/.test(pw) },
];

import { useSignup, useLogin } from "@/services/auth-service";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().superRefine((val, ctx) => {
    const passedRules = PASSWORD_RULES.filter((r) => r.test(val)).length;
    if (passedRules < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password does not meet complexity requirements.",
      });
    }
  }),
});

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const signupMutation = useSignup();
  const loginMutation = useLogin();

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    validators: {
      onSubmit: signupSchema,
    },
    onSubmit: async ({ value }) => {
      signupMutation.mutate(value, {
        onSuccess: () => {
          toast.success("Admin account created successfully! Signing you in...");

          // Auto login after signup
          loginMutation.mutate(
            {
              email: value.email,
              password: value.password,
            },
            {
              onSuccess: () => {
                window.location.href = "/servers";
              },
              onError: () => {
                window.location.href = "/login";
              },
            }
          );
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || err.message || "An error occurred during onboarding.");
        },
      });
    },
  });

  const isLoading = signupMutation.isPending || loginMutation.isPending;

  return (
    <form
      id="signup-form"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4 px-8 py-7"
    >
      <FieldGroup>
        {/* Display Name */}
        <form.Field
          name="name"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid} className="space-y-1.5">
                <FieldLabel htmlFor={field.name} className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Display Name
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="text"
                  autoComplete="name"
                  placeholder="Alex Johnson"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  className="h-10 bg-background/60 placeholder:text-muted-foreground/40"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />

        {/* Email */}
        <form.Field
          name="email"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid} className="space-y-1.5">
                <FieldLabel htmlFor={field.name} className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Email Address
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  className="h-10 bg-background/60 placeholder:text-muted-foreground/40"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />

        {/* Password */}
        <form.Field
          name="password"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            const password = field.state.value;
            const passwordStrength = PASSWORD_RULES.filter((r) => r.test(password)).length;
            const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][passwordStrength];
            const strengthColor = ["", "text-rose-500", "text-amber-500", "text-yellow-400", "text-emerald-500"][passwordStrength];
            const strengthBarColor = ["", "bg-rose-500", "bg-amber-500", "bg-yellow-400", "bg-emerald-500"][passwordStrength];

            return (
              <Field data-invalid={isInvalid} className="space-y-1.5">
                <FieldLabel htmlFor={field.name} className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Password
                </FieldLabel>
                <InputGroup>
                  <Input
                    id={field.name}
                    name={field.name}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    value={password}
                    onBlur={(e) => {
                      field.handleBlur();
                      setFocused(false);
                    }}
                    onFocus={() => setFocused(true)}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    className="h-10 w-full bg-background/60 pr-10 placeholder:text-muted-foreground/40"
                  />
                  <InputGroupAddon align="block-end">
                    <button type="button" tabIndex={-1} onClick={() => setShowPassword((v) => !v)} className="text-muted-foreground/60 transition-colors hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </InputGroupAddon>
                </InputGroup>

                {/* Strength bar */}
                {password.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex h-1 gap-1 overflow-hidden rounded-full">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={cn("h-full flex-1 rounded-full transition-all duration-300", passwordStrength >= i ? strengthBarColor : "bg-border")} />
                      ))}
                    </div>
                    <p className={cn("font-mono text-[10px] font-semibold", strengthColor)}>{strengthLabel}</p>
                  </div>
                )}

                {/* Password rules checklist */}
                {(focused || isInvalid) && password.length > 0 && (
                  <div className="mt-2 space-y-1 rounded-lg border border-border/60 bg-background/40 p-3">
                    {PASSWORD_RULES.map((rule) => {
                      const ok = rule.test(password);
                      return (
                        <div key={rule.label} className="flex items-center gap-2">
                          {ok ? <Check className="h-3 w-3 shrink-0 text-emerald-500" /> : <X className="h-3 w-3 shrink-0 text-muted-foreground/40" />}
                          <span className={cn("font-mono text-[10px]", ok ? "text-emerald-500" : "text-muted-foreground/60")}>{rule.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
      </FieldGroup>

      {/* Submit */}
      <Button type="submit" disabled={isLoading} className="mt-1 h-10 w-full gap-2 font-semibold transition-all duration-200">
        {isLoading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Creating account…
          </>
        ) : (
          <>Create Account</>
        )}
      </Button>
    </form>
  );
}
