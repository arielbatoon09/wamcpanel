import { cookies } from "next/headers";
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

export async function getAuthStatus(): Promise<{ authenticated: boolean }> {
  try {
    const cookieStore = await cookies();
    const hasRefreshToken = cookieStore.has("refreshToken");
    return { authenticated: hasRefreshToken };
  } catch {
    return { authenticated: false };
  }
}
