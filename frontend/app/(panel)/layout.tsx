"use client";

import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/common/logo";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, User, FileText } from "lucide-react";
import { ChangelogsPopup } from "@/components/features/settings/changelogs-popup";
import { cn } from "@/lib/utils";
import { ThemeColorPicker } from "@/components/features/settings/theme-color-picker";
import { useMe, useOnboardingStatus, useLogout } from "@/services/auth-service";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const { data: meData, isLoading: meLoading, error: meError } = useMe();
  const { data: onboardingData, isLoading: onboardingLoading } = useOnboardingStatus();
  const logoutMutation = useLogout();

  const isServerDetail = pathname.startsWith("/server/");

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!onboardingLoading && onboardingData && !onboardingData.onboarded) {
      router.push("/onboarding");
    }
  }, [onboardingData, onboardingLoading, router]);

  useEffect(() => {
    if (!meLoading && meError) {
      router.push("/login");
    }
  }, [meError, meLoading, router]);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Successfully logged out");
        router.push("/login");
      },
      onError: (err: unknown) => {
        toast.error("Logout failed. Please try again.");
        console.error(err);
      },
    });
  };

  if (!mounted || meLoading || onboardingLoading || (onboardingData && !onboardingData.onboarded) || meError) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
        {/* Background radial glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[400px] w-[400px] rounded-full opacity-[0.05]" style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)" }} />
        </div>

        {/* Premium loader */}
        <div className="relative z-10 flex flex-col items-center gap-4 select-none">
          <Logo textSize="xl" className="animate-pulse" />
          <div className="mt-2 flex items-center gap-2 font-mono text-xs tracking-wider text-muted-foreground/60 uppercase">
            <svg className="h-4 w-4 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Securing Workspace…
          </div>
        </div>
      </div>
    );
  }

  const initials = meData?.user?.name
    ? meData.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
    : meData?.user?.email?.substring(0, 2);

  return (
    <div className={cn("flex flex-col bg-background text-foreground transition-colors duration-150", isServerDetail ? "min-h-screen lg:h-screen lg:overflow-hidden" : "min-h-screen")}>
      <ChangelogsPopup />
      {/* Top Header / Navigation Bar */}
      <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center border-b border-border bg-card/65 px-6 backdrop-blur-md select-none">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Logo href="/servers" textSize="lg" className="gap-2" />
          </div>

          {/* Action Controls & Profile Menu */}
          <div className="flex items-center gap-4">
            <span className="hidden font-mono text-[10px] tracking-wider text-muted-foreground uppercase sm:inline-block">
              System Status: <span className="font-bold text-emerald-500">Online</span>
            </span>

            <div className="hidden h-4 w-[1px] bg-border sm:block" />

            {/* Theme color picker */}
            <ThemeColorPicker />

            <div className="hidden h-4 w-[1px] bg-border sm:block" />

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex cursor-pointer items-center gap-2 outline-hidden select-none focus:ring-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/20 font-mono text-xs font-bold text-primary uppercase">{initials}</div>
                  <div className="hidden text-left md:block">
                    <p className="text-[11px] leading-none font-bold text-foreground">{meData?.user?.name || "User"}</p>
                    <p className="mt-1 text-[9px] leading-none text-muted-foreground">{meData?.user?.role?.toLowerCase()}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/settings/profile")} className="cursor-pointer gap-2 text-xs">
                  <User className="h-3.5 w-3.5" /> Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings/changelogs")} className="cursor-pointer gap-2 text-xs">
                  <FileText className="h-3.5 w-3.5" /> Changelogs
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2 text-xs text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className={cn("flex-1 bg-background/50 p-6", isServerDetail ? "overflow-y-auto lg:h-[calc(100vh-64px)] lg:overflow-hidden" : "overflow-y-auto")}>
        <div className={cn("mx-auto max-w-7xl", isServerDetail ? "h-auto lg:h-full" : "space-y-6")}>{children}</div>
      </main>
    </div>
  );
}
