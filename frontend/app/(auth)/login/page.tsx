import { LoginForm } from "@/components/features/auth/login-form";

export const metadata = {
  title: "Sign In — WAMCPanel",
  description: "Sign in to your WAMCPanel account.",
};

export default function LoginPage() {
  return (
    <>
      {/* Page header */}
      <div className="border-b border-border/60 bg-card/40 px-8 pt-7 pb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to your WAMCPanel account to continue.</p>
      </div>

      <LoginForm />
    </>
  );
}