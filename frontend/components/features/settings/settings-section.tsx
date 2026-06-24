"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Settings, Shield, Mail, Database } from "lucide-react"

export function SettingsSection() {
  const [panelName, setPanelName] = useState("Server Panel")
  const [sshKey, setSshKey] = useState("ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQD...")
  const [backupPath, setBackupPath] = useState("/var/backups/mcpanel")
  
  // Mail
  const [smtpHost, setSmtpHost] = useState("smtp.mailgun.org")
  const [smtpPort, setSmtpPort] = useState("587")
  const [smtpUser, setSmtpUser] = useState("postmaster@mcpanel.local")

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Panel configuration updated successfully")
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex justify-between items-center bg-card/40 border border-border p-4 rounded-xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">Global Panel Settings</span>
        </div>
        <Button type="submit" size="sm" className="font-semibold cursor-pointer">
          Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Core settings */}
        <Card className="p-5 border border-border bg-card/65 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Shield className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm uppercase tracking-wider font-mono">General Configurations</h3>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="space-y-1.5">
              <label className="text-muted-foreground uppercase font-semibold">Panel Name</label>
              <Input value={panelName} onChange={(e) => setPanelName(e.target.value)} className="h-9" />
            </div>

            <div className="space-y-1.5">
              <label className="text-muted-foreground uppercase font-semibold">SSH Authorized Keys</label>
              <textarea
                value={sshKey}
                onChange={(e) => setSshKey(e.target.value)}
                className="w-full min-h-[100px] bg-background border border-border rounded-md p-2 text-xs font-mono outline-ring/50"
              />
            </div>
          </div>
        </Card>

        {/* Database & Backup Settings */}
        <div className="space-y-6">
          <Card className="p-5 border border-border bg-card/65 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Database className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm uppercase tracking-wider font-mono">Storage & Backups</h3>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-muted-foreground uppercase font-semibold">System Backup Path</label>
                <Input value={backupPath} onChange={(e) => setBackupPath(e.target.value)} className="h-9" />
              </div>
            </div>
          </Card>

          {/* Email Settings */}
          <Card className="p-5 border border-border bg-card/65 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Mail className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm uppercase tracking-wider font-mono">SMTP Mail Settings</h3>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-muted-foreground uppercase font-semibold">SMTP Host</label>
                <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className="h-9" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-muted-foreground uppercase font-semibold">SMTP User</label>
                  <Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-muted-foreground uppercase font-semibold">SMTP Port</label>
                  <Input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} className="h-9" />
                </div>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </form>
  )
}
