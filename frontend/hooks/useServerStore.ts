import { create } from "zustand";
import { ServerAPIResponse } from "@/constants/servers";
import { serverService } from "@/services/server-service";

interface ServerState {
  servers: ServerAPIResponse[];
  selectedServerId: string | null;
  logs: Record<string, string[]>;
  deletingIds: string[];

  // Actions
  setServers: (servers: ServerAPIResponse[]) => void;
  selectServer: (id: string | null) => void;
  startServer: (id: string) => void;
  stopServer: (id: string) => void;
  restartServer: (id: string) => void;
  killServer: (id: string) => void;
  addServer: (server: Omit<ServerAPIResponse, "id" | "status" | "metrics" | "createdAt" | "updatedAt" | "currentPlayers">) => void;
  deleteServer: (id: string) => void;
  updateServer: (id: string, updates: Partial<ServerAPIResponse>) => void;
  addLog: (serverId: string, log: string) => void;
  clearLogs: (serverId: string) => void;
  tickMetrics: () => void;
}

const generateInitialLogs = (server: ServerAPIResponse): string[] => {
  return [`[SYSTEM] Console session initialized. Server is ${server.status.toLowerCase()}.`];
};

export const useServerStore = create<ServerState>((set, get) => {
  return {
    servers: [],
    selectedServerId: null,
    logs: {},
    deletingIds: [],

    setServers: (servers) => {
      const currentLogs = get().logs;
      const newLogs = { ...currentLogs };
      let logsUpdated = false;

      servers.forEach((server) => {
        if (!newLogs[server.id]) {
          newLogs[server.id] = generateInitialLogs(server);
          logsUpdated = true;
        }
      });

      set({
        servers,
        logs: logsUpdated ? newLogs : currentLogs,
      });
    },

    selectServer: (id) => set({ selectedServerId: id }),

    startServer: (id) => {
      const server = get().servers.find((s) => s.id === id);
      if (!server || server.status === "online" || server.status === "starting") return;

      serverService.togglePower({ id, action: "start" }).catch(console.error);

      // Transition to starting
      set((state) => ({
        servers: state.servers.map((s) =>
          s.id === id
            ? {
                ...s,
                status: "starting",
                metrics: { ...s.metrics, cpuUsage: 85, ramUsage: Math.floor(s.ramLimit * 0.2) },
              }
            : s
        ),
      }));
      get().addLog(id, `[SYSTEM] Power signal: START received.`);
    },

    stopServer: (id) => {
      const server = get().servers.find((s) => s.id === id);
      if (!server || server.status === "offline" || server.status === "stopping") return;

      serverService.togglePower({ id, action: "stop" }).catch(console.error);

      // Transition to stopping
      set((state) => ({
        servers: state.servers.map((s) =>
          s.id === id
            ? {
                ...s,
                status: "stopping",
                metrics: { ...s.metrics, cpuUsage: 45, uptime: 0 },
              }
            : s
        ),
      }));
      get().addLog(id, `[SYSTEM] Power signal: STOP received.`);
    },

    restartServer: (id) => {
      const server = get().servers.find((s) => s.id === id);
      if (!server) return;

      serverService.togglePower({ id, action: "restart" }).catch(console.error);

      // Transition to stopping as restart starts by stopping
      set((state) => ({
        servers: state.servers.map((s) =>
          s.id === id
            ? {
                ...s,
                status: "stopping",
                metrics: { ...s.metrics, cpuUsage: 45, uptime: 0 },
              }
            : s
        ),
      }));
      get().addLog(id, `[SYSTEM] Power signal: RESTART received.`);
    },

    killServer: (id) => {
      serverService.togglePower({ id, action: "kill" }).catch(console.error);
      set((state) => ({
        servers: state.servers.map((s) =>
          s.id === id
            ? {
                ...s,
                status: "offline",
                currentPlayers: 0,
                metrics: { cpuUsage: 0, ramUsage: 0, uptime: 0 },
              }
            : s
        ),
      }));
      get().addLog(id, `[SYSTEM] Power signal: FORCE KILL applied immediately.`);
    },

    addServer: (newServerData) => {
      // Handled directly via React Query mutation
    },

    deleteServer: (id) => {
      set((state) => ({
        deletingIds: [...state.deletingIds, id],
        servers: state.servers.filter((s) => s.id !== id),
      }));
      serverService.delete(id)
        .catch(console.error)
        .finally(() => {
          set((state) => ({
            deletingIds: state.deletingIds.filter((x) => x !== id),
          }));
        });
    },

    updateServer: (id, updates) => {
      serverService.update({ id, data: updates }).catch(console.error);
      set((state) => ({
        servers: state.servers.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      }));
    },

    addLog: (serverId, log) => {
      const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const formattedLog = `[${timestamp}] ${log}`;
      set((state) => ({
        logs: {
          ...state.logs,
          [serverId]: [...(state.logs[serverId] || []), formattedLog].slice(-200), // keep last 200 logs
        },
      }));
    },

    clearLogs: (serverId) => {
      set((state) => ({
        logs: {
          ...state.logs,
          [serverId]: [`[SYSTEM] Logs cleared.`],
        },
      }));
    },

    tickMetrics: () => {
      set((state) => ({
        servers: state.servers.map((s) => {
          if (s.status !== "online") return s;

          // Uptime increment
          const nextUptime = s.metrics.uptime + 2;

          // CPU micro-variance: small fluctuation around the actual value
          const cpuDelta = (Math.random() - 0.5) * 1.5;
          const targetCpu = Math.min(s.cpuLimit, Math.max(0, Number((s.metrics.cpuUsage + cpuDelta).toFixed(1))));

          // RAM micro-variance: small fluctuation around the actual value
          const ramDelta = (Math.random() - 0.5) * 8; // max 4MB diff
          const targetRam = Math.min(s.ramLimit, Math.max(0, Math.floor(s.metrics.ramUsage + ramDelta)));

          return {
            ...s,
            metrics: {
              cpuUsage: targetCpu,
              ramUsage: targetRam,
              uptime: nextUptime,
            },
          };
        }),
      }));
    },
  };
});
