import { apiClient } from "@/services/api-client";

export interface ChangelogItem {
  title: string;
  date: string;
  changes: string[];
}

export interface CheckUpdateResponse {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  currentCommit: string;
  latestCommit: string;
  fullCurrentCommit: string;
  fullLatestCommit: string;
  changelogs: Record<string, ChangelogItem>;
}

export const systemService = {
  checkUpdate: async (): Promise<CheckUpdateResponse> => {
    const response = await apiClient.get<{ data: CheckUpdateResponse }>("/api/system/v1/update/check");
    return response.data.data;
  },

  triggerUpdate: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ data: { success: boolean; message: string } }>("/api/system/v1/update");
    return response.data.data;
  },
};
