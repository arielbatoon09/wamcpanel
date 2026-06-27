import { apiClient } from "@/services/api-client";

export interface BackupItem {
  id: string;
  name: string;
  size: string;
  date: string;
}

export interface BackupListResponse {
  status: string;
  message: string;
  data: BackupItem[];
}

export const backupService = {
  list: async (serverId: string): Promise<BackupItem[]> => {
    const response = await apiClient.get<BackupListResponse>(`/api/servers/v1/${serverId}/backups`);
    return response.data.data;
  },

  create: async (serverId: string, backupName: string): Promise<void> => {
    await apiClient.post(`/api/servers/v1/${serverId}/backups`, { name: backupName });
  },

  delete: async (serverId: string, filename: string): Promise<void> => {
    await apiClient.delete(`/api/servers/v1/${serverId}/backups/${filename}`);
  },

  restore: async (serverId: string, filename: string): Promise<void> => {
    await apiClient.post(`/api/servers/v1/${serverId}/backups/${filename}/restore`);
  },

  download: async (serverId: string, filename: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/servers/v1/${serverId}/backups/${filename}/download`, {
      responseType: "blob",
    });
    return response.data;
  },

  upload: async (serverId: string, file: File, customName?: string, onProgress?: (pct: number) => void): Promise<void> => {
    const fileName = customName || file.name;
    await apiClient.post(`/api/servers/v1/${serverId}/backups/upload`, file, {
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
