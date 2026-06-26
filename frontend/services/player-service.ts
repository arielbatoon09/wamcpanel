import { apiClient } from "@/services/api-client";

export interface PlayerItem {
  name: string;
  uuid: string;
  op: boolean;
  ping: string;
  ip: string;
}

export interface PlayerListResponse {
  status: string;
  message: string;
  data: PlayerItem[];
}

export const playerService = {
  list: async (serverId: string): Promise<PlayerItem[]> => {
    const response = await apiClient.get<PlayerListResponse>(`/api/servers/v1/${serverId}/players`);
    return response.data.data;
  },

  kick: async (serverId: string, player: string): Promise<void> => {
    await apiClient.post(`/api/servers/v1/${serverId}/players/kick`, { player });
  },

  toggleOp: async (serverId: string, player: string, op: boolean): Promise<void> => {
    await apiClient.post(`/api/servers/v1/${serverId}/players/op`, { player, op });
  },
};
