import "@/styles/globals.css";
import { Geist_Mono, Inter } from "next/font/google";
import { cn } from "@/lib/utils";

import { ThemeColorProvider } from "@/components/context/theme-color-provider";
import { QueryProvider } from "@/components/context/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  });

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const STORAGE_KEY = "wamc-accent-color";
                  const saved = localStorage.getItem(STORAGE_KEY);
                  if (saved) {
                    const THEME_COLORS = [
                      { name: "amber", primary: "oklch(0.65 0.13 35.0)", ring: "oklch(0.65 0.13 35.0)" },
                      { name: "orange", primary: "oklch(0.65 0.17 50.0)", ring: "oklch(0.65 0.17 50.0)" },
                      { name: "yellow", primary: "oklch(0.72 0.15 75.0)", ring: "oklch(0.72 0.15 75.0)" },
                      { name: "rose", primary: "oklch(0.61 0.20 10.0)", ring: "oklch(0.61 0.20 10.0)" },
                      { name: "red", primary: "oklch(0.58 0.21 25.0)", ring: "oklch(0.58 0.21 25.0)" },
                      { name: "pink", primary: "oklch(0.63 0.18 355.0)", ring: "oklch(0.63 0.18 355.0)" },
                      { name: "sky", primary: "oklch(0.62 0.15 220.0)", ring: "oklch(0.62 0.15 220.0)" },
                      { name: "blue", primary: "oklch(0.58 0.20 250.0)", ring: "oklch(0.58 0.20 250.0)" },
                      { name: "indigo", primary: "oklch(0.57 0.21 265.0)", ring: "oklch(0.57 0.21 265.0)" },
                      { name: "violet", primary: "oklch(0.58 0.20 280.0)", ring: "oklch(0.58 0.20 280.0)" },
                      { name: "purple", primary: "oklch(0.57 0.20 300.0)", ring: "oklch(0.57 0.20 300.0)" },
                      { name: "fuchsia", primary: "oklch(0.61 0.22 320.0)", ring: "oklch(0.61 0.22 320.0)" },
                      { name: "cyan", primary: "oklch(0.63 0.14 200.0)", ring: "oklch(0.63 0.14 200.0)" },
                      { name: "emerald", primary: "oklch(0.60 0.17 160.0)", ring: "oklch(0.60 0.17 160.0)" },
                      { name: "green", primary: "oklch(0.60 0.18 140.0)", ring: "oklch(0.60 0.18 140.0)" },
                      { name: "teal", primary: "oklch(0.61 0.15 180.0)", ring: "oklch(0.61 0.15 180.0)" },
                      { name: "lime", primary: "oklch(0.68 0.17 120.0)", ring: "oklch(0.68 0.17 120.0)" },
                      { name: "slate", primary: "oklch(0.55 0.05 230.0)", ring: "oklch(0.55 0.05 230.0)" }
                    ];
                    const found = THEME_COLORS.find(function(c) { return c.name === saved; });
                    if (found) {
                      const root = document.documentElement;
                      root.style.setProperty("--primary", found.primary);
                      root.style.setProperty("--ring", found.ring);
                      root.style.setProperty("--sidebar-primary", found.primary);
                      root.style.setProperty("--sidebar-ring", found.ring);
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <QueryProvider>
          <ThemeColorProvider>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </ThemeColorProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
