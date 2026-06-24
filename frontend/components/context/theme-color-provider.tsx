"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  DEFAULT_THEME_COLOR,
  THEME_COLORS,
  type ThemeColor,
} from "@/constants/theme-colors";

const STORAGE_KEY = "wamc-accent-color";

interface ThemeColorContextValue {
  accentColor: ThemeColor;
  setAccentColor: (color: ThemeColor) => void;
}

const ThemeColorContext = createContext<ThemeColorContextValue | null>(null);

function applyAccentColor(color: ThemeColor) {
  const root = document.documentElement;
  root.style.setProperty("--primary", color.primary);
  root.style.setProperty("--ring", color.ring);
  root.style.setProperty("--sidebar-primary", color.primary);
  root.style.setProperty("--sidebar-ring", color.ring);
}

export function ThemeColorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [accentColor, setAccentColorState] = useState<ThemeColor>(
    DEFAULT_THEME_COLOR
  );

  // On mount, restore persisted color
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const found = THEME_COLORS.find((c) => c.name === saved);
        if (found) {
          setAccentColorState(found);
          applyAccentColor(found);
        }
      }
    } catch {
      // localStorage unavailable (e.g. SSR guard — should not reach here in "use client")
    }
  }, []);

  const setAccentColor = useCallback((color: ThemeColor) => {
    setAccentColorState(color);
    applyAccentColor(color);
    try {
      localStorage.setItem(STORAGE_KEY, color.name);
    } catch {
      // ignore
    }
  }, []);

  return (
    <ThemeColorContext.Provider value={{ accentColor, setAccentColor }}>
      {children}
    </ThemeColorContext.Provider>
  );
}

export function useThemeColorContext(): ThemeColorContextValue {
  const ctx = useContext(ThemeColorContext);
  if (!ctx) {
    throw new Error(
      "useThemeColorContext must be used inside <ThemeColorProvider>"
    );
  }
  return ctx;
}
