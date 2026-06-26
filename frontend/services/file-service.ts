import { apiClient } from "@/services/api-client";

export interface FileItem {
  name: string;
  isDir: boolean;
  size: number | null;
  updatedAt: string;
}

export interface FileListResponse {
  status: string;
  message: string;
  data: FileItem[];
}

export interface FileViewResponse {
  status: string;
  message: string;
  data: {
    content: string;
  };
}

export const fileService = {
  list: async (serverId: string, path = ""): Promise<FileItem[]> => {
    const response = await apiClient.get<FileListResponse>(`/api/servers/v1/${serverId}/files`, {
      params: { path },
    });
    return response.data.data;
  },

  view: async (serverId: string, path: string): Promise<string> => {
    const response = await apiClient.get<FileViewResponse>(`/api/servers/v1/${serverId}/files/view`, {
      params: { path },
    });
    return response.data.data.content;
  },

  write: async (serverId: string, path: string, content: string): Promise<void> => {
    await apiClient.post(`/api/servers/v1/${serverId}/files/write`, { path, content });
  },

  create: async (serverId: string, path: string, name: string, isDir: boolean): Promise<void> => {
    await apiClient.post(`/api/servers/v1/${serverId}/files/create`, { path, name, isDir });
  },

  delete: async (serverId: string, path: string): Promise<void> => {
    await apiClient.delete(`/api/servers/v1/${serverId}/files`, {
      params: { path },
    });
  },

  upload: async (serverId: string, path: string, file: File, customName?: string, onProgress?: (pct: number) => void): Promise<void> => {
    // Send as raw binary stream
    await apiClient.post(`/api/servers/v1/${serverId}/files/upload`, file, {
      params: { path, name: customName || file.name },
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

  extract: async (serverId: string, path: string, targetPath = ""): Promise<void> => {
    await apiClient.post(`/api/servers/v1/${serverId}/files/extract`, { path, targetPath });
  },

  compress: async (serverId: string, path: string, files: string[], archiveName: string): Promise<void> => {
    await apiClient.post(`/api/servers/v1/${serverId}/files/compress`, { path, files, archiveName });
  },

  deleteBulk: async (serverId: string, paths: string[]): Promise<void> => {
    await apiClient.post(`/api/servers/v1/${serverId}/files/delete-bulk`, { paths });
  },

  rename: async (serverId: string, path: string, newName: string): Promise<void> => {
    await apiClient.post(`/api/servers/v1/${serverId}/files/rename`, { path, newName });
  },
};
