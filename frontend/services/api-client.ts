import axios from "axios";

const BACKEND_URL = typeof window === "undefined" ? process.env.NEXT_INTERNAL_BACKEND_URL || "http://backend:8000" : "";

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const apiClient = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach access token if present
apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response Interceptor: Auto-rotate tokens on 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Ignore if it's the login or refresh token endpoint itself to prevent loops
    if (originalRequest.url?.includes("/refresh-token") || originalRequest.url?.includes("/login")) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(`${BACKEND_URL}/api/auth/v1/refresh-token`, {}, { withCredentials: true });
        const newAccessToken = res.data.data?.tokens?.accessToken;
        if (newAccessToken) {
          setAccessToken(newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        setAccessToken(null);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
