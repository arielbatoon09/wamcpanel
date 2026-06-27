"use client";

import { AnimatePresence, motion } from "motion/react";
import { Server } from "lucide-react";
import { ServerCard } from "@/components/features/dashboard/server-card";
import { ServerAPIResponse } from "@/constants/servers";

interface ServerGridProps {
  servers: ServerAPIResponse[];
  isLoading: boolean;
}

export function ServerGrid({ servers, isLoading }: ServerGridProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="mt-2 font-mono text-xs tracking-wider text-muted-foreground/60 uppercase">Loading Servers...</span>
      </div>
    );
  }

  return (
    <AnimatePresence mode="popLayout">
      {servers.length > 0 ? (
        <motion.div key="server-grid" layout className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {servers.map((server) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </motion.div>
      ) : (
        <motion.div
          key="empty-state"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 p-12"
        >
          <Server className="mb-3 h-10 w-10 stroke-[1.5] text-muted-foreground" />
          <h4 className="text-base font-semibold">No Servers Found</h4>
          <p className="mt-1 max-w-sm text-center text-xs text-muted-foreground">Adjust your filters or deploy a new Minecraft server instance to start managing.</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
