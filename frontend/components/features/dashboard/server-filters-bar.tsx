"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ServerFiltersBarProps {
  onFiltersChange: (filters: { search: string; status: string; software: string }) => void;
}

export function ServerFiltersBar({ onFiltersChange }: ServerFiltersBarProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [softwareFilter, setSoftwareFilter] = useState("all");

  const emit = (patch: Partial<{ search: string; status: string; software: string }>) => {
    const next = { search, status: statusFilter, software: softwareFilter, ...patch };
    onFiltersChange(next);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    emit({ search: val });
  };
  const handleStatus = (val: string) => {
    setStatusFilter(val);
    emit({ status: val });
  };
  const handleSoftware = (val: string) => {
    setSoftwareFilter(val);
    emit({ software: val });
  };

  return (
    <>
      <div className="relative w-full md:max-w-sm">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search servers..." value={search} onChange={(e) => handleSearch(e.target.value)} className="h-10 w-full pl-9" />
      </div>

      <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={handleStatus}>
          <SelectTrigger className="h-10 w-[130px] cursor-pointer">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">
              All Statuses
            </SelectItem>
            <SelectItem value="online" className="cursor-pointer">
              Online
            </SelectItem>
            <SelectItem value="offline" className="cursor-pointer">
              Offline
            </SelectItem>
            <SelectItem value="starting" className="cursor-pointer">
              Starting
            </SelectItem>
            <SelectItem value="stopping" className="cursor-pointer">
              Stopping
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Software Filter */}
        <Select value={softwareFilter} onValueChange={handleSoftware}>
          <SelectTrigger className="h-10 w-[130px] cursor-pointer">
            <SelectValue placeholder="Software" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">
              All Software
            </SelectItem>
            <SelectItem value="Vanilla" className="cursor-pointer">
              Vanilla
            </SelectItem>
            <SelectItem value="Paper" className="cursor-pointer">
              Paper
            </SelectItem>
            <SelectItem value="Modpack" className="cursor-pointer">
              Modpack
            </SelectItem>
            <SelectItem value="Fabric" className="cursor-pointer">
              Fabric
            </SelectItem>
            <SelectItem value="Bedrock" className="cursor-pointer">
              Bedrock
            </SelectItem>
            <SelectItem value="Forge" className="cursor-pointer">
              Forge
            </SelectItem>
            <SelectItem value="NeoForge" className="cursor-pointer">
              NeoForge
            </SelectItem>
            <SelectItem value="Quilt" className="cursor-pointer">
              Quilt
            </SelectItem>
            <SelectItem value="Velocity" className="cursor-pointer">
              Velocity
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
