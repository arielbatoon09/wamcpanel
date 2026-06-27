"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { User, Lock, Loader2, Eye, EyeOff, CheckCircle2, Mail } from "lucide-react";
import { useMe, useUpdateProfile } from "@/services/auth-service";
import { cn } from "@/lib/utils";

export function ProfileSettingsForm() {
  const { data: meData } = useMe();
  const updateProfile = useUpdateProfile();

  // ── Profile form state ──────────────────────────────────────────
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");

  // ── Password form state ─────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{ current?: string; new?: string; confirm?: string }>({});

  // Pre-fill name when data loads
  useEffect(() => {
    if (meData?.user?.name) {
      setName(meData.user.name);
    }
  }, [meData]);

  // ── Save profile name ───────────────────────────────────────────
  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    setNameError("");
    if (!name.trim() || name.trim().length < 2) {
      setNameError("Name must be at least 2 characters");
      return;
    }
    updateProfile.mutate(
      { name: name.trim() },
      {
        onSuccess: () => toast.success("Display name updated!"),
        onError: (err: any) =>
          toast.error(err?.response?.data?.message || "Failed to update name"),
      }
    );
  };

  // ── Save password ───────────────────────────────────────────────
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: typeof passwordErrors = {};
    if (!currentPassword) errors.current = "Current password is required";
    if (!newPassword || newPassword.length < 8) errors.new = "New password must be at least 8 characters";
    if (newPassword !== confirmPassword) errors.confirm = "Passwords do not match";
    if (Object.keys(errors).length) {
      setPasswordErrors(errors);
      return;
    }
    setPasswordErrors({});
    updateProfile.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast.success("Password changed successfully!");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.message || "Failed to change password"),
      }
    );
  };

  const isSaving = updateProfile.isPending;
  const email = meData?.user?.email ?? "";

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* ── Personal Info Card ───────────────────────────────────── */}
      <Card className="flex flex-col border border-border bg-card/65 p-6 backdrop-blur-md">
        <div className="flex items-center gap-2 border-b border-border pb-4 mb-4">
          <User className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-mono text-sm font-bold tracking-wider uppercase">Personal Information</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Manage your public display name and account email.</p>
          </div>
        </div>

        <form onSubmit={handleSaveName} className="flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-4 font-mono text-xs">
            {/* Email — read-only */}
            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email Address
              </label>
              <Input
                value={email}
                disabled
                className="h-9 cursor-not-allowed font-mono text-xs opacity-60 bg-muted/45"
              />
              <p className="text-[10px] text-muted-foreground/60">Email cannot be changed as it is tied to your account identity.</p>
            </div>

            {/* Display name */}
            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground uppercase">Display Name</label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError("");
                }}
                placeholder="Your name"
                className={cn("h-9 text-sm", nameError && "border-destructive focus-visible:ring-destructive/50")}
              />
              {nameError && <p className="text-[11px] text-destructive mt-1">{nameError}</p>}
            </div>
          </div>

          <div className="pt-4 mt-auto">
            <Button
              type="submit"
              disabled={isSaving || name.trim() === (meData?.user?.name ?? "")}
              className="w-full cursor-pointer gap-2 font-semibold"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving Changes…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Save Name
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* ── Change Password Card ─────────────────────────────────── */}
      <Card className="border border-border bg-card/65 p-6 backdrop-blur-md">
        <div className="flex items-center gap-2 border-b border-border pb-4 mb-4">
          <Lock className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-mono text-sm font-bold tracking-wider uppercase">Security & Password</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Update your password regularly to keep your account secure.</p>
          </div>
        </div>

        <form onSubmit={handleSavePassword} className="space-y-4 font-mono text-xs">
          {/* Current password */}
          <div className="space-y-1.5">
            <label className="font-semibold text-muted-foreground uppercase">Current Password</label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setPasswordErrors((p) => ({ ...p, current: undefined }));
                }}
                placeholder="••••••••"
                className={cn("h-9 pr-9 text-sm", passwordErrors.current && "border-destructive focus-visible:ring-destructive/50")}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            {passwordErrors.current && <p className="text-[11px] text-destructive mt-1">{passwordErrors.current}</p>}
          </div>

          {/* New password */}
          <div className="space-y-1.5">
            <label className="font-semibold text-muted-foreground uppercase">New Password</label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordErrors((p) => ({ ...p, new: undefined }));
                }}
                placeholder="Min 8 characters"
                className={cn("h-9 pr-9 text-sm", passwordErrors.new && "border-destructive focus-visible:ring-destructive/50")}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            {passwordErrors.new && <p className="text-[11px] text-destructive mt-1">{passwordErrors.new}</p>}
          </div>

          {/* Confirm new password */}
          <div className="space-y-1.5">
            <label className="font-semibold text-muted-foreground uppercase">Confirm New Password</label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordErrors((p) => ({ ...p, confirm: undefined }));
                }}
                placeholder="••••••••"
                className={cn("h-9 pr-9 text-sm", passwordErrors.confirm && "border-destructive focus-visible:ring-destructive/50")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            {passwordErrors.confirm && <p className="text-[11px] text-destructive mt-1">{passwordErrors.confirm}</p>}
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
              variant="outline"
              className="w-full cursor-pointer gap-2 font-semibold"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating Password…
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" /> Change Password
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
