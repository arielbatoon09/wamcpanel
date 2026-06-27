import { apiClient } from "@/services/api-client";

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  level: "info" | "success" | "warning" | "error";
  category: "power" | "config" | "player" | "backup" | "system" | "file";
  actor: string;
  message: string;
}

export interface ActivityLogResponse {
  status: string;
  message: string;
  data: ActivityLogEntry[];
}

export const activityLogService = {
  list: async (serverId: string): Promise<ActivityLogEntry[]> => {
    const response = await apiClient.get<ActivityLogResponse>(`/api/servers/v1/${serverId}/activity-logs`);
    return response.data.data;
  },
};
