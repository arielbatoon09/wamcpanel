"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Users, Trash2, ShieldAlert } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

export function AccessSection() {
  const [users, setUsers] = useState([
    { id: "u-1", name: "Admin User", email: "owner@mcpanel.local", role: "Owner" },
    { id: "u-2", name: "Moderator Mike", email: "mike@mcpanel.local", role: "Admin" },
    { id: "u-3", name: "Developer Dan", email: "dan@mcpanel.local", role: "Support" },
  ])

  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("Support")

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return

    const newUser = {
      id: `u-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role,
    }

    setUsers([...users, newUser])
    toast.success(`Invitation sent to ${email}`)
    
    // Reset state
    setName("")
    setEmail("")
    setRole("Support")
    setOpen(false)
  }

  const handleDelete = (userId: string, userEmail: string) => {
    if (confirm(`Remove access for ${userEmail}?`)) {
      setUsers(users.filter((u) => u.id !== userId))
      toast.info(`Removed user ${userEmail}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card/40 border border-border p-4 rounded-xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">User Management</span>
        </div>

        {/* Invite Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="cursor-pointer font-semibold gap-1">
              <Plus className="h-4 w-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Assign role and email address to grant access.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleInvite} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase font-mono">Name</label>
                <Input
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase font-mono">Email Address</label>
                <Input
                  placeholder="john@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase font-mono">Role Level</label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin" className="cursor-pointer">Administrator</SelectItem>
                    <SelectItem value="Support" className="cursor-pointer">Support Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-4 border-t border-border mt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="cursor-pointer">
                  Cancel
                </Button>
                <Button type="submit" className="cursor-pointer">Send Invite</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users table */}
      <Card className="p-5 border border-border bg-card/65">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2.5 font-semibold">User</th>
                <th className="py-2.5 font-semibold">Email</th>
                <th className="py-2.5 font-semibold">Role</th>
                <th className="py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-secondary/35">
                  <td className="py-3 font-semibold text-foreground/90">{user.name}</td>
                  <td className="py-3 text-muted-foreground">{user.email}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      user.role === "Owner" 
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : user.role === "Admin"
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {user.role !== "Owner" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(user.id, user.email)}
                        className="h-7 w-7 text-muted-foreground hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
