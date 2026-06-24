export type ThemeColor = {
  name: string;
  label: string;
  primary: string;
  ring: string;
};

/**
 * Predefined accent color palette using OKLCH for perceptual uniformity.
 * Each entry drives --primary, --ring, --sidebar-primary, and --sidebar-ring.
 * The "foreground" pair is always near-white (oklch 0.99), which works for
 * all these chroma/hue combinations at lightness ~0.60–0.65.
 */
export const THEME_COLORS: ThemeColor[] = [
  // — Warm —
  {
    name: "amber",
    label: "Amber",
    primary: "oklch(0.65 0.13 35.0)",
    ring: "oklch(0.65 0.13 35.0)",
  },
  {
    name: "orange",
    label: "Orange",
    primary: "oklch(0.65 0.17 50.0)",
    ring: "oklch(0.65 0.17 50.0)",
  },
  {
    name: "yellow",
    label: "Yellow",
    primary: "oklch(0.72 0.15 75.0)",
    ring: "oklch(0.72 0.15 75.0)",
  },
  {
    name: "rose",
    label: "Rose",
    primary: "oklch(0.61 0.20 10.0)",
    ring: "oklch(0.61 0.20 10.0)",
  },
  {
    name: "red",
    label: "Red",
    primary: "oklch(0.58 0.21 25.0)",
    ring: "oklch(0.58 0.21 25.0)",
  },
  {
    name: "pink",
    label: "Pink",
    primary: "oklch(0.63 0.18 355.0)",
    ring: "oklch(0.63 0.18 355.0)",
  },
  // — Cool —
  {
    name: "sky",
    label: "Sky",
    primary: "oklch(0.62 0.15 220.0)",
    ring: "oklch(0.62 0.15 220.0)",
  },
  {
    name: "blue",
    label: "Blue",
    primary: "oklch(0.58 0.20 250.0)",
    ring: "oklch(0.58 0.20 250.0)",
  },
  {
    name: "indigo",
    label: "Indigo",
    primary: "oklch(0.57 0.21 265.0)",
    ring: "oklch(0.57 0.21 265.0)",
  },
  {
    name: "violet",
    label: "Violet",
    primary: "oklch(0.58 0.20 280.0)",
    ring: "oklch(0.58 0.20 280.0)",
  },
  {
    name: "purple",
    label: "Purple",
    primary: "oklch(0.57 0.20 300.0)",
    ring: "oklch(0.57 0.20 300.0)",
  },
  {
    name: "fuchsia",
    label: "Fuchsia",
    primary: "oklch(0.61 0.22 320.0)",
    ring: "oklch(0.61 0.22 320.0)",
  },
  {
    name: "cyan",
    label: "Cyan",
    primary: "oklch(0.63 0.14 200.0)",
    ring: "oklch(0.63 0.14 200.0)",
  },
  // — Nature —
  {
    name: "emerald",
    label: "Emerald",
    primary: "oklch(0.60 0.17 160.0)",
    ring: "oklch(0.60 0.17 160.0)",
  },
  {
    name: "green",
    label: "Green",
    primary: "oklch(0.60 0.18 140.0)",
    ring: "oklch(0.60 0.18 140.0)",
  },
  {
    name: "teal",
    label: "Teal",
    primary: "oklch(0.61 0.15 180.0)",
    ring: "oklch(0.61 0.15 180.0)",
  },
  {
    name: "lime",
    label: "Lime",
    primary: "oklch(0.68 0.17 120.0)",
    ring: "oklch(0.68 0.17 120.0)",
  },
  // — Neutral —
  {
    name: "slate",
    label: "Slate",
    primary: "oklch(0.55 0.05 230.0)",
    ring: "oklch(0.55 0.05 230.0)",
  },
];

export const DEFAULT_THEME_COLOR = THEME_COLORS.find((c) => c.name === "slate")!;