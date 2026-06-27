import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import { ServerAPIResponse } from "@/constants/servers";

export interface ServerListResponse {
  status: string;
  message: string;
  data: {
    servers: ServerAPIResponse[];
  };
}

export interface ServerDetailResponse {
  status: string;
  message: string;
  data: {
    server: ServerAPIResponse;
  };
}

export const serverService = {
  list: async (): Promise<ServerAPIResponse[]> => {
    const response = await apiClient.get<ServerListResponse>("/api/servers/v1");
    return response.data.data.servers;
  },

  get: async (id: string): Promise<ServerAPIResponse> => {
    const response = await apiClient.get<ServerDetailResponse>(`/api/servers/v1/${id}`);
    return response.data.data.server;
  },

  create: async (data: any): Promise<ServerAPIResponse> => {
    const response = await apiClient.post<ServerDetailResponse>("/api/servers/v1", data);
    return response.data.data.server;
  },

  update: async (params: { id: string; data: any }): Promise<ServerAPIResponse> => {
    const response = await apiClient.put<ServerDetailResponse>(`/api/servers/v1/${params.id}`, params.data);
    return response.data.data.server;
  },

  delete: async (id: string, name?: string): Promise<any> => {
    const response = await apiClient.delete(`/api/servers/v1/${id}`, {
      params: { name }
    });
    return response.data;
  },

  togglePower: async (params: { id: string; action: "start" | "stop" | "restart" | "kill" }): Promise<ServerAPIResponse> => {
    const response = await apiClient.post<ServerDetailResponse>(`/api/servers/v1/${params.id}/power`, { action: params.action });
    return response.data.data.server;
  },

  getVersions: async (): Promise<string[]> => {
    const response = await apiClient.get<{ data: { versions: string[] } }>("/api/servers/v1/meta/versions");
    return response.data.data.versions;
  },

  getBuilds: async (version: string): Promise<number[]> => {
    const response = await apiClient.get<{ data: { builds: number[] } }>(`/api/servers/v1/meta/builds/${version}`);
    return response.data.data.builds;
  },
};

// TanStack Query Hooks
export function useServers(options?: { refetchInterval?: number | false; enabled?: boolean }) {
  return useQuery({
    queryKey: ["servers"],
    queryFn: serverService.list,
    enabled: typeof window !== "undefined",
    ...options,
  });
}

export function useServer(id: string, options?: { refetchInterval?: number | false; enabled?: boolean }) {
  return useQuery({
    queryKey: ["server", id],
    queryFn: () => serverService.get(id),
    enabled: typeof window !== "undefined" && !!id,
    ...options,
  });
}

export function useCreateServer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => serverService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servers"] });
    },
  });
}

export function useUpdateServer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; data: any }) => serverService.update(params),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["servers"] });
      queryClient.invalidateQueries({ queryKey: ["server", data.id] });
    },
  });
}

export function useDeleteServer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => serverService.delete(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servers"] });
    },
  });
}

export function useToggleServerPower() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; action: "start" | "stop" | "restart" | "kill" }) => serverService.togglePower(params),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["servers"] });
      queryClient.invalidateQueries({ queryKey: ["server", data.id] });
    },
  });
}

export function useMinecraftVersions() {
  return useQuery({
    queryKey: ["minecraft-versions"],
    queryFn: serverService.getVersions,
    enabled: typeof window !== "undefined",
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function usePaperBuilds(version: string) {
  return useQuery({
    queryKey: ["paper-builds", version],
    queryFn: () => serverService.getBuilds(version),
    enabled: typeof window !== "undefined" && !!version && version !== "",
    staleTime: 5 * 60 * 1000,
  });
}
