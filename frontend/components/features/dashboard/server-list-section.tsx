"use client";

import { useState, useEffect } from "react";
import { useServerStore } from "@/hooks/useServerStore";
import { useServers } from "@/services/server-service";
import { ServerFiltersBar } from "@/components/features/dashboard/server-filters-bar";
import { ServerGrid } from "@/components/features/dashboard/server-grid";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

interface Filters {
  search: string;
  status: string;
  software: string;
}

export function ServerListSection() {
  const { data: apiServers, isLoading: apiLoading } = useServers({
    refetchInterval: 3000,
  });
  const { setServers } = useServerStore();
  const [filters, setFilters] = useState<Filters>({ search: "", status: "all", software: "all" });

  // Sync API data into the store for other parts of the app that need it
  useEffect(() => {
    if (apiServers) setServers(apiServers);
  }, [apiServers, setServers]);

  // Filtering derived directly from apiServers (no Zustand round-trip delay)
  const filteredServers = (apiServers ?? []).filter((server) => {
    const matchesSearch = server.name.toLowerCase().includes(filters.search.toLowerCase()) || server.host.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === "all" || server.status.toLowerCase() === filters.status;
    const matchesSoftware = filters.software === "all" || server.software === filters.software;
    return matchesSearch && matchesStatus && matchesSoftware;
  });

  return (
    <div className="space-y-6">
      {/* Toolbar: Filters + Add Server */}
      <div className="rounded-xl border border-border bg-card/40 p-4 backdrop-blur-md">
        <ServerFiltersBar onFiltersChange={setFilters}>
          <Button asChild className="h-10 cursor-pointer gap-1.5 px-4 font-semibold shadow-xs">
            <Link href="/servers/create">
              <Plus className="h-4 w-4" />
              Add Server
            </Link>
          </Button>
        </ServerFiltersBar>
      </div>

      {/* Server Grid */}
      <ServerGrid servers={filteredServers} isLoading={apiLoading} />
    </div>
  );
}
