"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Cpu, HardDrive, Network, Database, Server, Settings } from "lucide-react"

export function MetricsSection() {
  const [cpu, setCpu] = useState(24.5)
  const [ram, setRam] = useState(18.2) // in GB
  const [disk, setDisk] = useState(384) // in GB
  const [netIn, setNetIn] = useState(4.2) // Mbps
  const [netOut, setNetOut] = useState(8.7) // Mbps

  // Tick metrics to make them feel alive
  useEffect(() => {
    const interval = setInterval(() => {
      setCpu((prev) => Math.min(100, Math.max(5, prev + (Math.random() - 0.5) * 8)))
      setRam((prev) => Math.min(60, Math.max(10, prev + (Math.random() - 0.5) * 0.4)))
      setNetIn((prev) => Math.min(50, Math.max(1, prev + (Math.random() - 0.5) * 2)))
      setNetOut((prev) => Math.min(100, Math.max(1, prev + (Math.random() - 0.5) * 4)))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU */}
        <Card className="p-4 border border-border bg-card/65 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">Host CPU Load</p>
              <h3 className="text-xl font-bold font-mono mt-1">{cpu.toFixed(1)}%</h3>
            </div>
            <div className="p-2 rounded-lg bg-secondary">
              <Cpu className="h-4 w-4 text-primary" />
            </div>
          </div>
          <Progress value={cpu} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground font-mono">12 of 16 Cores Active</p>
        </Card>

        {/* Memory */}
        <Card className="p-4 border border-border bg-card/65 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">Host Memory</p>
              <h3 className="text-xl font-bold font-mono mt-1">{ram.toFixed(1)} / 64.0 GB</h3>
            </div>
            <div className="p-2 rounded-lg bg-secondary">
              <HardDrive className="h-4 w-4 text-primary" />
            </div>
          </div>
          <Progress value={(ram / 64) * 100} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground font-mono">DDR4 ECC Server RAM</p>
        </Card>

        {/* Disk */}
        <Card className="p-4 border border-border bg-card/65 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">SSD Storage</p>
              <h3 className="text-xl font-bold font-mono mt-1">{disk} / 960 GB</h3>
            </div>
            <div className="p-2 rounded-lg bg-secondary">
              <Database className="h-4 w-4 text-primary" />
            </div>
          </div>
          <Progress value={(disk / 960) * 100} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground font-mono">NVMe Enterprise SSD</p>
        </Card>

        {/* Network */}
        <Card className="p-4 border border-border bg-card/65 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">Bandwidth</p>
              <h3 className="text-xl font-bold font-mono mt-1">
                In: {netIn.toFixed(1)} / Out: {netOut.toFixed(1)} M
              </h3>
            </div>
            <div className="p-2 rounded-lg bg-secondary">
              <Network className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-2 pt-1 border-t border-border/30">
            <span>Inbound traffic</span>
            <span>Outbound traffic</span>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono">1 Gbps Port Speed</p>
        </Card>
      </div>

      {/* Host Specifications details */}
      <Card className="p-5 border border-border bg-card/65 space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Server className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm uppercase tracking-wider font-mono">Hardware Environment</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
          <div className="space-y-2">
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Processor</span>
              <span className="font-semibold">AMD Ryzen 9 5950X</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Clock Speed</span>
              <span className="font-semibold">3.4 GHz (4.9 GHz Turbo)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Cores & Threads</span>
              <span className="font-semibold">16 Cores / 32 Threads</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Virtualization Mode</span>
              <span className="font-semibold text-emerald-500">KVM (Enabled)</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Operating System</span>
              <span className="font-semibold">Ubuntu 22.04 LTS (x86_64)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Kernel Version</span>
              <span className="font-semibold">5.15.0-88-generic</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Server Uptime</span>
              <span className="font-semibold">42 Days, 18 Hours</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Local IP Binding</span>
              <span className="font-semibold">192.168.1.100</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
