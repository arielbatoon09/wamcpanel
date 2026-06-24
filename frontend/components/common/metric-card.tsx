"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  percentage: number;
  icon: LucideIcon;
  subtext?: string;
}

export function MetricCard({ title, value, percentage, icon: Icon, subtext }: MetricCardProps) {
  const boundedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <Card className="relative overflow-hidden border border-border bg-card/65 p-4 shadow-xs backdrop-blur-sm transition-all duration-300 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">{title}</p>
          <h3 className="mt-1 text-2xl font-bold tracking-tight">{value}</h3>
        </div>
        <div className="rounded-lg border border-border bg-secondary p-2">
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

      {subtext && <p className="mt-2 font-mono text-[10px] text-muted-foreground">{subtext}</p>}

      {/* Decorative gradient overlay */}
      <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-gradient-to-br from-primary/5 to-transparent" />
    </Card>
  );
}
