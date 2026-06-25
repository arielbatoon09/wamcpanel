"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import * as z from "zod";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { toast } from "sonner";

import { useLogin } from "@/services/auth-service";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: loginSchema,
    },
    onSubmit: async ({ value }) => {
      loginMutation.mutate(value, {
        onSuccess: () => {
          toast.success("Successfully logged in!");
          window.location.href = "/servers";
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || err.message || "Login failed. Please try again.");
        },
      });
    },
  });

  const isLoading = loginMutation.isPending;

  return (
    <form
      id="login-form"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-5 px-8 py-7"
    >
      <FieldGroup>
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
                  placeholder="admin@example.com"
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
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={field.state.value}
                    onBlur={field.handleBlur}
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
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
      </FieldGroup>

      {/* Submit */}
      <Button type="submit" disabled={isLoading} className="h-10 w-full gap-2 font-semibold transition-all duration-200">
        {isLoading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Signing in…
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            Sign In
          </>
        )}
      </Button>
    </form>
  );
}
