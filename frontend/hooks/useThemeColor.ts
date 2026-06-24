import { useThemeColorContext } from "@/components/context/theme-color-provider";

/**
 * Convenience hook for accessing the active accent color and its setter.
 * Must be used inside a component tree wrapped by <ThemeColorProvider>.
 */
export function useThemeColor() {
  return useThemeColorContext();
}
