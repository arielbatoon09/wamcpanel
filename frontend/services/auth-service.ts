import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient, setAccessToken } from "@/services/api-client";

export interface OnboardingStatus {
  onboarded: boolean;
}

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export interface AuthResponse {
  status: string;
  message: string;
  data: {
    user: AuthUser;
    tokens?: {
      accessToken: string;
      expiresIn: string;
    };
  };
}

export const authService = {
  getOnboardingStatus: async (): Promise<OnboardingStatus> => {
    const response = await apiClient.get<{ data: OnboardingStatus }>("/api/auth/v1/onboarding-status");
    return response.data.data;
  },

  signup: async (data: any): Promise<any> => {
    const response = await apiClient.post("/api/auth/v1/signup", data);
    return response.data;
  },

  login: async (data: any): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/api/auth/v1/login", data);
    const token = response.data.data?.tokens?.accessToken;
    if (token) {
      setAccessToken(token);
    }
    return response.data;
  },

  getMe: async (): Promise<{ user: AuthUser }> => {
    const response = await apiClient.get<{ data: { user: AuthUser } }>("/api/auth/v1/me");
    return response.data.data;
  },

  logout: async (): Promise<any> => {
    const response = await apiClient.post("/api/auth/v1/logout");
    setAccessToken(null);
    return response.data;
  },
};

// TanStack Query Hooks
export function useOnboardingStatus() {
  return useQuery({
    queryKey: ["onboarding-status"],
    queryFn: authService.getOnboardingStatus,
    enabled: typeof window !== "undefined",
  });
}

export function useSignup() {
  return useMutation({
    mutationFn: (signupData: any) => authService.signup(signupData),
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (loginData: any) => authService.login(loginData),
  });
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: authService.getMe,
    retry: false,
    enabled: typeof window !== "undefined",
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: authService.logout,
  });
}
