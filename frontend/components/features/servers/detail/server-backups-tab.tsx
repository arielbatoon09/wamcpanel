"use client"

import { useState } from "react"
import { useServerStore } from "@/hooks/useServerStore"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Database, CheckCircle2, RotateCcw, Trash2 } from "lucide-react"

export function ServerBackupsTab({ id }: { id: string }) {
  const { addLog } = useServerStore()
  const [backups, setBackups] = useState([
    { id: "bk-1", name: "Backup-2026-06-23-BeforeUpdate", size: "482 MB", date: "2026-06-23 18:30" },
    { id: "bk-2", name: "Backup-2026-06-20-Daily", size: "450 MB", date: "2026-06-20 04:00" },
    { id: "bk-3", name: "Backup-2026-06-18-Weekly", size: "1.2 GB", date: "2026-06-18 02:00" },
    { id: "bk-4", name: "Backup-2026-06-15-System", size: "430 MB", date: "2026-06-15 11:15" },
    { id: "bk-5", name: "Backup-2026-06-10-PreMigration", size: "510 MB", date: "2026-06-10 14:05" },
    { id: "bk-6", name: "Backup-2026-06-08-Daily", size: "445 MB", date: "2026-06-08 04:00" },
    { id: "bk-7", name: "Backup-2026-06-05-PluginsUpdate", size: "480 MB", date: "2026-06-05 10:20" },
    { id: "bk-8", name: "Backup-2026-06-01-Monthly", size: "1.1 GB", date: "2026-06-01 02:00" },
    { id: "bk-9", name: "Backup-2026-05-28-Daily", size: "440 MB", date: "2026-05-28 04:00" },
    { id: "bk-10", name: "Backup-2026-05-25-Daily", size: "441 MB", date: "2026-05-25 04:00" },
    { id: "bk-11", name: "Backup-2026-05-22-Daily", size: "438 MB", date: "2026-05-22 04:00" },
    { id: "bk-12", name: "Backup-2026-05-18-Weekly", size: "1.05 GB", date: "2026-05-18 02:00" },
    { id: "bk-13", name: "Backup-2026-05-15-Daily", size: "435 MB", date: "2026-05-15 04:00" },
    { id: "bk-14", name: "Backup-2026-05-10-SecurityFix", size: "460 MB", date: "2026-05-10 16:45" },
  ])
  const [searchBackup, setSearchBackup] = useState("")
  const [backupPage, setBackupPage] = useState(1)

  const handleCreateBackup = () => {
    const dateStr = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '').substring(0, 16)
    const newBk = {
      id: `bk-${Date.now()}`,
      name: `Backup-${new Date().toISOString().slice(0, 10)}-Manual`,
      size: `${(Math.random() * 50 + 400).toFixed(0)} MB`,
      date: dateStr,
    }
    setBackups([newBk, ...backups])
    addLog(id, `[SYSTEM] Backup created successfully: ${newBk.name}`)
  }

  const handleDeleteBackup = (bkId: string) => {
    const bk = backups.find((b) => b.id !== bkId)
    setBackups(backups.filter((b) => b.id !== bkId))
    if (bk) addLog(id, `[SYSTEM] Backup deleted: ${bk.name}`)
  }

  const handleRestoreBackup = (bkId: string) => {
    const bk = backups.find((b) => b.id === bkId)
    if (bk) {
      addLog(id, `[SYSTEM] Initiated restore process for: ${bk.name}...`)
      toast.promise(
        new Promise((resolve) => setTimeout(resolve, 1500)),
        {
          loading: `Restoring data from ${bk.name}...`,
          success: () => {
            addLog(id, `[SYSTEM] Backup ${bk.name} restored successfully. Server file system updated.`)
            return `Backup restored successfully`
          },
          error: "Failed to restore backup",
        }
      )
    }
  }

  const PAGE_SIZE = 7
  const filtered = backups.filter((b) => b.name.toLowerCase().includes(searchBackup.toLowerCase()))
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const currentPage = Math.min(backupPage, Math.max(1, totalPages))
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const startIndex = (currentPage - 1) * PAGE_SIZE

  return (
    <Card className="p-5 border border-border/80 bg-card/65 animate-in fade-in duration-300 lg:h-full min-h-[450px] flex flex-col">
      <div className="flex justify-between items-center border-b border-border pb-3 shrink-0 mb-4 gap-4">
        <h3 className="font-bold text-sm uppercase tracking-wider font-mono shrink-0">Backups</h3>
        <div className="flex items-center gap-2 flex-1 justify-end max-w-[400px]">
          <Input
            placeholder="Search backups..."
            value={searchBackup}
            onChange={(e) => {
              setSearchBackup(e.target.value)
              setBackupPage(1)
            }}
            className="h-8 text-xs max-w-[180px]"
          />
          <Button onClick={handleCreateBackup} size="sm" className="h-8 text-xs font-semibold cursor-pointer shrink-0">
            <Database className="h-3.5 w-3.5 mr-1" />
            Create Backup
          </Button>
        </div>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {paginated.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-8 font-mono">No backups found matching "{searchBackup}"</div>
        ) : (
          paginated.map((bk) => (
            <div
              key={bk.id}
              className="p-3 border border-border rounded-xl bg-secondary/20 flex justify-between items-center font-mono text-xs animate-in fade-in duration-150"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <div>
                  <span className="font-bold text-foreground/90">{bk.name}</span>
                  <div className="text-[10px] text-muted-foreground mt-0.5 flex gap-2">
                    <span>Size: {bk.size}</span>
                    <span>Date: {bk.date}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 items-center shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRestoreBackup(bk.id)}
                  className="h-7 w-7 text-muted-foreground hover:text-emerald-500 cursor-pointer"
                  title="Restore Backup"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteBackup(bk.id)}
                  className="h-7 w-7 text-muted-foreground hover:text-rose-500 cursor-pointer"
                  title="Delete Backup"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-3.5 shrink-0 mt-4 text-xs font-mono text-muted-foreground select-none">
          <span>
            Showing {startIndex + 1} to {Math.min(startIndex + PAGE_SIZE, filtered.length)} of {filtered.length} backups
          </span>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setBackupPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="cursor-pointer h-7 text-[10px] border-border"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setBackupPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="cursor-pointer h-7 text-[10px] border-border"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
