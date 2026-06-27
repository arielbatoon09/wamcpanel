import { redirect } from "next/navigation";
import { getOnboardingStatus } from "@/lib/auth-status";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const { onboarded } = await getOnboardingStatus();
  if (!onboarded) {
    redirect("/onboarding");
  }
  redirect("/servers");
}
