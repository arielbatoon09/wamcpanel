import { SignupForm } from "@/components/features/auth/onboarding-form";

export const metadata = {
  title: "Create Account — WAMCPanel",
  description: "Set up your WAMCPanel account.",
};

export default function SignupPage() {
  return (
    <>
      {/* Page header */}
      <div className="border-b border-border/60 bg-card/40 px-8 pt-7 pb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Get started</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create your WAMCPanel account to continue.</p>
      </div>

      <SignupForm />
    </>
  );
}