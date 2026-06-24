"use client"

import { useState } from "react"
import { useServerStore } from "@/hooks/useServerStore"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileCode, Plus, Trash2 } from "lucide-react"

export function ServerFilesTab({ id }: { id: string }) {
  const { addLog } = useServerStore()
  const [newFileName, setNewFileName] = useState("")
  const [files, setFiles] = useState([
    { name: "world", isDir: true, size: "-" },
    { name: "plugins", isDir: true, size: "-" },
    { name: "server.properties", isDir: false, size: "4.2 KB" },
    { name: "spigot.yml", isDir: false, size: "8.1 KB" },
    { name: "bukkit.yml", isDir: false, size: "2.3 KB" },
    { name: "ops.json", isDir: false, size: "120 B" },
    { name: "usercache.json", isDir: false, size: "18.5 KB" },
  ])

  const handleAddFile = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFileName.trim()) return
    setFiles([...files, { name: newFileName.trim(), isDir: false, size: "0 B" }])
    addLog(id, `[SYSTEM] File created: ${newFileName}`)
    setNewFileName("")
  }

  const handleDeleteFile = (name: string) => {
    setFiles(files.filter((f) => f.name !== name))
    addLog(id, `[SYSTEM] File deleted: ${name}`)
  }

  return (
    <Card className="p-5 border border-border/80 bg-card/65 animate-in fade-in duration-300 lg:h-full min-h-[450px] flex flex-col">
      <div className="flex justify-between items-center border-b border-border pb-3 shrink-0 mb-4">
        <h3 className="font-bold text-sm uppercase tracking-wider font-mono">Files</h3>
        <form onSubmit={handleAddFile} className="flex gap-2">
          <Input
            placeholder="new-file.txt"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            className="h-8 text-xs max-w-[200px]"
          />
          <Button type="submit" size="sm" className="h-8 text-xs font-semibold cursor-pointer">
            <Plus className="h-3.5 w-3.5 mr-1" />
            New File
          </Button>
        </form>
      </div>

      <div className="overflow-auto flex-1 min-h-0 pr-1">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-left">
              <th className="py-2 font-semibold">Name</th>
              <th className="py-2 font-semibold">Size</th>
              <th className="py-2 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {files.map((file) => (
              <tr key={file.name} className="hover:bg-secondary/30">
                <td className="py-2.5 flex items-center gap-2">
                  <FileCode className={`h-4 w-4 ${file.isDir ? "text-amber-500" : "text-muted-foreground"}`} />
                  <span className={file.isDir ? "font-semibold text-foreground/90" : "text-foreground/80"}>
                    {file.name}
                  </span>
                </td>
                <td className="py-2.5 text-muted-foreground">{file.size}</td>
                <td className="py-2.5 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteFile(file.name)}
                    className="h-7 w-7 text-muted-foreground hover:text-rose-500 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
