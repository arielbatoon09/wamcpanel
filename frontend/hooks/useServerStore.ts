import { create } from "zustand";
import { ServerAPIResponse } from "@/constants/servers";
import { serverService } from "@/services/server-service";

interface ServerState {
  servers: ServerAPIResponse[];
  selectedServerId: string | null;
  logs: Record<string, string[]>;

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
  if (server.status === "offline") {
    return ["[SYSTEM] Server is currently offline."];
  }
  return [
    `[SYSTEM] Server loaded from database.`,
    `[${server.software}] Loading libraries, please wait...`,
    `[${server.software}] Starting minecraft server version ${server.version}`,
    `[${server.software}] Loading properties`,
    `[${server.software}] Default game type: SURVIVAL`,
    `[${server.software}] Generating keypair`,
    `[${server.software}] Starting Minecraft server on ${server.host}:${server.port}`,
    `[${server.software}] Preparing level "world"`,
    `[${server.software}] Preparing start region for dimension minecraft:overworld`,
    `[${server.software}] Time elapsed: 1420 ms`,
    `[${server.software}] Done (${(Math.random() * 2 + 1).toFixed(3)}s)! For help, type "help"`,
    `[SYSTEM] Server status: ${server.status.toUpperCase()}`,
  ];
};

export const useServerStore = create<ServerState>((set, get) => {
  return {
    servers: [],
    selectedServerId: null,
    logs: {},

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
      get().addLog(id, `[${server.software}] Loading jar file and allocating memory...`);

      // Complete starting sequence in 3 seconds
      setTimeout(() => {
        set((state) => ({
          servers: state.servers.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status: "online",
                  metrics: { ...s.metrics, cpuUsage: 12.4, ramUsage: Math.floor(s.ramLimit * 0.5), uptime: 1 },
                }
              : s
          ),
        }));
        get().addLog(id, `[${server.software}] Preparing spawn area...`);
        get().addLog(id, `[${server.software}] Done! Server is now ONLINE.`);
      }, 3000);
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
      get().addLog(id, `[${server.software}] Saving players...`);
      get().addLog(id, `[${server.software}] Saving worlds...`);

      // Complete stopping sequence in 2 seconds
      setTimeout(() => {
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
        get().addLog(id, `[SYSTEM] Server shutdown complete. STATUS: OFFLINE.`);
      }, 2000);
    },

    restartServer: (id) => {
      serverService.togglePower({ id, action: "restart" }).catch(console.error);
      get().addLog(id, `[SYSTEM] Power signal: RESTART received.`);
      get().stopServer(id);
      setTimeout(() => {
        get().startServer(id);
      }, 2500);
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
      serverService.delete(id).catch(console.error);
      set((state) => ({
        servers: state.servers.filter((s) => s.id !== id),
      }));
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

          // CPU variance: random float between 2% and 40% (within bounds of cpuLimit)
          const randomCpuFactor = Math.random();
          const targetCpu = Math.min(s.cpuLimit, Number((2 + randomCpuFactor * 35).toFixed(1)));

          // RAM usage variance: small changes around existing usage
          const ramDelta = (Math.random() - 0.5) * 50; // max 25MB diff
          const targetRam = Math.min(s.ramLimit - 100, Math.max(256, Math.floor(s.metrics.ramUsage + ramDelta)));

          // Player count fluctuations occasionally
          let targetPlayers = s.currentPlayers;
          if (Math.random() > 0.85) {
            const playerDelta = Math.random() > 0.5 ? 1 : -1;
            targetPlayers = Math.min(s.maxPlayers, Math.max(0, s.currentPlayers + playerDelta));
          }

          return {
            ...s,
            currentPlayers: targetPlayers,
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
