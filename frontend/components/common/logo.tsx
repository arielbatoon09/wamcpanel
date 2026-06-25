import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconSize?: number;
  textSize?: "sm" | "md" | "lg" | "xl" | "2xl";
  href?: string;
}

export function Logo({ className, iconSize = 32, textSize = "2xl", href = "/" }: LogoProps) {
  const containerSizes: Record<string, string> = {
    sm: "h-8 w-8 rounded-lg p-1",
    md: "h-9 w-9 rounded-lg p-1.5",
    lg: "h-10 w-10 rounded-xl p-1.5",
    xl: "h-11 w-11 rounded-xl p-2",
    "2xl": "h-12 w-12 rounded-xl p-2",
  };

  const textSizes: Record<string, string> = {
    sm: "text-sm font-extrabold tracking-tight",
    md: "text-base font-extrabold tracking-tight",
    lg: "text-lg font-black tracking-tight",
    xl: "text-xl font-black tracking-tight",
    "2xl": "text-2xl font-black tracking-tight",
  };

  const actualIconSize = iconSize || (textSize === "2xl" ? 32 : textSize === "xl" ? 28 : 24);

  return (
    <Link href={href} className={cn("group flex items-center gap-3.5 select-none", className)}>
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center border border-border/80 bg-card shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:border-primary/50",
          containerSizes[textSize] || containerSizes["2xl"]
        )}
      >
        <Image src="/mc-logo.svg" alt="WAMCPanel logo" width={actualIconSize} height={actualIconSize} className="object-contain" />
      </div>
      <span className={cn("shrink-0 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text font-sans text-foreground", textSizes[textSize] || textSizes["2xl"])}>
        WAMC<span className="text-primary">Panel</span>
      </span>
    </Link>
  );
}
