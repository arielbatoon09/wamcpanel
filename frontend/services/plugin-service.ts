import { apiClient } from "@/services/api-client";

export interface PluginItem {
  name: string;
  version: string;
  desc: string;
  enabled: boolean;
  pluginPath: string;
}

export interface PluginListResponse {
  status: string;
  message: string;
  data: PluginItem[];
}

export const pluginService = {
  list: async (serverId: string): Promise<PluginItem[]> => {
    const response = await apiClient.get<PluginListResponse>(`/api/servers/v1/${serverId}/plugins`);
    return response.data.data;
  },

  toggle: async (serverId: string, pluginPath: string, enable: boolean): Promise<void> => {
    await apiClient.post(`/api/servers/v1/${serverId}/plugins/toggle`, { pluginPath, enable });
  },

  delete: async (serverId: string, pluginPath: string): Promise<void> => {
    await apiClient.delete(`/api/servers/v1/${serverId}/plugins`, {
      data: { pluginPath },
    });
  },

  upload: async (serverId: string, file: File, customName?: string, onProgress?: (pct: number) => void): Promise<void> => {
    const fileName = customName || file.name;
    await apiClient.post(`/api/servers/v1/${serverId}/plugins/upload`, file, {
      params: { name: fileName },
      headers: {
        "Content-Type": "application/octet-stream",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(pct);
        }
      },
    });
  },
};
