import { Logo } from "@/components/common/logo";

export const metadata = {
  title: "WAMCPanel — Auth",
  description: "Sign in or create your WAMCPanel account.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Background grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, oklch(1 0 0) 1px, transparent 1px),
            linear-gradient(to bottom, oklch(1 0 0) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Radial glow centered */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="h-[600px] w-[600px] rounded-full opacity-[0.07]"
          style={{
            background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Logo container outside the box */}
      <div className="relative z-10 mb-8 flex flex-col items-center select-none">
        <Logo textSize="2xl" />
      </div>

      {/* Auth card */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl">{children}</div>

      {/* Footer */}
      <p className="relative z-10 mt-8 text-center font-mono text-[10px] tracking-wide text-muted-foreground/40 uppercase">&copy; {new Date().getFullYear()} WAMCPanel by <span className="font-semibold">Ariel Batoon</span> &mdash; All rights reserved</p>
    </div>
  );
}
