import { SignupForm } from "@/components/features/auth/onboarding-form";
import { getOnboardingStatus } from "@/lib/auth-status";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Create Account — WAMCPanel",
  description: "Set up your WAMCPanel account.",
};

export default async function SignupPage() {
  const { onboarded } = await getOnboardingStatus();
  if (onboarded) {
    redirect("/login");
  }

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
