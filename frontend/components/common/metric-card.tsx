"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { motion } from "motion/react"
import { LucideIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string
  percentage: number
  icon: LucideIcon
  colorClass?: string
  subtext?: string
}

export function MetricCard({
  title,
  value,
  percentage,
  icon: Icon,
  colorClass = "bg-primary text-primary-foreground",
  subtext,
}: MetricCardProps) {
  // Ensure percentage stays between 0 and 100
  const boundedPercentage = Math.min(100, Math.max(0, percentage))

  return (
    <Card className="p-4 relative overflow-hidden backdrop-blur-sm bg-card/65 border border-border shadow-xs hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold mt-1 tracking-tight">{value}</h3>
        </div>
        <div className="p-2 rounded-lg bg-secondary border border-border">
          <Icon className="h-4 w-4 text-foreground/80" />
        </div>
      </div>
      
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Usage</span>
          <span className="font-semibold">{boundedPercentage.toFixed(1)}%</span>
        </div>
        <Progress value={boundedPercentage} className="h-1.5" />
      </div>

      {subtext && (
        <p className="text-[10px] text-muted-foreground mt-2 font-mono">{subtext}</p>
      )}

      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full pointer-events-none" />
    </Card>
  )
}
