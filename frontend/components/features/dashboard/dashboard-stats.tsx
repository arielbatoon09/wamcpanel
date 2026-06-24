"use client"

import { useServerStore } from "@/hooks/useServerStore"
import { MetricCard } from "@/components/common/metric-card"
import { Server, Users, Cpu, HardDrive } from "lucide-react"
import { useEffect } from "react"

export function DashboardStats() {
  const { servers, tickMetrics } = useServerStore()

  // Periodically update mock metrics
  useEffect(() => {
    const timer = setInterval(() => {
      tickMetrics()
    }, 2000)
    return () => clearInterval(timer)
  }, [tickMetrics])

  const totalServers = servers.length
  const onlineServers = servers.filter((s) => s.status === "online").length

  let totalPlayers = 0
  let maxPlayers = 0
  let totalRamAllocated = 0
  let totalRamUsage = 0
  let totalCpuUsage = 0

  servers.forEach((s) => {
    maxPlayers += s.maxPlayers
    if (s.status === "online") {
      totalPlayers += s.currentPlayers
      totalRamAllocated += s.ramLimit
      totalRamUsage += s.metrics.ramUsage
      totalCpuUsage += s.metrics.cpuUsage
    }
  })

  // Global percentages
  const playerPercent = maxPlayers > 0 ? (totalPlayers / maxPlayers) * 100 : 0
  const ramPercent = totalRamAllocated > 0 ? (totalRamUsage / totalRamAllocated) * 100 : 0
  const avgCpuUsage = onlineServers > 0 ? totalCpuUsage / onlineServers : 0
  const totalCpusLimit = servers.reduce((acc, s) => acc + (s.status === "online" ? s.cpuLimit : 0), 0)
  const cpuPercent = totalCpusLimit > 0 ? (totalCpuUsage / totalCpusLimit) * 100 : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Servers online"
        value={`${onlineServers} / ${totalServers}`}
        percentage={totalServers > 0 ? (onlineServers / totalServers) * 100 : 0}
        icon={Server}
        subtext={`${totalServers - onlineServers} servers currently offline`}
      />
      <MetricCard
        title="Total Players"
        value={`${totalPlayers} / ${maxPlayers}`}
        percentage={playerPercent}
        icon={Users}
        subtext="Live concurrent players count"
      />
      <MetricCard
        title="Global RAM Allocation"
        value={`${(totalRamUsage / 1024).toFixed(1)} GB / ${(totalRamAllocated / 1024).toFixed(1)} GB`}
        percentage={ramPercent}
        icon={HardDrive}
        subtext="Physical host memory usage"
      />
      <MetricCard
        title="Average CPU Load"
        value={`${avgCpuUsage.toFixed(1)}%`}
        percentage={cpuPercent}
        icon={Cpu}
        subtext={`Total allocated capacity: ${totalCpusLimit}%`}
      />
    </div>
  )
}
