import { ServerListSection } from "@/components/features/dashboard/server-list-section"

export const metadata = {
  title: "Minecraft Server Panel - Servers",
  description: "Manage and monitor all your deployed Minecraft servers in real-time.",
}

export default function ServersPage() {
  return (
    <div className="space-y-6">
      {/* Page Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Servers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage and monitor all your deployed Minecraft servers in real-time.
        </p>
      </div>

      {/* Servers List Section */}
      <section aria-label="Servers List">
        <ServerListSection />
      </section>
    </div>
  )
}
