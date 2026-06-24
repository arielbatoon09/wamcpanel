"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/common/logo";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, User, CreditCard, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeColorPicker } from "@/components/features/settings/theme-color-picker";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isServerDetail = pathname.startsWith("/server/");

  const navItems = [
    {
      label: "Servers",
      href: "/servers",
    },
    {
      label: "Billing",
      href: "/billing",
      disabled: true,
    },
    {
      label: "Account",
      href: "/account",
      disabled: true,
    },
    {
      label: "Support",
      href: "/support",
      disabled: true,
    },
  ];

  return (
    <div className={cn("flex flex-col bg-background text-foreground transition-colors duration-150", isServerDetail ? "min-h-screen lg:h-screen lg:overflow-hidden" : "min-h-screen")}>
      {/* Top Header / Navigation Bar */}
      <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center border-b border-border bg-card/65 px-6 backdrop-blur-md select-none">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          {/* Logo and Nav links */}
          <div className="flex items-center gap-8">
            <Logo href="/servers" textSize="sm" className="gap-2" />

            {/* Navigation Items */}
            <nav className="hidden items-center gap-1.5 md:flex">
              {navItems.map((item, index) => {
                const isActive = pathname.startsWith(item.href);
                return item.disabled ? (
                  <span key={index} className="cursor-not-allowed px-3 py-1.5 text-xs font-semibold text-muted-foreground/50 select-none" title="Coming Soon">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    key={index}
                    href={item.href}
                    className={cn(
                      "cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150",
                      isActive ? "bg-primary/10 font-bold text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/20 font-mono text-xs font-bold text-primary uppercase">AD</div>
                  <div className="hidden text-left md:block">
                    <p className="text-[11px] leading-none font-bold text-foreground">Admin User</p>
                    <p className="mt-1 text-[9px] leading-none text-muted-foreground">administrator</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer gap-2 text-xs">
                  <User className="h-3.5 w-3.5" /> Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2 text-xs">
                  <CreditCard className="h-3.5 w-3.5" /> Billing Info
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2 text-xs">
                  <LifeBuoy className="h-3.5 w-3.5" /> Support Tickets
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer gap-2 text-xs text-destructive focus:bg-destructive/10 focus:text-destructive">
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
