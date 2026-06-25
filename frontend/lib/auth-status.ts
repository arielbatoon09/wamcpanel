import { authService, OnboardingStatus } from "@/services/auth-service";

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  try {
    return await authService.getOnboardingStatus();
  } catch (error) {
    console.error("Error fetching onboarding status:", error);
    // If backend is down or unreachable, default to true to prevent infinite redirect loops
    return { onboarded: true };
  }
}
