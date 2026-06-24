"use client"

import { cn } from "@/lib/utils"
import { motion } from "motion/react"

interface StatusBadgeProps {
  status: "online" | "offline" | "starting" | "stopping"
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const configs = {
    online: {
      label: "Online",
      bgClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      dotClass: "bg-emerald-500",
      pulse: true,
    },
    offline: {
      label: "Offline",
      bgClass: "bg-muted text-muted-foreground border-border",
      dotClass: "bg-muted-foreground",
      pulse: false,
    },
    starting: {
      label: "Starting",
      bgClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      dotClass: "bg-amber-500",
      pulse: true,
    },
    stopping: {
      label: "Stopping",
      bgClass: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      dotClass: "bg-rose-500",
      pulse: true,
    },
  }

  const current = configs[status] || configs.offline

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-md shadow-xs transition-colors duration-300",
        current.bgClass,
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {current.pulse && (
          <motion.span
            animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", current.dotClass)}
          />
        )}
        <span className={cn("relative inline-flex rounded-full h-2 w-2", current.dotClass)} />
      </span>
      {current.label}
    </span>
  )
}