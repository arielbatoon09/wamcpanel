"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Shield,
  LogOut,
  User,
  Settings,
  CreditCard,
  LifeBuoy
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isServerDetail = pathname.startsWith("/server/")

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
  ]





  return (
    <div className={cn(
      "flex flex-col bg-background text-foreground transition-colors duration-150",
      isServerDetail ? "lg:h-screen lg:overflow-hidden min-h-screen" : "min-h-screen"
    )}>
      
      {/* Top Header / Navigation Bar */}
      <header className="h-16 flex items-center border-b border-border bg-card/65 backdrop-blur-md shrink-0 sticky top-0 z-50 select-none px-6">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          
          {/* Logo and Nav links */}
          <div className="flex items-center gap-8">
            <Link href="/servers" className="flex items-center gap-2 overflow-hidden shrink-0">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <span className="font-black text-sm text-primary-foreground font-mono">W</span>
              </div>
              <span className="font-extrabold text-sm tracking-tight font-sans whitespace-nowrap">
                WAMCPanel
              </span>
            </Link>

            {/* Navigation Items */}
            <nav className="hidden md:flex items-center gap-1.5">
              {navItems.map((item, index) => {
                const isActive = pathname.startsWith(item.href)
                return item.disabled ? (
                  <span
                    key={index}
                    className="px-3 py-1.5 text-xs font-semibold text-muted-foreground/50 cursor-not-allowed select-none"
                    title="Coming Soon"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    key={index}
                    href={item.href}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer",
                      isActive
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Action Controls & Profile Menu */}
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider hidden sm:inline-block">
              System Status: <span className="text-emerald-500 font-bold">Online</span>
            </span>
            
            <div className="h-4 w-[1px] bg-border hidden sm:block" />

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 select-none outline-hidden cursor-pointer focus:ring-0">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary font-mono uppercase border border-primary/20">
                    AD
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-[11px] font-bold leading-none text-foreground">Admin User</p>
                    <p className="text-[9px] text-muted-foreground leading-none mt-1">administrator</p>
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
      <main className={cn(
        "flex-1 bg-background/50 p-6",
        isServerDetail ? "lg:h-[calc(100vh-64px)] lg:overflow-hidden overflow-y-auto" : "overflow-y-auto"
      )}>
        <div className={cn(
          "max-w-7xl mx-auto",
          isServerDetail ? "lg:h-full h-auto" : "space-y-6"
        )}>
          {children}
        </div>
      </main>

    </div>
  )
}
