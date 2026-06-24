"use client";

import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { THEME_COLORS } from "@/constants/theme-colors";
import { useThemeColor } from "@/hooks/useThemeColor";
import { cn } from "@/lib/utils";

/**
 * A compact color-swatch popover that lives in the top navigation bar.
 * Clicking a swatch immediately applies the accent color site-wide.
 */
export function ThemeColorPicker() {
  const { accentColor, setAccentColor } = useThemeColor();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground" title="Change accent color" id="theme-color-picker-trigger">
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-auto p-3" id="theme-color-picker-popover">
        <p className="mb-2.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase select-none">Accent Color</p>

        <div className="grid grid-cols-9 gap-1.5">
          {THEME_COLORS.map((color) => {
            const isActive = accentColor.name === color.name;
            return (
              <button
                key={color.name}
                id={`theme-swatch-${color.name}`}
                title={color.label}
                onClick={() => setAccentColor(color)}
                className={cn(
                  "group relative h-6 w-6 cursor-pointer rounded-full transition-all duration-150 outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover",
                  isActive ? "scale-110 ring-2 ring-offset-2 ring-offset-popover" : "opacity-70 hover:scale-110 hover:opacity-100"
                )}
                style={{
                  backgroundColor: color.primary,
                  ["--tw-ring-color" as string]: color.primary,
                }}
              >
                {isActive && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/90 shadow-sm" />
                  </span>
                )}
                <span className="sr-only">{color.label}</span>
              </button>
            );
          })}
        </div>

        <p className="mt-2.5 text-[10px] text-muted-foreground select-none">{accentColor.label}</p>
      </PopoverContent>
    </Popover>
  );
}
